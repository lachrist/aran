/* eslint-disable arrow-body-style */

import {slice, map, concat} from "array-lite";

import {format, expect, assert} from "../../util.mjs";

import {
  extractNode,
  makeScriptProgram,
  makeModuleProgram,
  makeEvalProgram,
  makeImportLink,
  makeExportLink,
  makeAggregateLink,
  makeBlock,
  makeCompletionStatement,
  makeEffectStatement,
  makeReturnStatement,
  makeBreakStatement,
  makeDebuggerStatement,
  makeDeclareEnclaveStatement,
  makeBlockStatement,
  makeIfStatement,
  makeWhileStatement,
  makeTryStatement,
  makeSetSuperEnclaveEffect,
  makeWriteEffect,
  makeWriteInputEffect,
  makeWriteEnclaveEffect,
  makeExportEffect,
  makeSequenceEffect,
  makeConditionalEffect,
  makeExpressionEffect,
  makeInputExpression,
  makePrimitiveExpression,
  makeIntrinsicExpression,
  makeStaticImportExpression,
  makeReadExpression,
  makeReadEnclaveExpression,
  makeTypeofEnclaveExpression,
  makeClosureExpression,
  makeAwaitExpression,
  makeYieldExpression,
  makeThrowExpression,
  makeSequenceExpression,
  makeConditionalExpression,
  makeGetSuperEnclaveExpression,
  makeCallSuperEnclaveExpression,
  makeEvalExpression,
  makeDynamicImportExpression,
  makeApplyExpression,
  makeConstructExpression,
  makeUnaryExpression,
  makeBinaryExpression,
  makeObjectExpression,
} from "../ast/index.mjs";

const {
  SyntaxError,
  Reflect: {apply},
  String: {prototype: substring},
  JSON: {stringify: stringifyJSON},
} = globalThis;

/////////////
// Keyword //
/////////////

const COMPLETION_KEYWORD = "completion";
const MODULE_PROGRAM_KEYWORD = "module";
const SCRIPT_PROGRAM_KEYWORD = "script";
const EVAL_PROGRAM_KEYWORD = "eval";
const EFFECT_KEYWORD = "void";
const EVAL_KEYWORD = "eval";
const UNDEFINED_KEYWORD = "undefined";
const INPUT_KEYWORD = "input";
const INTRINSIC_KEYWORD = "intrinsic";
const SELF_SOURCE_KEYWORD = "self";
const EXPORT_STATIC_KEYWORD = "exportStatic";
const IMPORT_STATIC_KEYWORD = "importStatic";

////////////////
// Identifier //
////////////////

const BASE_HEAD = "$";
const META_HEAD = "_";
const SUPER_BASE_IDENTIFIER = `${BASE_HEAD}super`;
const getIdentifierHead = (identifier) => identifier[0];
const getIdentifierBody = (identifier) =>
  apply(substring, identifier, [1, identifier.length]);

/////////////
// Enclave //
/////////////

const enclaves = {
  __proto__: null,
  super_get: "super.get",
  super_set: "super.set",
  super_call: "super.call",
  new_target: "new.target",
  this: "this",
  arguments: "arguments",
  var: "var",
};

///////////
// Error //
///////////

const TEMPLATE = "Syntax error on node %s at %j:%j";
const extractNodeInfo = (node) => [
  node.type,
  node.loc.start.line,
  node.loc.start.column,
];
const makeSyntaxError = (node) =>
  new SyntaxError(format(TEMPLATE, extractNodeInfo(node)));
const expectSyntax = (node, check) => {
  expect(check, SyntaxError, TEMPLATE, extractNodeInfo(node));
};

///////////
// Visit //
///////////

const generateVisit = (visitors) => (node) => {
  expectSyntax(node, node.type in visitors);
  const visitor = visitors[node.type];
  return visitor(node);
};

