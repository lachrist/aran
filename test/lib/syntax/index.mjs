import { assertEqual, assertThrow } from "../../fixture.mjs";

import { parseBabel } from "../../../lib/syntax/babel.mjs";

import { formatPrettier } from "../../../lib/syntax/prettier.mjs";

import { parse, format } from "../../../lib/syntax/index.mjs";

/** @type {(code1: string, code2?: string) => void} */
const test = (code1, code2 = code1) => {
  assertEqual(format(parse(code1)), formatPrettier(parseBabel(code2)));
};

////////////////
// Expression //
////////////////

testExpression("'expression'; new.target;");
testExpression("'expression'; import.dynamic;");
testExpression("'expression'; import.meta;");
assertThrow(() => testExpression("'expression'; import.foo;"));
testExpression("'expression'; super.get;");
testExpression("'expression'; super.set;");
testExpression("'expression'; super.call;");
assertThrow(() => testExpression("'expression'; super.foo;"));
testExpression("'expression'; this;");
testExpression("'expression'; error;");
testExpression("'expression'; arguments;");

testExpression("'expression'; 123;");
testExpression("'expression'; 123n;");
testExpression("'expression'; undefined;");
testExpression("'expression'; null;");

testExpression("'expression'; intrinsic['ReferenceError'];");
testExpression(
  "'expression'; intrinsic.Symbol.unscopables;",
  "'expression'; intrinsic['Symbol.unscopables'];",
);
assertThrow(() => testExpression("'expression'; [].unscopables;"));

assertThrow(() => testExpression("'expression'; 'source' >> [];"));
testExpression("'expression'; 'source' >> 'specifier';");
testExpression("'expression'; 'source' >> '*';");
testExpression(
  "'expression'; 'source' >> specifier;",
  "'source' >> 'specifier';",
);

testExpression("'expression'; variable;");
testExpression("'expression'; [variable];");
testExpression("'expression'; typeof [variable];");

testExpression("'expression'; (() => { return 123; });");
testExpression("'expression'; (async () => { return 123; });");
testExpression("'expression'; (function () { return 123; });");
testExpression("'expression'; (async function* method () { return 123; });");

testExpression("'expression'; await 123;");

testExpression("'expression'; yield 123;");
testExpression("'expression'; yield* 123;");

testExpression("'expression'; (void 123, 456);");

testExpression("'expression'; 123 ? 456 : 789;");

testExpression("'expression'; eval(123);");

testExpression("'expression'; 123(456, 789);", "123(!undefined, 456, 789)");
testExpression(
  "'expression'; intrinsic['ReferenceError'](123, 456);",
  "'expression'; intrinsic['ReferenceError'](!undefined, 123, 456);",
);
testExpression(
  "'expression'; intrinsic.ReferenceError(123, 456);",
  "'expression'; intrinsic['ReferenceError'](!undefined, 123, 456);",
);

testExpression("'expression'; 123(!456, 789);");
testExpression(
  "'expression'; intrinsic['ReferenceError'](!123, 456, 789);",
  "'expression'; intrinsic['ReferenceError'](!123, 456, 789);",
);
testExpression(
  "'expression'; intrinsic.ReferenceError(!123, 456, 789);",
  "'expression'; intrinsic['ReferenceError'](!123, 456, 789);",
);

testExpression("'expression'; new 123(456, 789);");
testExpression(
  "'expression'; new intrinsic.ReferenceError(123, 456)",
  "'expression'; new intrinsic['ReferenceError'](123, 456)",
);
testExpression("'expression'; new intrinsic['ReferenceError'](123, 456)");

////////////
// Effect //
////////////

assertThrow(() => {
  test("'effect'; foo();");
});

test("'effect'; variable = 123;");
assertThrow(() => {
  test("'effect'; ({variable} = 123);");
});
test("'effect'; [variable] = 123;");
test("'effect'; 'specifier' << 123;");
test("'effect'; specifier << 123;", "'specifier' << 123;");
test("'effect'; 123 ? undefined : undefined;");
test("'effect'; 123 ? void 456 : void 789;");
test("'effect'; 1 ? (void 2, void 3, void 4) : (void 4, void 5, void 6);");
test("'effect'; void 123;");

///////////////
// Statement //
///////////////

test("'statement'; void 123;");
test("'statement'; return 123;");
test("'statement'; break label;");
test("'statement'; debugger;");
test("'statement'; let [variable] = 123;");
test("'statement'; { void 123; }");
test("'statement'; label: { void 123; }");
test("'statement'; if (123) { void 456; } else { void 789; }");
test("'statement'; while (123) { void 123; }");
test(
  "'statement'; try { void 123; } catch { void 456; } finally { void 789; }",
);

///////////
// Block //
///////////

test(
  "'control-block'; label1: label2: { let variable1, variable2; void 123; }",
);
test("'control-block'; {}");

//////////
// Link //
//////////

testLink("import 'source';");
testLink("import {specifier as specifier} from 'source';");
testLink("export {specifier as specifier};");
testLink("export * as specifier from 'source';");
testLink("export {specifier as specifier} from 'source';");
testLink("export {specifier1 as specifier2} from 'source';");
testLink("export * as specifier from 'source';");
testLink("export * from 'source';");

/////////////
// Program //
/////////////

assertThrow(() => {
  testProgram("'foo';");
});

testProgram("'script'; return 123;");
testProgram("'module'; import 'source'; { return 123; }");
testProgram("'eval'; { return 123; }");
