import { assertEqual, assertNotEqual } from "./test.fixture.mjs";
import { parse } from "./syntax/index.mjs";
import { allign } from "./allign.mjs";

/** @type {(code1: string, code2?: string) => void} */
const testSuccess = (code1, code2 = code1) => {
  assertEqual(allign(parse(code1), parse(code2)), null);
};

/** @type {(code1: string, code2: string) => void} */
const testFailure = (code1, code2) => {
  assertNotEqual(allign(parse(code1), parse(code2)), null);
};

testFailure("'expression'; 123;", "'expression'; [x];");

////////////////
// Expression //
////////////////

testSuccess("'expression'; this;");

testFailure("'expression'; this;", "'expression'; new.target;");

testSuccess("'expression'; intrinsic.ReferenceError;");

testFailure(
  "'expression'; intrinsic.ReferenceError;",
  "'expression'; intrinsic.SyntaxError;",
);

testSuccess("'expression'; 123;");
testFailure("'expression'; 123;", "'expression'; 321;");

testSuccess("'expression'; 123n;");
testFailure("'expression'; 123n;", "'expression'; 321n;");

testSuccess("'expression'; x;", "'expression'; X;");

testSuccess("'expression'; [x];");
testFailure("'expression'; [x];", "'expression'; [X];");

testSuccess("'expression'; typeof [x];");
testFailure("'expression'; typeof [x];", "'expression'; typeof [X];");

testSuccess("'expression'; 'source' >> specifier;");
testFailure(
  "'expression'; 'source' >> specifier;",
  "'expression'; 'SOURCE' >> specifier;",
);
testFailure(
  "'expression'; 'source' >> specifier;",
  "'expression'; 'source' >> SPECIFIER;",
);

testSuccess("'expression'; await 123;");
testFailure("'expression'; await 123;", "'expression'; await 321;");

testSuccess("'expression'; yield 123;");
testSuccess("'expression'; yield* 123;");
testFailure("'expression'; yield 123;", "'expression'; yield* 123;");
testFailure("'expression'; yield* 123;", "'expression'; yield 123;");
testFailure("'expression'; yield 123;", "'expression'; yield 321;");

testSuccess("'expression'; (void 123, 456);");
testFailure("'expression'; (void 123, 456);", "'expression'; (void 321, 456);");
testFailure("'expression'; (void 123, 456);", "'expression'; (void 123, 654);");

testSuccess("'expression'; 123 ? 456 : 789;");
testFailure("'expression'; 123 ? 456 : 789;", "'expression'; 321 ? 456 : 789;");
testFailure("'expression'; 123 ? 456 : 789;", "'expression'; 123 ? 654 : 789;");
testFailure("'expression'; 123 ? 456 : 789;", "'expression'; 123 ? 456 : 987;");

testSuccess("'expression'; 123(!456, 789);");
testFailure("'expression'; 123(!456, 789);", "'expression'; 321(!456, 789);");
testFailure("'expression'; 123(!456, 789);", "'expression'; 123(!654, 789);");
testFailure("'expression'; 123(!456, 789);", "'expression'; 123(!456, 987);");

testSuccess("'expression'; new 123(456);");
testFailure("'expression'; new 123(456);", "'expression'; new 321(456);");
testFailure("'expression'; new 123(456);", "'expression'; new 123(654);");

testSuccess("'expression'; (function () { 123; });");
testFailure(
  "'expression'; (function () { 123; });",
  "'expression'; (function method () { 123; });",
);
testFailure(
  "'expression'; (function () { 123; });",
  "'expression'; (async function () { 123; });",
);
testFailure(
  "'expression'; (function () { 123; });",
  "'expression'; (function* () { 123; });",
);
testFailure(
  "'expression'; (function () { 123; });",
  "'expression'; (function () { 321; });",
);

testSuccess("'expression'; eval(123);");
testFailure("'expression'; eval(123);", "'expression'; eval(321);");

////////////
// Effect //
////////////

testSuccess("'effect'; void 123;");
testFailure("'effect'; void 123;", "'effect'; void 321;");

testSuccess("'effect'; specifier << 123;");
testFailure("'effect'; specifier << 123;", "'effect'; SPECIFIER << 123;");
testFailure("'effect'; specifier << 123;", "'effect'; specifier << 321;");

testSuccess("'effect'; x = 123;");
testFailure("'effect'; x = 123;", "'effect'; x = 321;");

testSuccess("'effect'; [x] = 123;");
testFailure("'effect'; [x] = 123;", "'effect'; [x] = 321;");
testFailure("'effect'; [x] = 123;", "'effect'; [X] = 123;");

testSuccess("'effect'; 123 ? void 456 : void 789;");
testFailure(
  "'effect'; 123 ? void 456 : void 789;",
  "'effect'; 321 ? void 456 : void 789;",
);
testFailure(
  "'effect'; 123 ? void 456 : void 789;",
  "'effect'; 123 ? void 654 : void 789;",
);
testFailure(
  "'effect'; 123 ? void 456 : void 789;",
  "'effect'; 123 ? void 456 : void 987;",
);

///////////////
// Statement //
///////////////

testSuccess("'statement'; debugger;");

testSuccess("'statement'; void 123;");
testFailure("'statement'; void 123;", "'statement'; void 321;");

testSuccess("'statement'; break l;", "'statement'; break L;");

testSuccess("'statement'; return 123;");
testFailure("'statement'; return 123;", "'statement'; return 321;");

testSuccess("'statement'; let [x] = 123;");
testFailure("'statement'; let [x] = 123;", "'statement'; const [x] = 123;");
testFailure("'statement'; let [x] = 123;", "'statement'; let [y] = 123;");
testFailure("'statement'; let [x] = 123;", "'statement'; let [x] = 321;");

