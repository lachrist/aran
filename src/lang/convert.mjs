/* eslint-disable arrow-body-style, no-use-before-define */

import {slice, map, concat} from "array-lite";

import {format, expect, assert} from "../util.mjs";

import {
  extractNode,
  makeScriptProgram,
  makeModuleProgram,
  makeLocalEvalProgram,
  makeGlobalEvalProgram,
  makeEnclaveEvalProgram,
  makeImportLink,
  makeExportLink,
  makeAggregateLink,
  makeBlock,
  makeEffectStatement,
  makeReturnStatement,
  makeBreakStatement,
  makeDebuggerStatement,
  makeScriptDeclareStatement,
  makeBlockStatement,
  makeIfStatement,
  makeWhileStatement,
  makeTryStatement,
  makeWriteEffect,
  makeExportEffect,
  makeSequenceEffect,
  makeConditionalEffect,
  makeExpressionEffect,
  makeInputExpression,
  makeLiteralExpression,
  makeIntrinsicExpression,
  makeImportExpression,
  makeReadExpression,
  makeClosureExpression,
  makeAwaitExpression,
  makeYieldExpression,
  makeSequenceExpression,
  makeConditionalExpression,
  makeEvalExpression,
  makeApplyExpression,
  makeConstructExpression,
  makeInvokeExpression,
} from "../ast/index.mjs";

import {
  MODULE_PROGRAM_DIRECTIVE,
  SCRIPT_PROGRAM_DIRECTIVE,
  GLOBAL_EVAL_PROGRAM_DIRECTIVE,
  LOCAL_EVAL_PROGRAM_DIRECTIVE,
  ENCLAVE_EVAL_PROGRAM_DIRECTIVE,
  EFFECT_KEYWORD,
  EVAL_KEYWORD,
  UNDEFINED_KEYWORD,
  INPUT_KEYWORD,
  INTRINSIC_KEYWORD,
  YIELD_DELEGATE_KEYWORD,
  YIELD_STRAIGHT_KEYWORD,
  EXPORT_KEYWORD,
  IMPORT_KEYWORD,
} from "./keywords.mjs";

const {
  String,
  undefined,
  SyntaxError,
  Reflect: {getOwnPropertyDescriptor},
} = globalThis;

///////////
// Error //
///////////

const locate = (loc) => `${String(loc.start.line)}:${String(loc.start.column)}`;
const TEMPLATE = "Node %s at %s";
const extractNodeInfo = (node) => [node.type, locate(node.loc)];
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

const convertIdentifier = (node) => {
  expectSyntax(node, node.type === "Identifier");
  return node.name;
};

const convertEnclave = (node) => {
  expectSyntax(node, node.type === "Literal");
  return node.value;
};

const convertDeclarator = (node) => {
  assert(node.type === "VariableDeclarator", "invalid variable declarator");
  expectSyntax(node, node.init === null);
  return convertIdentifier(node.id);
};

const convertDeclaration = (node) => {
  expectSyntax(node, node.type === "VariableDeclaration");
  expectSyntax(node, node.kind === "let");
  return map(node.declarations, convertDeclarator);
};

const convertEnclaveArray = (node) => {
  expectSyntax(node, node.type === "ArrayExpression");
  return map(node.elements, convertEnclave);
};

export const convertProgram = generateConvert({
  __proto__: null,
  Program: (node) => {
    expectSyntax(node, node.body.length > 0);
    expectSyntax(node, node.body[0].type === "ExpressionStatement");
    expectSyntax(node, node.body[0].expression.type === "Literal");
    const directive = node.body[0].expression.value;
    if (directive === SCRIPT_PROGRAM_DIRECTIVE) {
      return makeScriptProgram(
        map(slice(node.body, 1, node.body.length), convertStatement),
        locate(node.loc),
      );
    }
    if (directive === MODULE_PROGRAM_DIRECTIVE) {
      expectSyntax(node, node.body.length > 1);
      return makeModuleProgram(
        map(slice(node.body, 1, node.body.length - 1), convertLink),
        convertBlock(node.body[node.body.length - 1]),
        locate(node.loc),
      );
    }
    if (directive === GLOBAL_EVAL_PROGRAM_DIRECTIVE) {
      expectSyntax(node, node.body.length === 2);
      return makeGlobalEvalProgram(
        convertBlock(node.body[1]),
        locate(node.loc),
      );
    }
    if (directive === LOCAL_EVAL_PROGRAM_DIRECTIVE) {
      expectSyntax(node, node.body.length === 2 || node.body.length === 3);
      return makeLocalEvalProgram(
        node.body.length === 2 ? [] : convertDeclaration(node.body[1]),
        convertBlock(node.body[node.body.length - 1]),
        locate(node.loc),
      );
    }
    if (directive === ENCLAVE_EVAL_PROGRAM_DIRECTIVE) {
      expectSyntax(node, node.body.length === 3);
      expectSyntax(node, node.body[1].type === "ExpressionStatement");
      return makeEnclaveEvalProgram(
        convertEnclaveArray(node.body[1].expression),
        convertBlock(node.body[2]),
        locate(node.loc),
      );
    }
    throw makeSyntaxError(node);
  },
});

