import { assertDeepEqual } from "../__fixture__.mjs";
import { parseBlock } from "../lang/index.mjs";
import { collectCalleeBlock } from "./callee.mjs";

const test = (code, result) => {
  assertDeepEqual(collectCalleeBlock(parseBlock(code)), result);
};

///////////
// Block //
///////////

test(`{ void (() => { return 123; }); }`, ["_0_1_1"]);

///////////////
// Statement //
///////////////

test(`{ return () => { return 123; }; }`, ["_0_1"]);
test(`{ debugger; }`, []);
test(`{ break label; }`, []);
test(`{ void (() => { return 123; }); }`, ["_0_1_1"]);
test(`{ let [x] = () => { return 123; } }`, ["_0_3"]);
test(`{ { void 123; } }`, []);
test(`{ if (() => { return 123; }) { void 456; } else { void 789; } }`, [
  "_0_1",
]);
test(`{ while (() => { return 123 }) { void 456; } }`, ["_0_1"]);
test(`{ try { void 123; } catch { void 456; } finally { void 789; } }`, []);

////////////
// Effect //
////////////

test(`{ x = () => { return 123; }; }`, ["_0_1_2"]);
test(`{ [x] = () => { return 123; }; }`, ["_0_1_2"]);
test(`{ specifier << (() => { return 123; }); }`, ["_0_1_2"]);
test(
  `{ (() => { return 123; }) ? void (() => { return 456; }) : void (() => { return 789; }) }`,
  ["_0_1_1", "_0_1_2_0_1", "_0_1_3_0_1"],
);
test(`{ void (() => { return 123; }); }`, ["_0_1_1"]);

////////////////
// Expression //
////////////////

test(`{ void (() => { return 123; }); }`, ["_0_1_1"]);
test(`{ void await (() => { return 123; }) }`, ["_0_1_1_1"]);
test(`{ void (yield () => { return 123; }); }`, ["_0_1_1_2"]);
test(`{ void (void (() => { return 123; }), () => { return 456; }); }`, [
  "_0_1_1_1_1",
  "_0_1_1_2",
]);
test(
  `{ void ((() => { return 123; }) ? (() => { return 456; }) : (() => { return 789; })); }`,
  ["_0_1_1_1", "_0_1_1_2", "_0_1_1_3"],
);
test(`{ void eval(() => { return 123; }); }`, ["_0_1_1_1"]);
test(
  `{ void (() => { return 123; })(!(() => { return 456; }), (() => { return 789; })); }`,
  ["_0_1_1_1", "_0_1_1_2", "_0_1_1_3_0"],
);
test(
  `{ void new (() => { return 123; })((() => { return 456; }), (() => { return 789; })); }`,
  ["_0_1_1_1", "_0_1_1_2_0", "_0_1_1_2_1"],
);
