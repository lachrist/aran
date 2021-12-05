import {
  visitProgram,
  visitLink,
  visitBlock,
  visitStatement,
  visitEffect,
  visitExpression,
} from "./visit.mjs";

import {
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

import {assertDeepEqual, assertThrow} from "../../__fixture__.mjs";

import {parse as parseESTree} from "acorn";

const options = {
  __proto__: null,
  ecmaVersion: 2022,
  sourceType: "module",
  locations: true,
};

const parseProgram = (code) => visitProgram(parseESTree(code, options));
const parseLink = (code) => visitLink(parseESTree(code, options).body[0]);
const parseBlock = (code) =>
  visitBlock(
    parseESTree(`(async function* () ${code});`, options).body[0].expression
      .body,
  );
const parseStatement = (code) =>
  visitStatement(
    parseESTree(`(async function* () { ${code} });`, options).body[0].expression
      .body.body[0],
  );
const parseEffect = (code) =>
  visitEffect(
    parseESTree(`(async function* () { (${code}); });`, options).body[0]
      .expression.body.body[0].expression,
  );
const parseExpression = (code) =>
  visitExpression(
    parseESTree(`(async function* () { (${code}); });`, options).body[0]
      .expression.body.body[0].expression,
  );

[
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
];

[
  parseProgram,
  parseLink,
  parseBlock,
  parseStatement,
  parseEffect,
  parseExpression,
];

////////////////
// Expression //
////////////////

assertDeepEqual(parseExpression("123"), makePrimitiveExpression("123"));
assertDeepEqual(parseExpression("null"), makePrimitiveExpression("null"));
assertDeepEqual(
  parseExpression("undefined"),
  makePrimitiveExpression("undefined"),
);

assertDeepEqual(parseExpression("_foo"), makeReadExpression("foo"));

assertDeepEqual(parseExpression("$foo"), makeReadEnclaveExpression("foo"));

assertDeepEqual(
  parseExpression("typeof $foo"),
  makeTypeofEnclaveExpression("foo"),
);

assertDeepEqual(parseExpression("input"), makeInputExpression());

assertDeepEqual(
  parseExpression("!123"),
  makeUnaryExpression("!", makePrimitiveExpression("123")),
);

assertDeepEqual(
  parseExpression("123 + 456"),
  makeBinaryExpression(
    "+",
    makePrimitiveExpression("123"),
    makePrimitiveExpression("456"),
  ),
);

assertDeepEqual(
  parseExpression("new 123(456)"),
  makeConstructExpression(makePrimitiveExpression("123"), [
    makePrimitiveExpression("456"),
  ]),
);

assertDeepEqual(
  parseExpression("123(456, 789)"),
  makeApplyExpression(
    makePrimitiveExpression("123"),
    makePrimitiveExpression("456"),
    [makePrimitiveExpression("789")],
  ),
);

assertDeepEqual(
  parseExpression("intrinsic('ReferenceError')"),
  makeIntrinsicExpression("ReferenceError"),
);

assertDeepEqual(
  parseExpression("import('source')"),
  makeDynamicImportExpression("source"),
);

assertDeepEqual(
  parseExpression("await 123"),
  makeAwaitExpression(makePrimitiveExpression("123")),
);

assertDeepEqual(
  parseExpression("yield 123"),
  makeYieldExpression(false, makePrimitiveExpression("123")),
);

assertDeepEqual(
  parseExpression("yield* 123"),
  makeYieldExpression(true, makePrimitiveExpression("123")),
);

assertDeepEqual(
  parseExpression("(effect(123), 456)"),
  makeSequenceExpression(
    makeExpressionEffect(makePrimitiveExpression("123")),
    makePrimitiveExpression("456"),
  ),
);

assertDeepEqual(
  parseExpression("123 ? 456 : 789"),
  makeConditionalExpression(
    makePrimitiveExpression("123"),
    makePrimitiveExpression("456"),
    makePrimitiveExpression("789"),
  ),
);

assertDeepEqual(
  parseExpression("$super[123]"),
  makeGetSuperEnclaveExpression(makePrimitiveExpression("123")),
);

assertDeepEqual(
  parseExpression("$super(...123)"),
  makeCallSuperEnclaveExpression(makePrimitiveExpression("123")),
);

assertDeepEqual(
  parseExpression("{__proto__:12, [34]:56, foo:78, 'bar':90}"),
  makeObjectExpression(makePrimitiveExpression("12"), [
    [makePrimitiveExpression("34"), makePrimitiveExpression("56")],
    [makePrimitiveExpression('"foo"'), makePrimitiveExpression("78")],
    [makePrimitiveExpression("'bar'"), makePrimitiveExpression("90")],
  ]),
);

////////////
// Effect //
////////////

assertThrow(() => parseEffect("foo = 123"));

assertThrow(() => parseEffect("[foo] = 123"));

assertDeepEqual(
  parseEffect("$foo = 123"),
  makeWriteEnclaveEffect("foo", makePrimitiveExpression("123")),
);

assertDeepEqual(
  parseEffect("_foo = 123"),
  makeWriteEffect("foo", makePrimitiveExpression("123")),
);

assertDeepEqual(
  parseEffect("$super[123] = 456"),
  makeSetSuperEnclaveEffect(
    makePrimitiveExpression("123"),
    makePrimitiveExpression("456"),
  ),
);

assertDeepEqual(
  parseEffect("exportStatic('specifier', 123)"),
  makeStaticExportEffect("specifier", makePrimitiveExpression("123")),
);