const visitEnclaveDeclarator = (node) => {
  assert(node.type === "VariableDeclarator", "invalid variable declarator");
  expectSyntax(node, node.init === null);
  expectSyntax(node, node.id.type === "Identifier");
  const head = getIdentifierHead(node.id.name);
  const body = getIdentifierBody(node.id.name);
  expectSyntax(node, head === BASE_HEAD);
  expectSyntax(node, body in enclaves);
  return enclaves[body];
};

const visitMetaDeclarator = (node) => {
  assert(node.type === "VariableDeclarator", "invalid variable declarator");
  expectSyntax(node, node.id.type === "Identifier");
  expectSyntax(node, node.init === null);
  const head = getIdentifierHead(node.id.name);
  const body = getIdentifierBody(node.id.name);
  expectSyntax(node, head === META_HEAD);
  return body;
};

export const visitProgram = generateVisit({
  __proto__: null,
  Program: (node) => {
    expectSyntax(node, node.body.length > 0);
    expectSyntax(node, node.body[0].type === "ExpressionStatement");
    expectSyntax(node, node.body[0].expression.type === "Literal");
    const kind = node.body[0].expression.value;
    if (kind === SCRIPT_PROGRAM_KEYWORD) {
      expectSyntax(node, node.body.length === 2);
      return makeScriptProgram(visitBlock(node.body[1]));
    }
    if (kind === MODULE_PROGRAM_KEYWORD) {
      expectSyntax(node, node.body.length > 1);
      return makeModuleProgram(
        map(visitLink, slice(node.body, 1, node.body.length - 1)),
        visitBlock(node.body[node.body.length - 1]),
      );
    }
    if (kind === EVAL_PROGRAM_KEYWORD) {
      if (node.body.length === 2) {
        return makeEvalProgram([], [], visitBlock(node.body[1]));
      }
      if (node.body.length === 3) {
        expectSyntax(node, node.body[1].type === "VariableDeclaration");
        expectSyntax(node, node.body[1].kind === "let");
        assert(
          node.body[1].declarations.length > 0,
          "empty variable declaration",
        );
        expectSyntax(
          node,
          node.body[1].declarations[0].id.type === "Identifier",
        );
        const head = getIdentifierHead(node.body[1].declarations[0].id.name);
        if (head === BASE_HEAD) {
          return makeEvalProgram(
            map(node.body[1].declarations, visitBaseEvalDeclarator),
            [],
            visitBlock(node.body[2]),
          );
        }
        if (head === META_HEAD) {
          return makeEvalProgram(
            [],
            map(node.body[1].declarations, visitMetaEvalDeclarator),
            visitBlock(node.body[2]),
          );
        }
        throw makeSyntaxError(node);
      }
      if (node.body.length === 4) {
        expectSyntax(node, node.body[1].type === "VariableDeclaration");
        expectSyntax(node, node.body[1].kind === "let");
        expectSyntax(node, node.body[2].type === "VariableDeclaration");
        expectSyntax(node, node.body[2].kind === "let");
        return makeEvalProgram(
          map(node.body[1].declarations, visitBaseEvalDeclarator),
          map(node.body[2].declarations, visitMetaEvalDeclarator),
          visitBlock(node.body[2]),
        );
      }
      throw makeSyntaxError(node);
    }
    throw makeSyntaxError(node);
  },
});

export const visitLink = generateVisit({
  __proto__: null,
  ImportDeclaration: (node) => {
    expectSyntax(node, node.specifiers.length === 0);
    return makeImportLink(node.source.value);
  },
  ExportAllDeclaration: (node) => {
    return makeAggregateLink(
      node.source.value,
      null,
      node.exported === null ? null : node.exported.name,
    );
  },
  ExportNamedDeclaration: (node) => {
    expectSyntax(node, node.source !== null);
    expectSyntax(node, node.declaration === null);
    expectSyntax(node, node.specifiers.length === 1);
    if (node.source.value === SELF_SOURCE_KEYWORD) {
      expectSyntax(
        node,
        node.specifiers[0].local.name === node.specifiers[0].exported.name,
      );
      return makeExportLink(node.specifiers[0].local.name);
    }
    return makeAggregateLink(
      node.source.value,
      node.specifiers[0].local.name,
      node.specifiers[0].exported.name,
    );
  },
});

