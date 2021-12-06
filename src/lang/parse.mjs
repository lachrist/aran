/* eslint-disable arrow-body-style, no-use-before-define */

import {parse as parseAcornLooseOriginal} from "acorn-loose";

import {slice, map, concat, filterOut} from "array-lite";

import {format, expect, assert} from "../util.mjs";

import {
  extractNode,
  makeScriptProgram,
  makeModuleProgram,
  makeEvalProgram,
  makeImportLink,
  makeExportLink,
  makeAggregateLink,
  makeBlock,
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
  makeWriteEnclaveEffect,
  makeStaticExportEffect,
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
} from "./ast/index.mjs";

import {
  isBaseVariable,
  isMetaVariable,
  getVariableBody,
  makeBaseVariable,
} from "./variable.mjs";

import {
  MODULE_PROGRAM_KEYWORD,
  SCRIPT_PROGRAM_KEYWORD,
  EVAL_PROGRAM_KEYWORD,
  EFFECT_KEYWORD,
  THROW_KEYWORD,
  EVAL_KEYWORD,
  UNDEFINED_KEYWORD,
  INPUT_KEYWORD,
  INTRINSIC_KEYWORD,
  YIELD_DELEGATE_KEYWORD,
  YIELD_STRAIGHT_KEYWORD,
  EXPORT_STATIC_KEYWORD,
  IMPORT_STATIC_KEYWORD,
} from "./keywords.mjs";

// https://github.com/acornjs/acorn/issues/1082
const isEmptyStatement = (node) => node.type === "EmptyStatement";
const parseAcornLoose = (code, options) => {
  const node = parseAcornLooseOriginal(code, options);
  node.body = filterOut(node.body, isEmptyStatement);
  return node;
};

const {
  SyntaxError,
  JSON: {stringify: stringifyJSON},
} = globalThis;

const SUPER_BASE_IDENTIFIER = makeBaseVariable("super");

const enclaves = {
  "__proto__": null,
  "$super.get": "super.get",
  "$super.set": "super.set",
  "$super.call": "super.call",
  "$new.target": "new.target",
  "$this": "this",
  "$arguments": "arguments",
  "var": "var",
};

///////////
// Error //
///////////

const TEMPLATE = "Node %s at %j:%j";
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
  // console.log(node.type, visitors);
  expectSyntax(node, node.type in visitors);
  const visitor = visitors[node.type];
  return visitor(node);
};

const visitEnclave = generateVisit({
  __proto__: null,
  Identifier: (node) => {
    expectSyntax(node, node.name in enclaves);
    return enclaves[node.name];
  },
  MemberExpression: (node) => {
    expectSyntax(node, !node.computed);
    expectSyntax(node, !node.optional);
    expectSyntax(node, node.object.type === "Identifier");
    expectSyntax(node, node.property.type === "Identifier");
    const name = `${node.object.name}.${node.property.name}`;
    expectSyntax(node, name in enclaves);
    return enclaves[name];
  },
});

const visitMetaDeclarator = (node) => {
  assert(node.type === "VariableDeclarator", "invalid variable declarator");
  expectSyntax(node, node.init === null);
  expectSyntax(node, node.id.type === "Identifier");
  expectSyntax(node, isMetaVariable(node.id.name));
  return getVariableBody(node.id.name);
};

