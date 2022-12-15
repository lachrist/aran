/* eslint-disable arrow-body-style, no-use-before-define */

import { slice, map, concat } from "array-lite";

import {
  partialx_,
  partialx__,
  format,
  expect,
  assert,
} from "../util/index.mjs";

import { dispatchObjectNode0, dispatchObjectNode1 } from "../node.mjs";

import {
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
  makeDeclareExternalStatement,
  makeBlockStatement,
  makeIfStatement,
  makeWhileStatement,
  makeTryStatement,
  makeWriteEffect,
  makeWriteExternalEffect,
  makeExportEffect,
  makeSequenceEffect,
  makeConditionalEffect,
  makeExpressionEffect,
  makeParameterExpression,
  makeLiteralExpression,
  makeIntrinsicExpression,
  makeImportExpression,
  makeReadExpression,
  makeReadExternalExpression,
  makeTypeofExternalExpression,
  makeClosureExpression,
  makeAwaitExpression,
  makeYieldExpression,
  makeSequenceExpression,
  makeConditionalExpression,
  makeEvalExpression,
  makeApplyExpression,
  makeConstructExpression,
  // makeInvokeExpression,
} from "../ast/index.mjs";

import {
  MODULE_PROGRAM_DIRECTIVE,
  SCRIPT_PROGRAM_DIRECTIVE,
  EVAL_PROGRAM_DIRECTIVE,
  EFFECT_KEYWORD,
  EVAL_KEYWORD,
  UNDEFINED_KEYWORD,
  INTRINSIC_KEYWORD,
  EXPORT_KEYWORD,
  IMPORT_KEYWORD,
} from "./keywords.mjs";

const {
  String,
  String: {
    prototype: { substring },
  },
  undefined,
  SyntaxError,
  Reflect: { apply, getOwnPropertyDescriptor },
} = globalThis;

const ONE = [1];

///////////
// Error //
///////////

const locate = (loc) => `${String(loc.start.line)}:${String(loc.start.column)}`;
const TEMPLATE = "Node %s at %s";
const extractNodeInfo = (node) => [node.type, locate(node.loc)];
const makeSyntaxError = (node) =>
  new SyntaxError(format(TEMPLATE, extractNodeInfo(node)));
const expectSyntax = (check, node) => {
  expect(check, SyntaxError, TEMPLATE, extractNodeInfo(node));
};

///////////
// Visit //
///////////

const convertParameter = partialx__(dispatchObjectNode0, {
  __proto__: null,
  Identifier: (node) => {
    expectSyntax(node.name === "error" || node.name === "arguments", node);
    return node.name;
  },
  ThisExpression: (_node) => "this",
  MemberExpression: (node) => {
    expectSyntax(!node.computed, node);
    expectSyntax(!node.optional, node);
    expectSyntax(node.property.type === "Identifier", node);
    expectSyntax(
      node.property.name === "get" ||
        node.property.name === "set" ||
        node.property.name === "call",
      node,
    );
    return `super.${node.property.name}`;
  },
  MetaProperty: (node) => {
    if (node.meta.name === "import") {
      if (node.property.name === "dynamic") {
        return "import";
      } else {
        expectSyntax(node.property.name === "meta", node);
        return "import.meta";
      }
    } else if (node.meta.name === "new") {
      expectSyntax(node.property.name === "target", node);
      return "new.target";
    } /* c8 ignore start */ else {
      throw makeSyntaxError(node);
    } /* c8 ignore stop */
  },
});

const convertVariable = (node) => {
  expectSyntax(node.type === "Identifier", node);
  expectSyntax(node[0] !== "_", node);
  return node.name;
};

const convertVariableDeclarator = (node) => {
  assert(node.type === "VariableDeclarator", "invalid variable declarator");
  expectSyntax(node.init === null, node);
  return convertVariable(node.id);
};

const convertVariableDeclaration = (node) => {
  expectSyntax(node.type === "VariableDeclaration", node);
  expectSyntax(node.kind === "let", node);
  return map(node.declarations, convertVariableDeclarator);
};

const convertVariableArray = (node) => {
  expectSyntax(node.type === "ArrayExpression", node);
  return map(node.elements, convertVariable);
};