export const visitBlock = generateVisit({
  __proto__: null,
  LabeledStatement: (node) => {
    return extractNode(
      null,
      visitBlock(node.body),
      "Block",
      (context, block, labels, identifiers, statements) =>
        makeBlock(concat([node.label.name], labels), identifiers, statements),
    );
  },
  BlockStatement: (node) => {
    if (node.body.length === 0) {
      return makeBlock([], [], []);
    }
    if (
      node.body[0].type === "VariableDeclaration" &&
      node.body[0].kind === "let" &&
      node.body[0].declarations[0].id.type === "Identifier" &&
      getIdentifierHead(node.body[0].declarations[0].id.name) === META_HEAD
    ) {
      return makeBlock(
        [],
        map(node.body[0].declarations, visitMetaDeclarator),
        map(slice(node.body, 1, node.body.length), visitStatement),
      );
    }
    return makeBlock([], [], map(node.body, visitStatement));
  },
});

export const visitStatement = generateVisit({
  __proto__: null,
  BlockStatement: (node) => {
    return makeBlockStatement(visitBlock(node.body));
  },
  TryStatement: (node) => {
    expectSyntax(node, node.handler !== null);
    expectSyntax(node, node.handler.param === null);
    expectSyntax(node, node.finalizer !== null);
    return makeTryStatement(
      visitBlock(node.block),
      visitBlock(node.handler.body),
      visitBlock(node.finalizer),
    );
  },
  IfStatement: (node) => {
    expectSyntax(node, node.alternate !== null);
    return makeIfStatement(
      visitExpression(node.test),
      visitBlock(node.consequent),
      visitBlock(node.alternate),
    );
  },
  WhileStatement: (node) => {
    return makeWhileStatement(
      visitExpression(node.test),
      visitBlock(node.body),
    );
  },
  DebuggerStatement: (node) => {
    return makeDebuggerStatement();
  },
  ExpressionStatement: (node) => {
    if (
      node.type === "CallExpression" &&
      node.callee.type === "Identifier" &&
      node.callee.name === COMPLETION_KEYWORD
    ) {
      expectSyntax(node, node.arguments.length === 1);
      return makeCompletionStatement(visitExpression(node.arguments[0]));
    }
    return visitEffect(node.expression);
  },
  ReturnStatement: (node) => {
    return makeReturnStatement(visitExpression(node.argument));
  },
  BreakStatement: (node) => {
    expectSyntax(node, node.label !== null);
    return makeBreakStatement(node.label.name);
  },
  VariableDeclaration: (node) => {
    expectSyntax(node, node.declarations.length === 1);
    expectSyntax(node, node.declarations[0].init !== null);
    expectSyntax(node, node.declarations[0].id.type === "Identifier");
    expectSyntax(
      node,
      getIdentifierHead(node.declarations[0].id.name) === BASE_HEAD,
    );
    return makeDeclareEnclaveStatement(
      node.kind,
      getIdentifierBody(node.declarations[0].id.name),
      visitExpression(node.declarations[0].init),
    );
  },
});