export const convertLink = generateConvert({
  __proto__: null,
  ImportDeclaration: (node) => {
    if (node.specifiers.length === 0) {
      return makeImportLink(node.source.value, null, locate(node.loc));
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
      locate(node.loc),
    );
  },
  ExportAllDeclaration: (node) => {
    return makeAggregateLink(
      node.source.value,
      null,
      node.exported === null ? null : node.exported.name,
      locate(node.loc),
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
      return makeExportLink(node.specifiers[0].exported.name, locate(node.loc));
    }
    return makeAggregateLink(
      node.source.value,
      node.specifiers[0].local.name,
      node.specifiers[0].exported.name,
      locate(node.loc),
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
          locate(node.loc),
        ),
    );
  },
  BlockStatement: (node) => {
    if (node.body.length > 0 && node.body[0].type === "VariableDeclaration") {
      return makeBlock(
        [],
        convertDeclaration(node.body[0]),
        map(slice(node.body, 1, node.body.length), convertStatement),
        locate(node.loc),
      );
    } else {
      return makeBlock(
        [],
        [],
        map(node.body, convertStatement),
        locate(node.loc),
      );
    }
  },
});

export const convertStatement = generateConvert({
  __proto__: null,
  BlockStatement: (node) => {
    return makeBlockStatement(convertBlock(node), locate(node.loc));
  },
  LabeledStatement: (node) => {
    return makeBlockStatement(convertBlock(node), locate(node.loc));
  },
  TryStatement: (node) => {
    expectSyntax(node, node.handler !== null);
    expectSyntax(node, node.handler.param === null);
    expectSyntax(node, node.finalizer !== null);
    return makeTryStatement(
      convertBlock(node.block),
      convertBlock(node.handler.body),
      convertBlock(node.finalizer),
      locate(node.loc),
    );
  },
  IfStatement: (node) => {
    expectSyntax(node, node.alternate !== null);
    return makeIfStatement(
      convertExpression(node.test),
      convertBlock(node.consequent),
      convertBlock(node.alternate),
      locate(node.loc),
    );
  },
  WhileStatement: (node) => {
    return makeWhileStatement(
      convertExpression(node.test),
      convertBlock(node.body),
      locate(node.loc),
    );
  },
  DebuggerStatement: (node) => {
    return makeDebuggerStatement(locate(node.loc));
  },
  ExpressionStatement: (node) => {
    return makeEffectStatement(
      convertEffect(node.expression),
      locate(node.loc),
    );
  },
  ReturnStatement: (node) => {
    return makeReturnStatement(
      convertExpression(node.argument),
      locate(node.loc),
    );
  },
  BreakStatement: (node) => {
    expectSyntax(node, node.label !== null);
    return makeBreakStatement(node.label.name, locate(node.loc));
  },
  VariableDeclaration: (node) => {
    expectSyntax(node, node.declarations.length === 1);
    expectSyntax(node, node.declarations[0].init !== null);
    expectSyntax(node, node.declarations[0].id.type === "Identifier");
    return makeScriptDeclareStatement(
      node.kind,
      node.declarations[0].id.name,
      convertExpression(node.declarations[0].init),
      locate(node.loc),
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
      locate(node.loc),
    );
  },
  ConditionalExpression: (node) => {
    return makeConditionalEffect(
      convertExpression(node.test),
      convertEffect(node.consequent),
      convertEffect(node.alternate),
      locate(node.loc),
    );
  },
  CallExpression: (node) => {
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === EXPORT_KEYWORD
    ) {
      expectSyntax(node, node.arguments.length === 2);
      expectSyntax(node, node.arguments[0].type === "Literal");
      return makeExportEffect(
        node.arguments[0].value,
        convertExpression(node.arguments[1]),
        locate(node.loc),
      );
    }
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === EFFECT_KEYWORD
    ) {
      expectSyntax(node, node.arguments.length === 1);
      return makeExpressionEffect(
        convertExpression(node.arguments[0]),
        locate(node.loc),
      );
    }
    throw makeSyntaxError(node);
  },
  AssignmentExpression: (node) => {
    expectSyntax(node, node.operator === "=");
    expectSyntax(node, node.left.type === "Identifier");
    return makeWriteEffect(
      node.left.name,
      convertExpression(node.right),
      locate(node.loc),
    );
  },
});