const convertParameterArray = (node) => {
  expectSyntax(node.type === "ArrayExpression", node);
  return map(node.elements, convertParameter);
};

export const convertProgram = partialx_(dispatchObjectNode0, {
  __proto__: null,
  Program: (node) => {
    expectSyntax(node.body.length > 0, node);
    expectSyntax(node.body[0].type === "ExpressionStatement", node);
    expectSyntax(node.body[0].expression.type === "Literal", node);
    const directive = node.body[0].expression.value;
    if (directive === SCRIPT_PROGRAM_DIRECTIVE) {
      return makeScriptProgram(
        map(slice(node.body, 1, node.body.length), convertStatement),
        locate(node.loc),
      );
    } else if (directive === MODULE_PROGRAM_DIRECTIVE) {
      expectSyntax(node.body.length > 1, node);
      return makeModuleProgram(
        map(slice(node.body, 1, node.body.length - 1), convertLink),
        convertBlock(node.body[node.body.length - 1]),
        locate(node.loc),
      );
    } else if (directive === EVAL_PROGRAM_DIRECTIVE) {
      expectSyntax(node.body.length > 1, node);
      expectSyntax(node.body[1].type === "ExpressionStatement", node);
      if (node.body.length === 3) {
        return makeEvalProgram(
          convertParameterArray(node.body[1].expression),
          [],
          convertBlock(node.body[2]),
          locate(node.loc),
        );
      } else if (node.body.length === 4) {
        return makeEvalProgram(
          convertParameterArray(node.body[1].expression),
          convertVariableDeclaration(node.body[2]),
          convertBlock(node.body[3]),
          locate(node.loc),
        );
      } else {
        throw makeSyntaxError(node);
      }
    } else {
      throw makeSyntaxError(node);
    }
  },
});

export const convertLink = partialx_(dispatchObjectNode0, {
  __proto__: null,
  ImportDeclaration: (node) => {
    if (node.specifiers.length === 0) {
      return makeImportLink(node.source.value, null, locate(node.loc));
    } else {
      expectSyntax(node.specifiers.length === 1, node);
      expectSyntax(node.specifiers[0].type === "ImportSpecifier", node);
      expectSyntax(
        node.specifiers[0].imported.name === node.specifiers[0].local.name,
        node,
      );
      return makeImportLink(
        node.source.value,
        node.specifiers[0].imported.name,
        locate(node.loc),
      );
    }
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
    expectSyntax(node.declaration === null, node);
    expectSyntax(node.specifiers.length === 1, node);
    if (node.source === null) {
      expectSyntax(
        node.specifiers[0].exported.name === node.specifiers[0].local.name,
        node,
      );
      return makeExportLink(node.specifiers[0].exported.name, locate(node.loc));
    } else {
      return makeAggregateLink(
        node.source.value,
        node.specifiers[0].local.name,
        node.specifiers[0].exported.name,
        locate(node.loc),
      );
    }
  },
});

export const convertBlock = partialx__(dispatchObjectNode1, {
  LabeledStatement: (node, labels = []) =>
    convertBlock(node.body, concat(labels, [node.label.name])),
  BlockStatement: (node, labels = []) => {
    if (
      node.body.length > 0 &&
      node.body[0].type === "VariableDeclaration" &&
      node.body[0].kind === "let" &&
      node.body[0].declarations[0].init === null
    ) {
      return makeBlock(
        labels,
        convertVariableDeclaration(node.body[0]),
        map(slice(node.body, 1, node.body.length), convertStatement),
        locate(node.loc),
      );
    } else {
      return makeBlock(
        labels,
        [],
        map(node.body, convertStatement),
        locate(node.loc),
      );
    }
  },
});