export const visitEffect = generateVisit({
  __proto__: null,
  SequenceExpression: (node) => {
    expectSyntax(node, node.expressions.length === 2);
    return makeSequenceEffect(
      visitEffect(node.expressions[0]),
      visitEffect(node.expressions[1]),
    );
  },
  ConditionalEffect: (node) => {
    return makeConditionalEffect(
      visitExpression(node.test),
      visitEffect(node.consequent),
      visitEffect(node.alternate),
    );
  },
  UnaryExpression: (node) => {
    expectSyntax(node, node.operator === EFFECT_KEYWORD);
    return makeExpressionEffect(visitExpression(node.argument));
  },
  CallExpression: (node) => {
    expectSyntax(node, node.callee.type === "Identifier");
    expectSyntax(node, node.callee.name === EXPORT_STATIC_KEYWORD);
    expectSyntax(node, node.arguments.length === 2);
    expectSyntax(node, node.arguments[0].type === "Literal");
    expectSyntax(node, typeof node.arguments[0].value === "string");
    return makeExportEffect(
      node.arguments[0].value,
      visitExpression(node.arguments[1]),
    );
  },
  AssignmentExpression: (node) => {
    expectSyntax(node, node.operator === "=");
    if (
      node.left.type === "MemberExpression" &&
      node.left.object.type === "Identifier" &&
      node.left.object.type === SUPER_BASE_IDENTIFIER
    ) {
      expectSyntax(node, node.left.computed);
      expectSyntax(node, !node.left.optional);
      return makeExportEffect(
        visitExpression(node.left.property),
        visitExpression(node.right),
      );
    }
    if (node.left.type === "Identifier") {
      const head = getIdentifierHead(node.left.name);
      const body = getIdentifierBody(node.left.name);
      if (head === META_HEAD) {
        return makeWriteEffect(body, visitExpression(node.right));
      }
      if (head === BASE_HEAD) {
        return makeWriteEnclaveEffect(body, visitExpression(node.right));
      }
      throw makeSyntaxError(node);
    }
    throw makeSyntaxError(node);
  },
});

const visitNonComputedKey = generateVisit({
  __proto__: null,
  Identifier: (node) => {
    return makePrimitiveExpression(stringifyJSON(node.name));
  },
  Literal: (node) => {
    return makePrimitiveExpression(node.raw);
  },
});

const visitProperty = generateVisit({
  __proto__: null,
  Property: (node) => {
    expectSyntax(node, node.kind === "init");
    expectSyntax(node, node.method === false);
    return [
      node.computed ? visitExpression(node.key) : visitNonComputedKey(node.key),
      visitExpression(node.value),
    ];
  },
});

const visitEvalEnclave = generateVisit({
  __proto__: null,
  Literal: (node) => {
    return node.value;
  },
});

const visitEvalIdentifier = generateVisit({
  __proto__: null,
  Identifier: (node) => {
    expectSyntax(node, getIdentifierHead(node.name) === META_HEAD);
    return getIdentifierBody(node.name);
  },
});

