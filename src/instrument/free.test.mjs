import { assertEqual } from "../__fixture__.mjs";
import { partialx___ } from "../util/index.mjs";
import { parseBlock } from "../lang/index.mjs";
import { hasBlockFreeVariable } from "./free.mjs";

const test = (internal, code, variable, result) => {
  assertEqual(
    hasBlockFreeVariable(parseBlock(code), { internal, variable }),
    result,
  );
};

const testInternal = partialx___(test, true);
const testExternal = partialx___(test, false);

///////////
// Block //
///////////

testInternal(`{ void 123; }`, "x", false);
testInternal(`{ void x; }`, "x", true);
testInternal(`{ let x; void x; }`, "x", false);

///////////////
// Statement //
///////////////

testInternal(`{ return 123; }`, "x", false);
testInternal(`{ return x; }`, "x", true);

testInternal(`{ debugger; }`, "x", false);

testInternal(`{ break label; }`, "x", false);

testInternal(`{ void x; }`, "x", true);
testInternal(`{ void x; }`, "y", false);

testInternal(`{ let [x] = 123 }`, "x", false);
testInternal(`{ let [x] = x }`, "x", true);

testInternal(`{ { void 123; } }`, "x", false);
testInternal(`{ { void x; } }`, "x", true);

testInternal(`{ if (123) { void 456; } else { void 789; } }`, "x", false);
testInternal(`{ if (x) { void 456; } else { void 789; } }`, "x", true);
testInternal(`{ if (123) { void x; } else { void 789; } }`, "x", true);
testInternal(`{ if (123) { void 456; } else { void x; } }`, "x", true);

testInternal(`{ while (123) { void 456; } }`, "x", false);
testInternal(`{ while (x) { void 456; } }`, "x", true);
testInternal(`{ while (123) { void x; } }`, "x", true);

testInternal(
  `{ try { void 123; } catch { void 456; } finally { void 789; } }`,
  "x",
  false,
);
testInternal(
  `{ try { void x; } catch { void 456; } finally { void 789; } }`,
  "x",
  true,
);
testInternal(
  `{ try { void 123; } catch { void x; } finally { void 789; } }`,
  "x",
  true,
);
testInternal(
  `{ try { void 123; } catch { void 456; } finally { void x; } }`,
  "x",
  true,
);

////////////
// Effect //
////////////

testInternal(`{ x = 123; }`, "x", true);
testExternal(`{ x = 123; }`, "x", false);
testInternal(`{ x = 123; }`, "y", false);

testExternal(`{ [x] = 123; }`, "x", true);
testInternal(`{ [x] = 123; }`, "x", false);
testExternal(`{ [x] = 123; }`, "y", false);

testInternal(`{ specifier << 123; }`, "x", false);
testInternal(`{ specifier << x; }`, "x", true);

testInternal(`{ 123 ? void 456 : void 789; }`, "x", false);
testInternal(`{ x ? void 456 : void 789; }`, "x", true);
testInternal(`{ 123 ? void x : void 789; }`, "x", true);
testInternal(`{ 123 ? void 456 : void x; }`, "x", true);

testInternal(`{ void 123; }`, "x", false);
testInternal(`{ void x; }`, "x", true);

////////////////
// Expression //
////////////////

// ReadExpression
testInternal(`{ void x; }`, "x", true);
testExternal(`{ void x; }`, "x", false);
testInternal(`{ void x; }`, "y", false);

// ReadExternalExpression
testExternal(`{ void [x]; }`, "x", true);
testInternal(`{ void [x]; }`, "x", false);
testExternal(`{ void [x]; }`, "y", false);

// TypeofExternalExpression
testExternal(`{ void typeof [x]; }`, "x", true);
testInternal(`{ void typeof [x]; }`, "x", false);
testExternal(`{ void typeof [x]; }`, "y", false);

// ClosureExpression
testInternal(`{ void (() => { return 123; }); }`, "x", false);
testInternal(`{ void (() => { return x; }); }`, "x", true);

// AwaitExpression
testInternal(`{ void await 123; }`, "x", false);
testInternal(`{ void await x; }`, "x", true);

// YieldExpression
testInternal(`{ void (yield 123); }`, "x", false);
testInternal(`{ void (yield x); }`, "x", true);

// SequenceExpression
testInternal(`{ void (void 123, 456); }`, "x", false);
testInternal(`{ void (void x, 456); }`, "x", true);
testInternal(`{ void (void 123, x); }`, "x", true);

// ConditionalExpression
testInternal(`{ void (123 ? 456 : 789); }`, "x", false);
testInternal(`{ void (x ? 456 : 789); }`, "x", true);
testInternal(`{ void (123 ? x : 789); }`, "x", true);
testInternal(`{ void (123 ? 456 : x); }`, "x", true);

// EvalExpression
testInternal(`{ void eval(123); }`, "x", false);
testInternal(`{ void eval(x); }`, "x", true);

// ApplyExpression
testInternal(`{ void 123(!456, 789); }`, "x", false);
testInternal(`{ void x(!456, 789); }`, "x", true);
testInternal(`{ void 123(!x, 789); }`, "x", true);
testInternal(`{ void 123(!456, x); }`, "x", true);

// ConstructExpression
testInternal(`{ void new 123(456, 789); }`, "x", false);
testInternal(`{ void new x(456, 789); }`, "x", true);
testInternal(`{ void new 123(x, 789); }`, "x", true);
testInternal(`{ void new 123(456, x); }`, "x", true);