export const convertStatement = partialx_(dispatchObjectNode0, {
  BlockStatement: (node) => {
    return makeBlockStatement(convertBlock(node), locate(node.loc));
  },
  LabeledStatement: (node) => {
    return makeBlockStatement(convertBlock(node), locate(node.loc));
  },
  TryStatement: (node) => {
    expectSyntax(node.handler !== null, node);
    expectSyntax(node.handler.param === null, node);
    expectSyntax(node.finalizer !== null, node);
    return makeTryStatement(
      convertBlock(node.block),
      convertBlock(node.handler.body),
      convertBlock(node.finalizer),
      locate(node.loc),
    );
  },
  IfStatement: (node) => {
    expectSyntax(node.alternate !== null, node);
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
    expectSyntax(node.label !== null, node);
    return makeBreakStatement(node.label.name, locate(node.loc));
  },
  VariableDeclaration: (node) => {
    expectSyntax(node.declarations.length === 1, node);
    expectSyntax(node.declarations[0].init !== null, node);
    expectSyntax(node.declarations[0].id.type === "Identifier", node);
    expectSyntax(node.declarations[0].id.name[0] === "_", node);
    return makeDeclareExternalStatement(
      node.kind,
      apply(substring, node.declarations[0].id.name, ONE),
      convertExpression(node.declarations[0].init),
      locate(node.loc),
    );
  },
});

export const convertEffect = partialx_(dispatchObjectNode0, {
  SequenceExpression: (node) => {
    expectSyntax(node.expressions.length === 2, node);
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
      expectSyntax(node.arguments.length === 2, node);
      expectSyntax(node.arguments[0].type === "Literal", node);
      return makeExportEffect(
        node.arguments[0].value,
        convertExpression(node.arguments[1]),
        locate(node.loc),
      );
    } else if (
      node.callee.type === "Identifier" &&
      node.callee.name === EFFECT_KEYWORD
    ) {
      expectSyntax(node.arguments.length === 1, node);
      return makeExpressionEffect(
        convertExpression(node.arguments[0]),
        locate(node.loc),
      );
    } else {
      throw makeSyntaxError(node);
    }
  },
  AssignmentExpression: (node) => {
    expectSyntax(node.operator === "=", node);
    expectSyntax(node.left.type === "Identifier", node);
    if (node.left.name[0] === "_") {
      return makeWriteExternalEffect(
        apply(substring, node.left.name, ONE),
        convertExpression(node.right),
        locate(node.loc),
      );
    } else {
      return makeWriteEffect(
        node.left.name,
        convertExpression(node.right),
        locate(node.loc),
      );
    }
  },
});

export const convertIntrinsic = (node) => {
  if (node.type === "Identifier") {
    return null;
  } else if (node.type === "MemberExpression") {
    expectSyntax(!node.optional, node);
    expectSyntax(!node.computed, node);
    expectSyntax(node.property.type === "Identifier", node);
    const maybe_intrinsic = convertIntrinsic(node.object);
    return maybe_intrinsic === null
      ? node.property.name
      : `${maybe_intrinsic}.${node.property.name}`;
  } else {
    throw makeSyntaxError(node);
  }
};