const visitProgram = generateVisit({
  __proto__: null,
  Program: (node) => {
    expectSyntax(node, node.body.length > 0);
    expectSyntax(node, node.body[0].type === "ExpressionStatement");
    expectSyntax(node, node.body[0].expression.type === "Identifier");
    const kind = node.body[0].expression.name;
    if (kind === SCRIPT_PROGRAM_KEYWORD) {
      return makeScriptProgram(
        map(slice(node.body, 1, node.body.length), visitStatement),
      );
    }
    if (kind === MODULE_PROGRAM_KEYWORD) {
      expectSyntax(node, node.body.length > 1);
      return makeModuleProgram(
        map(
          filterOut(
            slice(node.body, 1, node.body.length - 1),
            isEmptyStatement,
          ),
          visitLink,
        ),
        visitBlock(node.body[node.body.length - 1]),
      );
    }
    if (kind === EVAL_PROGRAM_KEYWORD) {
      if (node.body.length === 2) {
        return makeEvalProgram([], [], visitBlock(node.body[1]));
      }
      if (node.body.length === 3) {
        if (
          node.body[1].type === "VariableDeclaration" &&
          node.body[1].kind === "let"
        ) {
          return makeEvalProgram(
            [],
            map(node.body[1].declarations, visitMetaDeclarator),
            visitBlock(node.body[2]),
          );
        }
        if (
          node.body[1].type === "ExpressionStatement" &&
          node.body[1].expression.type === "ArrayExpression"
        ) {
          return makeEvalProgram(
            map(node.body[1].expression.elements, visitEnclave),
            [],
            visitBlock(node.body[2]),
          );
        }
        throw makeSyntaxError(node);
      }
      if (node.body.length === 4) {
        expectSyntax(node, node.body[1].type === "ExpressionStatement");
        expectSyntax(node, node.body[1].expression.type === "ArrayExpression");
        expectSyntax(node, node.body[2].type === "VariableDeclaration");
        expectSyntax(node, node.body[2].kind === "let");
        return makeEvalProgram(
          map(node.body[1].expression.elements, visitEnclave),
          map(node.body[2].declarations, visitMetaDeclarator),
          visitBlock(node.body[3]),
        );
      }
      throw makeSyntaxError(node);
    }
    throw makeSyntaxError(node);
  },
});

const visitLink = generateVisit({
  __proto__: null,
  ImportDeclaration: (node) => {
    if (node.specifiers.length === 0) {
      return makeImportLink(node.source.raw, null);
    }
    expectSyntax(node, node.specifiers.length === 1);
    expectSyntax(node, node.specifiers[0].type === "ImportSpecifier");
    expectSyntax(
      node,
      node.specifiers[0].imported.name === node.specifiers[0].local.name,
    );
    return makeImportLink(node.source.raw, node.specifiers[0].imported.name);
  },
  ExportAllDeclaration: (node) => {
    return makeAggregateLink(
      node.source.raw,
      null,
      node.exported === null ? null : node.exported.name,
    );
  },
  ExportNamedDeclaration: (node) => {
    expectSyntax(node, node.declaration === null);
    expectSyntax(node, node.specifiers.length === 1);
    if (node.source === null) {
      expectSyntax(
        node,
        node.specifiers[0].local.name === node.specifiers[0].exported.name,
      );
      return makeExportLink(node.specifiers[0].local.name);
    }
    return makeAggregateLink(
      node.source.raw,
      node.specifiers[0].local.name,
      node.specifiers[0].exported.name,
    );
  },
});

