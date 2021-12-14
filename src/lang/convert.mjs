/* eslint-disable arrow-body-style, no-use-before-define */

import {slice, map, concat} from "array-lite";

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
} from "../ast/index.mjs";

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

const {
  undefined,
  SyntaxError,
  Reflect: {getOwnPropertyDescriptor},
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

const generateConvert = (convertors) => (node) => {
  // console.log(node.type, convertors);
  expectSyntax(node, node.type in convertors);
  const convertor = convertors[node.type];
  return convertor(node);
};

const convertEnclave = generateConvert({
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

const convertMetaDeclarator = (node) => {
  assert(node.type === "VariableDeclarator", "invalid variable declarator");
  expectSyntax(node, node.init === null);
  expectSyntax(node, node.id.type === "Identifier");
  expectSyntax(node, isMetaVariable(node.id.name));
  return getVariableBody(node.id.name);
};

export const convertProgram = generateConvert({
  __proto__: null,
  Program: (node) => {
    expectSyntax(node, node.body.length > 0);
    expectSyntax(node, node.body[0].type === "ExpressionStatement");
    expectSyntax(node, node.body[0].expression.type === "Literal");
    const kind = node.body[0].expression.value;
    if (kind === SCRIPT_PROGRAM_KEYWORD) {
      return makeScriptProgram(
        map(slice(node.body, 1, node.body.length), convertStatement),
        node.loc,
      );
    }
    if (kind === MODULE_PROGRAM_KEYWORD) {
      expectSyntax(node, node.body.length > 1);
      return makeModuleProgram(
        map(slice(node.body, 1, node.body.length - 1), convertLink),
        convertBlock(node.body[node.body.length - 1]),
        node.loc,
      );
    }
    if (kind === EVAL_PROGRAM_KEYWORD) {
      if (node.body.length === 2) {
        return makeEvalProgram([], [], convertBlock(node.body[1]), node.loc);
      }
      if (node.body.length === 3) {
        if (
          node.body[1].type === "VariableDeclaration" &&
          node.body[1].kind === "let"
        ) {
          return makeEvalProgram(
            [],
            map(node.body[1].declarations, convertMetaDeclarator),
            convertBlock(node.body[2]),
            node.loc,
          );
        }
        if (
          node.body[1].type === "ExpressionStatement" &&
          node.body[1].expression.type === "ArrayExpression"
        ) {
          return makeEvalProgram(
            map(node.body[1].expression.elements, convertEnclave),
            [],
            convertBlock(node.body[2]),
            node.loc,
          );
        }
        throw makeSyntaxError(node.loc, node);
      }
      if (node.body.length === 4) {
        expectSyntax(node, node.body[1].type === "ExpressionStatement");
        expectSyntax(node, node.body[1].expression.type === "ArrayExpression");
        expectSyntax(node, node.body[2].type === "VariableDeclaration");
        expectSyntax(node, node.body[2].kind === "let");
        return makeEvalProgram(
          map(node.body[1].expression.elements, convertEnclave),
          map(node.body[2].declarations, convertMetaDeclarator),
          convertBlock(node.body[3]),
          node.loc,
        );
      }
      throw makeSyntaxError(node.loc, node);
    }
    throw makeSyntaxError(node.loc, node);
  },
});

export const convertLink = generateConvert({
  __proto__: null,
  ImportDeclaration: (node) => {
    if (node.specifiers.length === 0) {
      return makeImportLink(node.source.value, null, node.loc);
    }
    expectSyntax(node, node.specifiers.length === 1);
    expectSyntax(node, node.specifiers[0].type === "ImportSpecifier");
    expectSyntax(
      node,
      node.specifiers[0].imported.name === node.specifiers[0].local.name,
    );
    return makeImportLink(
      node.source.value,
      node.specifiers[0].imported.name,
      node.loc,
    );
  },
  ExportAllDeclaration: (node) => {
    return makeAggregateLink(
      node.source.value,
      null,
      node.exported === null ? null : node.exported.name,
      node.loc,
    );
  },
  ExportNamedDeclaration: (node) => {
    expectSyntax(node, node.declaration === null);
    expectSyntax(node, node.specifiers.length === 1);
    if (node.source === null) {
      expectSyntax(
        node,
        node.specifiers[0].exported.name === node.specifiers[0].local.name,
      );
      return makeExportLink(node.specifiers[0].exported.name, node.loc);
    }
    return makeAggregateLink(
      node.source.value,
      node.specifiers[0].local.name,
      node.specifiers[0].exported.name,
      node.loc,
    );
  },
});

export const convertBlock = generateConvert({
  __proto__: null,
  LabeledStatement: (node) => {
    return extractNode(
      null,
      convertBlock(node.body),
      "Block",
      (_context, labels, identifiers, statements, _annotation) =>
        makeBlock(
          concat([node.label.name], labels),
          identifiers,
          statements,
          node.loc,
        ),
    );
  },
  BlockStatement: (node) => {
    if (node.body.length === 0) {
      return makeBlock([], [], [], node.loc);
    }
    if (
      node.body[0].type === "VariableDeclaration" &&
      node.body[0].kind === "let" &&
      node.body[0].declarations[0].id.type === "Identifier" &&
      isMetaVariable(node.body[0].declarations[0].id.name)
    ) {
      return makeBlock(
        [],
        map(node.body[0].declarations, convertMetaDeclarator),
        map(slice(node.body, 1, node.body.length), convertStatement),
        node.loc,
      );
    }
    return makeBlock([], [], map(node.body, convertStatement), node.loc);
  },
});

export const convertStatement = generateConvert({
  __proto__: null,
  BlockStatement: (node) => {
    return makeBlockStatement(convertBlock(node), node.loc);
  },
  LabeledStatement: (node) => {
    return makeBlockStatement(convertBlock(node), node.loc);
  },
  TryStatement: (node) => {
    expectSyntax(node, node.handler !== null);
    expectSyntax(node, node.handler.param === null);
    expectSyntax(node, node.finalizer !== null);
    return makeTryStatement(
      convertBlock(node.block),
      convertBlock(node.handler.body),
      convertBlock(node.finalizer),
      node.loc,
    );
  },
  IfStatement: (node) => {
    expectSyntax(node, node.alternate !== null);
    return makeIfStatement(
      convertExpression(node.test),
      convertBlock(node.consequent),
      convertBlock(node.alternate),
      node.loc,
    );
  },
  WhileStatement: (node) => {
    return makeWhileStatement(
      convertExpression(node.test),
      convertBlock(node.body),
      node.loc,
    );
  },
  DebuggerStatement: (node) => {
    return makeDebuggerStatement(node.loc);
  },
  ExpressionStatement: (node) => {
    return makeEffectStatement(convertEffect(node.expression), node.loc);
  },
  ReturnStatement: (node) => {
    return makeReturnStatement(convertExpression(node.argument), node.loc);
  },
  BreakStatement: (node) => {
    expectSyntax(node, node.label !== null);
    return makeBreakStatement(node.label.name, node.loc);
  },
  VariableDeclaration: (node) => {
    expectSyntax(node, node.declarations.length === 1);
    expectSyntax(node, node.declarations[0].init !== null);
    expectSyntax(node, node.declarations[0].id.type === "Identifier");
    expectSyntax(node, isBaseVariable(node.declarations[0].id.name));
    return makeDeclareEnclaveStatement(
      node.kind,
      getVariableBody(node.declarations[0].id.name),
      convertExpression(node.declarations[0].init),
      node.loc,
    );
  },
});

export const convertEffect = generateConvert({
  __proto__: null,
  SequenceExpression: (node) => {
    expectSyntax(node, node.expressions.length === 2);
    return makeSequenceEffect(
      convertEffect(node.expressions[0]),
      convertEffect(node.expressions[1]),
      node.loc,
    );
  },
  ConditionalExpression: (node) => {
    return makeConditionalEffect(
      convertExpression(node.test),
      convertEffect(node.consequent),
      convertEffect(node.alternate),
      node.loc,
    );
  },
  CallExpression: (node) => {
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === EXPORT_STATIC_KEYWORD
    ) {
      expectSyntax(node, node.arguments.length === 2);
      expectSyntax(node, node.arguments[0].type === "Literal");
      return makeStaticExportEffect(
        node.arguments[0].value,
        convertExpression(node.arguments[1]),
        node.loc,
      );
    }
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === EFFECT_KEYWORD
    ) {
      expectSyntax(node, node.arguments.length === 1);
      return makeExpressionEffect(
        convertExpression(node.arguments[0]),
        node.loc,
      );
    }
    throw makeSyntaxError(node.loc, node);
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
        convertExpression(node.left.property),
        convertExpression(node.right),
        node.loc,
      );
    }
    if (node.left.type === "Identifier") {
      if (isMetaVariable(node.left.name)) {
        return makeWriteEffect(
          getVariableBody(node.left.name),
          convertExpression(node.right),
          node.loc,
        );
      }
      if (isBaseVariable(node.left.name)) {
        return makeWriteEnclaveEffect(
          getVariableBody(node.left.name),
          convertExpression(node.right),
          node.loc,
        );
      }
      throw makeSyntaxError(node.loc, node);
    }
    throw makeSyntaxError(node.loc, node);
  },
});

