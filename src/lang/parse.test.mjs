import {
  parseProgram,
  parseLink,
  parseBlock,
  parseStatement,
  parseEffect,
  parseExpression,
} from "./parse.mjs";

import {
  makeScriptProgram,
  makeModuleProgram,
  makeEvalProgram,
  makeImportLink,
  makeExportLink,
  makeAggregateLink,
  makeBlock,
  makeReturnStatement,
  makeEffectStatement,
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

import {assertDeepEqual, assertThrow} from "../__fixture__.mjs";

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

assertThrow(() => parseExpression("foo"));

assertDeepEqual(
  parseExpression("$new.target"),
  makeReadEnclaveExpression("new.target"),
);

assertThrow(() => parseExpression("foo.bar"));

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
  makeDynamicImportExpression(makePrimitiveExpression("'source'")),
);

assertDeepEqual(
  parseExpression("importStatic('source', specifier)"),
  makeStaticImportExpression("'source'", "specifier"),
);

assertDeepEqual(
  parseExpression("throwError(123)"),
  makeThrowExpression(makePrimitiveExpression("123")),
);

assertDeepEqual(
  parseExpression("eval([$this, $new.target], [_foo, _bar], 123)"),
  makeEvalExpression(
    ["this", "new.target"],
    ["foo", "bar"],
    makePrimitiveExpression("123"),
  ),
);

assertDeepEqual(
  parseExpression("await 123"),
  makeAwaitExpression(makePrimitiveExpression("123")),
);

assertDeepEqual(
  parseExpression("yieldStraight(123)"),
  makeYieldExpression(false, makePrimitiveExpression("123")),
);