const visitBlock = generateVisit({
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
      isMetaVariable(node.body[0].declarations[0].id.name)
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

const visitStatement = generateVisit({
  __proto__: null,
  BlockStatement: (node) => {
    return makeBlockStatement(visitBlock(node));
  },
  LabeledStatement: (node) => {
    return makeBlockStatement(visitBlock(node));
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
    return makeEffectStatement(visitEffect(node.expression));
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
    expectSyntax(node, isBaseVariable(node.declarations[0].id.name));
    return makeDeclareEnclaveStatement(
      node.kind,
      getVariableBody(node.declarations[0].id.name),
      visitExpression(node.declarations[0].init),
    );
  },
});

const visitEffect = generateVisit({
  __proto__: null,
  SequenceExpression: (node) => {
    expectSyntax(node, node.expressions.length === 2);
    return makeSequenceEffect(
      visitEffect(node.expressions[0]),
      visitEffect(node.expressions[1]),
    );
  },
  ConditionalExpression: (node) => {
    return makeConditionalEffect(
      visitExpression(node.test),
      visitEffect(node.consequent),
      visitEffect(node.alternate),
    );
  },
  CallExpression: (node) => {
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === EXPORT_STATIC_KEYWORD
    ) {
      expectSyntax(node, node.arguments.length === 2);
      expectSyntax(node, node.arguments[0].type === "Literal");
      expectSyntax(node, typeof node.arguments[0].value === "string");
      return makeStaticExportEffect(
        node.arguments[0].value,
        visitExpression(node.arguments[1]),
      );
    }
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === EFFECT_KEYWORD
    ) {
      expectSyntax(node, node.arguments.length === 1);
      return makeExpressionEffect(visitExpression(node.arguments[0]));
    }
    throw makeSyntaxError(node);
  },
  AssignmentExpression: (node) => {
    expectSyntax(node, node.operator === "=");
    if (
      node.left.type === "MemberExpression" &&
      node.left.object.type === "Identifier" &&
      node.left.object.name === SUPER_BASE_IDENTIFIER
    ) {
      expectSyntax(node, node.left.computed);
      expectSyntax(node, !node.left.optional);
      return makeSetSuperEnclaveEffect(
        visitExpression(node.left.property),
        visitExpression(node.right),
      );
    }
    if (node.left.type === "Identifier") {
      if (isMetaVariable(node.left.name)) {
        return makeWriteEffect(
          getVariableBody(node.left.name),
          visitExpression(node.right),
        );
      }
      if (isBaseVariable(node.left.name)) {
        return makeWriteEnclaveEffect(
          getVariableBody(node.left.name),
          visitExpression(node.right),
        );
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

const visitMetaIdentifier = generateVisit({
  __proto__: null,
  Identifier: (node) => {
    expectSyntax(node, isMetaVariable(node.name));
    return getVariableBody(node.name);
  },
});

const visitExpression = generateVisit({
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
    expectSyntax(node, node.params.length === 0);
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
    if (isMetaVariable(node.name)) {
      return makeReadExpression(getVariableBody(node.name));
    }
    if (isBaseVariable(node.name)) {
      return makeReadEnclaveExpression(getVariableBody(node.name));
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
    if (node.object.type === "Identifier" && isBaseVariable(node.object.name)) {
      expectSyntax(node, node.computed === false);
      assert(
        node.property.type === "Identifier",
        "invalid non-computed property",
      );
      return makeReadEnclaveExpression(
        `${getVariableBody(node.object.name)}.${node.property.name}`,
      );
    }
    throw makeSyntaxError(node);
  },
  CallExpression: (node) => {
    expectSyntax(node, node.optional === false);
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === YIELD_STRAIGHT_KEYWORD
    ) {
      expectSyntax(node, node.arguments.length === 1);
      return makeYieldExpression(false, visitExpression(node.arguments[0]));
    }
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === YIELD_DELEGATE_KEYWORD
    ) {
      expectSyntax(node, node.arguments.length === 1);
      return makeYieldExpression(true, visitExpression(node.arguments[0]));
    }
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === THROW_KEYWORD
    ) {
      expectSyntax(node, node.arguments.length === 1);
      return makeThrowExpression(visitExpression(node.arguments[0]));
    }
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
      expectSyntax(node, node.arguments.length === 2);
      expectSyntax(node, node.arguments[0].type === "Literal");
      expectSyntax(node, node.arguments[1].type === "Identifier");
      return makeStaticImportExpression(
        node.arguments[0].raw,
        node.arguments[1].name,
      );
    }
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === EVAL_KEYWORD
    ) {
      expectSyntax(node, node.arguments.length === 3);
      expectSyntax(node, node.arguments[0].type === "ArrayExpression");
      expectSyntax(node, node.arguments[1].type === "ArrayExpression");
      return makeEvalExpression(
        map(node.arguments[0].elements, visitEnclave),
        map(node.arguments[1].elements, visitMetaIdentifier),
        visitExpression(node.arguments[2]),
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
      isBaseVariable(node.argument.name)
    ) {
      return makeTypeofEnclaveExpression(getVariableBody(node.argument.name));
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

////////////
// Export //
////////////

const options = {
  __proto__: null,
  ecmaVersion: 2022,
  sourceType: "module",
  locations: true,
};

export const parseProgram = (code) =>
  visitProgram(parseAcornLoose(code, options));

const generateParseStatement = (visit) => (code) => {
  const node = parseAcornLoose(code, options);
  assert(node.type === "Program");
  assert(node.body.length === 1);
  return visit(node.body[0]);
};
export const parseLink = generateParseStatement(visitLink);
export const parseBlock = generateParseStatement(visitBlock);
export const parseStatement = generateParseStatement(visitStatement);

const generateParseExpression = (visit) => (code) => {
  const node = parseAcornLoose(`(${code});`, options);
  assert(node.type === "Program");
  assert(node.body.length === 1);
  assert(node.body[0].type === "ExpressionStatement");
  return visit(node.body[0].expression);
};
export const parseExpression = generateParseExpression(visitExpression);
export const parseEffect = generateParseExpression(visitEffect);