testSuccess("'statement'; { void 123; }");
testFailure("'statement'; { void 123; }", "'statement'; { void 321; }");

testSuccess("'statement'; if (123) { void 456; } else { void 789; }");
testFailure(
  "'statement'; if (123) { void 456; } else { void 789; }",
  "'statement'; if (321) { void 456; } else { void 789; }",
);
testFailure(
  "'statement'; if (123) { void 456; } else { void 789; }",
  "'statement'; if (123) { void 654; } else { void 789; }",
);
testFailure(
  "'statement'; if (123) { void 456; } else { void 789; }",
  "'statement'; if (123) { void 456; } else { void 987; }",
);

testSuccess("'statement'; while (123) { void 456; }");
testFailure(
  "'statement'; while (123) { void 456; }",
  "'statement'; while (321) { void 456; }",
);
testFailure(
  "'statement'; while (123) { void 456; }",
  "'statement'; while (123) { void 654; }",
);

testSuccess(
  "'statement'; try { void 123; } catch { void 456; } finally { void 789; }",
);
testFailure(
  "'statement'; try { void 123; } catch { void 456; } finally { void 789; }",
  "'statement'; try { void 321; } catch { void 456; } finally { void 789; }",
);
testFailure(
  "'statement'; try { void 123; } catch { void 456; } finally { void 789; }",
  "'statement'; try { void 123; } catch { void 654; } finally { void 789; }",
);
testFailure(
  "'statement'; try { void 123; } catch { void 456; } finally { void 789; }",
  "'statement'; try { void 123; } catch { void 456; } finally { void 987; }",
);

//////////
// Link //
//////////

testSuccess("'link'; export {specifier};");
testFailure("'link'; export {specifier};", "'link'; export {SPECIFIER};");

testSuccess("'link'; import {specifier} from 'source';");
testFailure(
  "'link'; import {specifier} from 'source';",
  "'link'; import {SPECIFIER} from 'source';",
);
testFailure(
  "'link'; import {specifier} from 'source';",
  "'link'; import {specifier} from 'SOURCE';",
);

testSuccess("'link'; export {specifier1 as specifier2} from 'source';");
testFailure(
  "'link'; export {specifier1 as specifier2} from 'source';",
  "'link'; export {SPECIFIER1 as specifier2} from 'source';",
);
testFailure(
  "'link'; export {specifier1 as specifier2} from 'source';",
  "'link'; export {specifier1 as SPECIFIER2} from 'source';",
);
testFailure(
  "'link'; export {specifier1 as specifier2} from 'source';",
  "'link'; export {specifier1 as specifier2} from 'SOURCE';",
);

///////////
// Block //
///////////

testSuccess(
  "'control-block'; l: { break l; }",
  "'control-block'; L: { break L; }",
);
testFailure(
  "'control-block'; l: { break l; }",
  "'control-block'; L: { break l; }",
);
testSuccess(
  "'control-block'; { l: { break l; } l: { break l; } }",
  "'control-block'; { l: { break l; } L: { break L; } }",
);
testSuccess(
  "'control-block'; { let x; x = x; }",
  "'control-block'; { let y; y = y; }",
);
testFailure(
  "'control-block'; { let x; x = x; }",
  "'control-block'; { let x; y = y; }",
);
testSuccess(
  "'control-block'; { let x; x = x; { let x; x = x } }",
  "'control-block'; { let x; x = x; { let X; X = X } }",
);

//////////////////
// Pseudo-Block //
//////////////////

testSuccess("'pseudo-block'; void 123; 456;");
testFailure("'pseudo-block'; void 123; 456;", "'pseudo-block'; void 321; 456;");
testFailure("'pseudo-block'; void 123; 456;", "'pseudo-block'; void 123; 654;");

///////////////////
// Closure-Block //
///////////////////

testSuccess("'closure-block'; { void 123; 456; }");
testFailure(
  "'closure-block'; { void 123; 456; }",
  "'closure-block'; { void 321; 456; }",
);
testFailure(
  "'closure-block'; { void 123; 456; }",
  "'closure-block'; { void 123; 654; }",
);
testSuccess(
  "'closure-block'; { let x; x = x; 123; }",
  "'closure-block'; { let y; y = y; 123; }",
);
testFailure(
  "'closure-block'; { let x; x = x; 123; }",
  "'closure-block'; { let x; y = y; 123; }",
);
testSuccess(
  "'closure-block'; { let x; x = x; { let x; x = x; } 123; }",
  "'closure-block'; { let x; x = x; { let X; X = X; } 123; }",
);

/////////////
// Program //
/////////////

testSuccess("'script'; 123;", "'script'; 123;");
testFailure("'script'; 123;", "'script'; 321;");

testSuccess(
  "'module'; export {specifier}; { 123; }",
  "'module'; export {specifier}; { 123; }",
);
testFailure(
  "'module'; export {specifier}; { 123; }",
  "'module'; export {SPECIFIER}; { 123; }",
);
testFailure(
  "'module'; export {specifier}; { 123; }",
  "'module'; export {specifier}; { 321; }",
);

testSuccess("'eval'; { 123; }", "'eval'; { 123; }");
testFailure("'eval'; { 123; }", "'eval'; { 321; }");

//////////////
// Variable //
//////////////

testFailure(
  "'control-block'; { void x; void x; }",
  "'control-block'; { void x; void y; }",
);

///////////
// Label //
///////////

testFailure(
  "'control-block'; { break l; break l; }",
  "'control-block'; { break l; break m;}",
);