export const visitExpression = generateVisit({
  __proto__: null,
  Literal: (node) => {
    return makePrimitiveExpression(node.raw);
  },
  ArrowFunctionExpression: (node) => {
    expectSyntax(node, node.params.length === 0);
    return makeClosureExpression(
      "arrow",
      node.async,
      node.generator,
      visitBlock(node.body),
    );
  },
  FunctionExpression: (node) => {
    expectSyntax(node, node.params.length === 1);
    return makeClosureExpression(
      node.id === null ? "function" : node.id.name,
      node.async,
      node.generator,
      visitBlock(node.body),
    );
  },
  Identifier: (node) => {
    if (node.name === UNDEFINED_KEYWORD) {
      return makePrimitiveExpression("undefined");
    }
    if (node.name === INPUT_KEYWORD) {
      return makeInputExpression();
    }
    const head = getIdentifierHead(node.name);
    const body = getIdentifierBody(node.name);
    if (head === META_HEAD) {
      return makeReadExpression(body);
    }
    if (head === BASE_HEAD) {
      return makeReadEnclaveExpression(body);
    }
    throw makeSyntaxError(node);
  },
  SequenceExpression: (node) => {
    expectSyntax(node, node.expressions.length === 2);
    return makeSequenceExpression(
      visitEffect(node.expressions[0]),
      visitExpression(node.expressions[1]),
    );
  },
  ConditionalExpression: (node) => {
    return makeConditionalExpression(
      visitExpression(node.test),
      visitExpression(node.consequent),
      visitExpression(node.alternate),
    );
  },
  AwaitExpression: (node) => {
    return makeAwaitExpression(visitExpression(node.argument));
  },
  YieldExpression: (node) => {
    return makeYieldExpression(node.delegate, visitExpression(node.argument));
  },
  // Combiners //
  ImportExpression: (node) => {
    return makeDynamicImportExpression(visitExpression(node.source));
  },
  MemberExpression: (node) => {
    expectSyntax(node, node.optional === false);
    if (
      node.object.type === "Identifier" &&
      node.object.name === SUPER_BASE_IDENTIFIER
    ) {
      expectSyntax(node, node.computed === true);
      return makeGetSuperEnclaveExpression(visitExpression(node.property));
    }
    if (
      node.object.type === "Identifier" &&
      getIdentifierHead(node.object.name) === BASE_HEAD
    ) {
      expectSyntax(node, node.computed === false);
      assert(
        node.property.type === "Identifier",
        "invalid non-computed property",
      );
      return makeReadEnclaveExpression(
        `${getIdentifierBody(node.object.name)}.${node.property.name}`,
      );
    }
    throw makeSyntaxError(node);
  },
  ApplyExpression: (node) => {
    expectSyntax(node, node.optional === false);
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === SUPER_BASE_IDENTIFIER
    ) {
      expectSyntax(node, node.arguments.length === 1);
      expectSyntax(node, node.arguments[0].type === "SpreadElement");
      return makeCallSuperEnclaveExpression(
        visitExpression(node.arguments[0].argument),
      );
    }
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === INTRINSIC_KEYWORD
    ) {
      expectSyntax(node, node.arguments[0].type === "Literal");
      expectSyntax(node, typeof node.arguments[0].value === "string");
      return makeIntrinsicExpression(node.arguments[0].value);
    }
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === IMPORT_STATIC_KEYWORD
    ) {
      expectSyntax(node, node.arguments.length === 1);
      expectSyntax(node, node.arguments[0].type === "Literal");
      expectSyntax(node, typeof node.arguments[0].value === "string");
      return makeStaticImportExpression(node.arguments[0].value);
    }
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === EVAL_KEYWORD
    ) {
      expectSyntax(node, node.arguments.length === 3);
      expectSyntax(node, node.arguments[1].type === "ArrayExpression");
      expectSyntax(node, node.arguments[2].type === "ArrayExpression");
      return makeEvalExpression(
        map(node.arguments[1].elements, visitEvalEnclave),
        map(node.arguments[2].elements, visitEvalIdentifier),
        visitExpression(node.arguments[0]),
      );
    }
    expectSyntax(node, node.arguments.length > 0);
    return makeApplyExpression(
      visitExpression(node.callee),
      visitExpression(node.arguments[0]),
      map(slice(node.arguments, 1, node.arguments.length), visitExpression),
    );
  },
  NewExpression: (node) => {
    return makeConstructExpression(
      visitExpression(node.callee),
      map(node.arguments, visitExpression),
    );
  },
  UnaryExpression: (node) => {
    if (
      node.operator === "typeof" &&
      node.argument.type === "Identifier" &&
      getIdentifierHead(node.argument.name) !== META_HEAD
    ) {
      return makeTypeofEnclaveExpression(node.argument.name);
    }
    return makeUnaryExpression(node.operator, visitExpression(node.argument));
  },
  BinaryExpression: (node) => {
    return makeBinaryExpression(
      node.operator,
      visitExpression(node.left),
      visitExpression(node.right),
    );
  },
  ObjectExpression: (node) => {
    expectSyntax(node, node.properties.length > 0);
    expectSyntax(node, node.properties[0].kind === "init");
    expectSyntax(node, node.properties[0].method === false);
    expectSyntax(node, node.properties[0].computed === false);
    expectSyntax(node, node.properties[0].key.type === "Identifier");
    expectSyntax(node, node.properties[0].key.name === "__proto__");
    return makeObjectExpression(
      visitExpression(node.properties[0].value),
      map(slice(node.properties, 1, node.properties.length), visitProperty),
    );
  },
});