const convertProperty = generateConvert({
  __proto__: null,
  Property: (node) => {
    expectSyntax(node, node.kind === "init");
    expectSyntax(node, node.method === false);
    expectSyntax(node, node.computed === true);
    return [convertExpression(node.key), convertExpression(node.value)];
  },
});

const convertMetaIdentifier = generateConvert({
  __proto__: null,
  Identifier: (node) => {
    expectSyntax(node, isMetaVariable(node.name));
    return getVariableBody(node.name);
  },
});

export const convertExpression = generateConvert({
  __proto__: null,
  Literal: (node) => {
    if (getOwnPropertyDescriptor(node, "bigint") !== undefined) {
      return makePrimitiveExpression({bigint: node.bigint}, node.loc);
    }
    return makePrimitiveExpression(node.value, node.loc);
  },
  ArrowFunctionExpression: (node) => {
    expectSyntax(node, node.params.length === 0);
    return makeClosureExpression(
      "arrow",
      node.async,
      node.generator,
      convertBlock(node.body),
      node.loc,
    );
  },
  FunctionExpression: (node) => {
    expectSyntax(node, node.params.length === 0);
    return makeClosureExpression(
      node.id === null ? "function" : node.id.name,
      node.async,
      node.generator,
      convertBlock(node.body),
      node.loc,
    );
  },
  Identifier: (node) => {
    if (node.name === UNDEFINED_KEYWORD) {
      return makePrimitiveExpression({undefined: null}, node.loc);
    }
    if (node.name === INPUT_KEYWORD) {
      return makeInputExpression(node.loc);
    }
    if (isMetaVariable(node.name)) {
      return makeReadExpression(getVariableBody(node.name), node.loc);
    }
    if (isBaseVariable(node.name)) {
      return makeReadEnclaveExpression(getVariableBody(node.name), node.loc);
    }
    throw makeSyntaxError(node, node.loc);
  },
  SequenceExpression: (node) => {
    expectSyntax(node, node.expressions.length === 2);
    return makeSequenceExpression(
      convertEffect(node.expressions[0]),
      convertExpression(node.expressions[1]),
      node.loc,
    );
  },
  ConditionalExpression: (node) => {
    return makeConditionalExpression(
      convertExpression(node.test),
      convertExpression(node.consequent),
      convertExpression(node.alternate),
      node.loc,
    );
  },
  AwaitExpression: (node) => {
    return makeAwaitExpression(convertExpression(node.argument), node.loc);
  },
  // Combiners //
  ImportExpression: (node) => {
    return makeDynamicImportExpression(
      convertExpression(node.source),
      node.loc,
    );
  },
  MemberExpression: (node) => {
    expectSyntax(node, node.optional === false);
    if (
      node.object.type === "Identifier" &&
      node.object.name === SUPER_BASE_IDENTIFIER
    ) {
      expectSyntax(node, node.computed === true);
      return makeGetSuperEnclaveExpression(
        convertExpression(node.property),
        node.loc,
      );
    }
    if (node.object.type === "Identifier" && isBaseVariable(node.object.name)) {
      expectSyntax(node, node.computed === false);
      assert(
        node.property.type === "Identifier",
        "invalid non-computed property",
      );
      return makeReadEnclaveExpression(
        `${getVariableBody(node.object.name)}.${node.property.name}`,
        node.loc,
      );
    }
    throw makeSyntaxError(node, node.loc);
  },
  CallExpression: (node) => {
    expectSyntax(node, node.optional === false);
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === YIELD_STRAIGHT_KEYWORD
    ) {
      expectSyntax(node, node.arguments.length === 1);
      return makeYieldExpression(
        false,
        convertExpression(node.arguments[0]),
        node.loc,
      );
    }
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === YIELD_DELEGATE_KEYWORD
    ) {
      expectSyntax(node, node.arguments.length === 1);
      return makeYieldExpression(
        true,
        convertExpression(node.arguments[0]),
        node.loc,
      );
    }
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === THROW_KEYWORD
    ) {
      expectSyntax(node, node.arguments.length === 1);
      return makeThrowExpression(
        convertExpression(node.arguments[0]),
        node.loc,
      );
    }
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === SUPER_BASE_IDENTIFIER
    ) {
      expectSyntax(node, node.arguments.length === 1);
      expectSyntax(node, node.arguments[0].type === "SpreadElement");
      return makeCallSuperEnclaveExpression(
        convertExpression(node.arguments[0].argument),
        node.loc,
      );
    }
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === INTRINSIC_KEYWORD
    ) {
      expectSyntax(node, node.arguments.length === 1);
      expectSyntax(node, node.arguments[0].type === "Literal");
      return makeIntrinsicExpression(node.arguments[0].value, node.loc);
    }
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === IMPORT_STATIC_KEYWORD
    ) {
      expectSyntax(node, node.arguments.length === 2);
      expectSyntax(node, node.arguments[0].type === "Literal");
      expectSyntax(node, node.arguments[1].type === "Literal");
      return makeStaticImportExpression(
        node.arguments[0].value,
        node.arguments[1].value,
        node.loc,
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
        map(node.arguments[0].elements, convertEnclave),
        map(node.arguments[1].elements, convertMetaIdentifier),
        convertExpression(node.arguments[2]),
        node.loc,
      );
    }
    expectSyntax(node, node.arguments.length > 0);
    return makeApplyExpression(
      convertExpression(node.callee),
      convertExpression(node.arguments[0]),
      map(slice(node.arguments, 1, node.arguments.length), convertExpression),
      node.loc,
    );
  },
  NewExpression: (node) => {
    return makeConstructExpression(
      convertExpression(node.callee),
      map(node.arguments, convertExpression),
      node.loc,
    );
  },
  UnaryExpression: (node) => {
    if (
      node.operator === "typeof" &&
      node.argument.type === "Identifier" &&
      isBaseVariable(node.argument.name)
    ) {
      return makeTypeofEnclaveExpression(
        getVariableBody(node.argument.name),
        node.loc,
      );
    }
    return makeUnaryExpression(
      node.operator,
      convertExpression(node.argument),
      node.loc,
    );
  },
  BinaryExpression: (node) => {
    return makeBinaryExpression(
      node.operator,
      convertExpression(node.left),
      convertExpression(node.right),
      node.loc,
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
      convertExpression(node.properties[0].value),
      map(slice(node.properties, 1, node.properties.length), convertProperty),
      node.loc,
    );
  },
});