assertDeepEqual(
  parseExpression("yieldDelegate(123)"),
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

assertDeepEqual(
  parseExpression("() => { return 123; }"),
  makeClosureExpression(
    "arrow",
    false,
    false,
    makeBlock([], [], [makeReturnStatement(makePrimitiveExpression("123"))]),
  ),
);

assertDeepEqual(
  parseExpression("async () => { return 123; }"),
  makeClosureExpression(
    "arrow",
    true,
    false,
    makeBlock([], [], [makeReturnStatement(makePrimitiveExpression("123"))]),
  ),
);

assertDeepEqual(
  parseExpression("function () { return 123; }"),
  makeClosureExpression(
    "function",
    false,
    false,
    makeBlock([], [], [makeReturnStatement(makePrimitiveExpression("123"))]),
  ),
);

assertDeepEqual(
  parseExpression("async function * method () { return 123; }"),
  makeClosureExpression(
    "method",
    true,
    true,
    makeBlock([], [], [makeReturnStatement(makePrimitiveExpression("123"))]),
  ),
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

assertThrow(() => parseEffect("foo()"));

assertDeepEqual(
  parseEffect("exportStatic('specifier', 123)"),
  makeStaticExportEffect("specifier", makePrimitiveExpression("123")),
);

assertDeepEqual(
  parseEffect("(effect(123), effect(456))"),
  makeSequenceEffect(
    makeExpressionEffect(makePrimitiveExpression("123")),
    makeExpressionEffect(makePrimitiveExpression("456")),
  ),
);

assertDeepEqual(
  parseEffect("123 ? effect(456) : effect(789)"),
  makeConditionalEffect(
    makePrimitiveExpression("123"),
    makeExpressionEffect(makePrimitiveExpression("456")),
    makeExpressionEffect(makePrimitiveExpression("789")),
  ),
);

///////////////
// Statement //
///////////////

assertDeepEqual(
  parseStatement("effect(123);"),
  makeEffectStatement(makeExpressionEffect(makePrimitiveExpression("123"))),
);

assertDeepEqual(parseStatement("debugger;"), makeDebuggerStatement());

assertDeepEqual(
  parseStatement("return 123;"),
  makeReturnStatement(makePrimitiveExpression("123")),
);

assertDeepEqual(parseStatement("break foo;"), makeBreakStatement("foo"));

assertDeepEqual(
  parseStatement("foo: {}"),
  makeBlockStatement(makeBlock(["foo"], [], [])),
);

assertDeepEqual(
  parseStatement("{ debugger; }"),
  makeBlockStatement(makeBlock([], [], [makeDebuggerStatement()])),
);

assertDeepEqual(
  parseStatement("if (123) foo: {} else bar: {}"),
  makeIfStatement(
    makePrimitiveExpression("123"),
    makeBlock(["foo"], [], []),
    makeBlock(["bar"], [], []),
  ),
);

assertDeepEqual(
  parseStatement("while (123) foo: {}"),
  makeWhileStatement(
    makePrimitiveExpression("123"),
    makeBlock(["foo"], [], []),
  ),
);

assertDeepEqual(
  parseStatement(
    "try { return 123; } catch { return 456; } finally { return 789; }",
  ),
  makeTryStatement(
    makeBlock([], [], [makeReturnStatement(makePrimitiveExpression("123"))]),
    makeBlock([], [], [makeReturnStatement(makePrimitiveExpression("456"))]),
    makeBlock([], [], [makeReturnStatement(makePrimitiveExpression("789"))]),
  ),
);

assertDeepEqual(
  parseStatement("let $x = 123;"),
  makeDeclareEnclaveStatement("let", "x", makePrimitiveExpression("123")),
);

///////////
// Block //
///////////

assertDeepEqual(parseBlock("{}"), makeBlock([], [], []));

assertDeepEqual(
  parseBlock("foo: bar: { let _qux, _buz; debugger; }"),
  makeBlock(["foo", "bar"], ["qux", "buz"], [makeDebuggerStatement()]),
);

//////////
// Link //
//////////

assertDeepEqual(
  parseLink("export * from 'source';"),
  makeAggregateLink("'source'", null, null),
);

assertDeepEqual(
  parseLink("export * as specifier from 'source';"),
  makeAggregateLink("'source'", null, "specifier"),
);

assertDeepEqual(
  parseLink("export { specifier1 as specifier2 } from 'source';"),
  makeAggregateLink("'source'", "specifier1", "specifier2"),
);

assertDeepEqual(parseLink("export { function };"), makeExportLink("function"));

assertDeepEqual(
  parseLink("import 'source';"),
  makeImportLink("'source'", null),
);

assertDeepEqual(
  parseLink("import {specifier} from 'source';"),
  makeImportLink("'source'", "specifier"),
);

/////////////
// Program //
/////////////

assertThrow(() => parseProgram("foo;"));

assertDeepEqual(
  parseProgram("module; import 'source'; export {specifier}; { debugger; }"),
  makeModuleProgram(
    [makeImportLink("'source'", null), makeExportLink("specifier")],
    makeBlock([], [], [makeDebuggerStatement()]),
  ),
);

assertDeepEqual(
  parseProgram("script; return 123;"),
  makeScriptProgram([makeReturnStatement(makePrimitiveExpression("123"))]),
);

assertThrow(() => parseProgram("eval;"));

assertDeepEqual(
  parseProgram("eval; { return 123; }"),
  makeEvalProgram(
    [],
    [],
    makeBlock([], [], [makeReturnStatement(makePrimitiveExpression("123"))]),
  ),
);

assertThrow(() => parseProgram("eval; foo; bar;"));

assertDeepEqual(
  parseProgram("eval; let _foo, _bar; { return 123; }"),
  makeEvalProgram(
    [],
    ["foo", "bar"],
    makeBlock([], [], [makeReturnStatement(makePrimitiveExpression("123"))]),
  ),
);

assertDeepEqual(
  parseProgram("eval; [$this, $new.target]; { return 123; }"),
  makeEvalProgram(
    ["this", "new.target"],
    [],
    makeBlock([], [], [makeReturnStatement(makePrimitiveExpression("123"))]),
  ),
);

assertDeepEqual(
  parseProgram("eval; [$this, $new.target]; let _foo, _bar; { return 123; }"),
  makeEvalProgram(
    ["this", "new.target"],
    ["foo", "bar"],
    makeBlock([], [], [makeReturnStatement(makePrimitiveExpression("123"))]),
  ),
);