export const convertExpression = partialx_(dispatchObjectNode0, {
  Literal: (node) => {
    if (getOwnPropertyDescriptor(node, "bigint") !== undefined) {
      return makeLiteralExpression({ bigint: node.bigint }, locate(node.loc));
    } else {
      return makeLiteralExpression(node.value, locate(node.loc));
    }
  },
  ArrowFunctionExpression: (node) => {
    expectSyntax(node.params.length === 0, node);
    return makeClosureExpression(
      "arrow",
      node.async,
      node.generator,
      convertBlock(node.body),
      locate(node.loc),
    );
  },
  FunctionExpression: (node) => {
    expectSyntax(node.params.length === 0, node);
    return makeClosureExpression(
      node.id === null ? "function" : node.id.name,
      node.async,
      node.generator,
      convertBlock(node.body),
      locate(node.loc),
    );
  },
  UnaryExpression: (node) => {
    expectSyntax(node.operator === "typeof", node);
    expectSyntax(node.argument.type === "Identifier", node);
    expectSyntax(node.argument.name[0] === "_", node);
    return makeTypeofExternalExpression(
      apply(substring, node.argument.name, ONE),
      locate(node.loc),
    );
  },
  Identifier: (node) => {
    if (node.name === UNDEFINED_KEYWORD) {
      return makeLiteralExpression({ undefined: null }, locate(node.loc));
    } else if (node.name === "error" || node.name === "arguments") {
      return makeParameterExpression(node.name, locate(node.loc));
    } else if (node.name[0] === "_") {
      return makeReadExternalExpression(
        apply(substring, node.name, ONE),
        locate(node.loc),
      );
    } else {
      return makeReadExpression(node.name, locate(node.loc));
    }
  },
  SequenceExpression: (node) => {
    expectSyntax(node.expressions.length === 2, node);
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
  YieldExpression: (node) => {
    return makeYieldExpression(
      node.delegate,
      convertExpression(node.argument),
      locate(node.loc),
    );
  },
  MemberExpression: (node) => {
    if (node.object.type === "Super") {
      expectSyntax(!node.computed, node);
      expectSyntax(node.property.type === "Identifier", node);
      if (node.property.name === "get") {
        return makeParameterExpression("super.get", locate(node.loc));
      } else if (node.property.name === "set") {
        return makeParameterExpression("super.set", locate(node.loc));
      } else if (node.property.name === "call") {
        return makeParameterExpression("super.call", locate(node.loc));
      } else {
        throw makeSyntaxError(node);
      }
    } else if (
      node.object.type === "Identifier" &&
      node.object.name === INTRINSIC_KEYWORD &&
      node.computed
    ) {
      expectSyntax(node.property.type === "Literal", node);
      expectSyntax(typeof node.property.value === "string", node);
      return makeIntrinsicExpression(node.property.value);
    } else {
      return makeIntrinsicExpression(convertIntrinsic(node));
    }
  },
  ThisExpression: (node) => makeParameterExpression("this", locate(node.loc)),
  MetaProperty: (node) => {
    if (node.meta.name === "new") {
      expectSyntax(node.property.name === "target", node);
      return makeParameterExpression("new.target", locate(node.loc));
    } else if (node.meta.name === "import") {
      if (node.property.name === "meta") {
        return makeParameterExpression("import.meta", locate(node.loc));
      } else if (node.property.name === "dynamic") {
        return makeParameterExpression("import", locate(node.loc));
      } else {
        throw makeSyntaxError(node);
      }
    } /* c8 ignore start */ else {
      throw makeSyntaxError(node);
    } /* c8 ignore stop */
  },
  // Combiners //
  CallExpression: (node) => {
    expectSyntax(node.optional === false, node);
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === IMPORT_KEYWORD
    ) {
      expectSyntax(node.arguments.length === 2, node);
      expectSyntax(node.arguments[0].type === "Literal", node);
      expectSyntax(node.arguments[1].type === "Literal", node);
      return makeImportExpression(
        node.arguments[0].value,
        node.arguments[1].value,
        locate(node.loc),
      );
    } else if (
      node.callee.type === "Identifier" &&
      node.callee.name === EVAL_KEYWORD
    ) {
      expectSyntax(node.arguments.length === 3, node);
      return makeEvalExpression(
        convertParameterArray(node.arguments[0]),
        convertVariableArray(node.arguments[1]),
        convertExpression(node.arguments[2]),
        locate(node.loc),
      );
      // } else if (
      //   node.callee.type === "MemberExpression" &&
      //   node.callee.computed &&
      //   (node.callee.object.type !== "Identifier" ||
      //     node.callee.object.name !== INTRINSIC_KEYWORD)
      // ) {
      //   expectSyntax(!node.callee.optional, node);
      //   return makeInvokeExpression(
      //     convertExpression(node.callee.object),
      //     convertExpression(node.callee.property),
      //     map(node.arguments, convertExpression),
      //     locate(node.loc),
      //   );
    } else if (
      node.arguments.length > 0 &&
      node.arguments[0].type === "UnaryExpression" &&
      node.arguments[0].operator === "!"
    ) {
      return makeApplyExpression(
        convertExpression(node.callee),
        convertExpression(node.arguments[0].argument),
        map(slice(node.arguments, 1, node.arguments.length), convertExpression),
        locate(node.loc),
      );
    } else {
      return makeApplyExpression(
        convertExpression(node.callee),
        makeLiteralExpression({ undefined: null }),
        map(node.arguments, convertExpression),
        locate(node.loc),
      );
    }
  },
  NewExpression: (node) => {
    return makeConstructExpression(
      convertExpression(node.callee),
      map(node.arguments, convertExpression),
      locate(node.loc),
    );
  },
});