export const convertExpression = generateConvert({
  __proto__: null,
  Literal: (node) => {
    if (getOwnPropertyDescriptor(node, "bigint") !== undefined) {
      return makeLiteralExpression({bigint: node.bigint}, locate(node.loc));
    }
    return makeLiteralExpression(node.value, locate(node.loc));
  },
  ArrowFunctionExpression: (node) => {
    expectSyntax(node, node.params.length === 0);
    return makeClosureExpression(
      "arrow",
      node.async,
      node.generator,
      convertBlock(node.body),
      locate(node.loc),
    );
  },
  FunctionExpression: (node) => {
    expectSyntax(node, node.params.length === 0);
    return makeClosureExpression(
      node.id === null ? "function" : node.id.name,
      node.async,
      node.generator,
      convertBlock(node.body),
      locate(node.loc),
    );
  },
  Identifier: (node) => {
    if (node.name === UNDEFINED_KEYWORD) {
      return makeLiteralExpression({undefined: null}, locate(node.loc));
    }
    if (node.name === INPUT_KEYWORD) {
      return makeInputExpression(locate(node.loc));
    }
    return makeReadExpression(node.name, locate(node.loc));
  },
  SequenceExpression: (node) => {
    expectSyntax(node, node.expressions.length === 2);
    return makeSequenceExpression(
      convertEffect(node.expressions[0]),
      convertExpression(node.expressions[1]),
      locate(node.loc),
    );
  },
  ConditionalExpression: (node) => {
    return makeConditionalExpression(
      convertExpression(node.test),
      convertExpression(node.consequent),
      convertExpression(node.alternate),
      locate(node.loc),
    );
  },
  AwaitExpression: (node) => {
    return makeAwaitExpression(
      convertExpression(node.argument),
      locate(node.loc),
    );
  },
  // Combiners //
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
        locate(node.loc),
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
        locate(node.loc),
      );
    }
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === INTRINSIC_KEYWORD
    ) {
      expectSyntax(node, node.arguments.length === 1);
      expectSyntax(node, node.arguments[0].type === "Literal");
      return makeIntrinsicExpression(node.arguments[0].value, locate(node.loc));
    }
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === IMPORT_KEYWORD
    ) {
      expectSyntax(node, node.arguments.length === 2);
      expectSyntax(node, node.arguments[0].type === "Literal");
      expectSyntax(node, node.arguments[1].type === "Literal");
      return makeImportExpression(
        node.arguments[0].value,
        node.arguments[1].value,
        locate(node.loc),
      );
    }
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === EVAL_KEYWORD
    ) {
      expectSyntax(node, node.arguments.length === 2);
      expectSyntax(node, node.arguments[0].type === "ArrayExpression");
      return makeEvalExpression(
        map(node.arguments[0].elements, convertIdentifier),
        convertExpression(node.arguments[1]),
        locate(node.loc),
      );
    }
    if (node.callee.type === "MemberExpression") {
      expectSyntax(node, !node.callee.optional);
      expectSyntax(node, node.callee.computed);
      return makeInvokeExpression(
        convertExpression(node.callee.object),
        convertExpression(node.callee.property),
        map(node.arguments, convertExpression),
        locate(node.loc),
      );
    }
    expectSyntax(node, node.arguments.length > 0);
    return makeApplyExpression(
      convertExpression(node.callee),
      convertExpression(node.arguments[0]),
      map(slice(node.arguments, 1, node.arguments.length), convertExpression),
      locate(node.loc),
    );
  },
  NewExpression: (node) => {
    return makeConstructExpression(
      convertExpression(node.callee),
      map(node.arguments, convertExpression),
      locate(node.loc),
    );
  },
});
