import { assertEqual, assertThrow } from "../../fixture.mjs";

import { parseEstree } from "../../../lib/syntax/parse.mjs";

import { formatEstree } from "../../../lib/syntax/format.mjs";

import { parse, format } from "../../../lib/syntax/index.mjs";

/** @type {(code1: string, code2?: string) => void} */
const test = (code1, code2 = code1) => {
  assertEqual(format(parse(code1)), formatEstree(parseEstree(code2)));
};

////////////////
// Expression //
////////////////

test("'expression'; new.target;");
test("'expression'; import.dynamic;");
test("'expression'; import.meta;");
assertThrow(() => test("'expression'; import.foo;"));
test("'expression'; super.get;");
test("'expression'; super.set;");
test("'expression'; super.call;");
assertThrow(() => test("'expression'; super.foo;"));
test("'expression'; this;");
test("'expression'; error;");
test("'expression'; arguments;");

test("'expression'; 123;");
test("'expression'; 123n;");
test("'expression'; undefined;");
test("'expression'; null;");

test("'expression'; intrinsic['ReferenceError'];");
test(
  "'expression'; intrinsic.Symbol.unscopables;",
  "'expression'; intrinsic['Symbol.unscopables'];",
);
assertThrow(() => test("'expression'; [].unscopables;"));

assertThrow(() => test("'expression'; 'source' >> [];"));
test("'expression'; 'source' >> 'specifier';");
test("'expression'; 'source' >> '*';");
test(
  "'expression'; 'source' >> specifier;",
  "'expression'; 'source' >> 'specifier';",
);

test("'expression'; variable;");
test("'expression'; [variable];");
test("'expression'; typeof [variable];");

test("'expression'; (() => { 123; });");
test("'expression'; (async () => { 123; });");
test("'expression'; (function () { 123; });");
test("'expression'; (async function* method () { 123; });");

test("'expression'; await 123;");

test("'expression'; yield 123;");
test("'expression'; yield* 123;");

test("'expression'; (void 123, 456);");

test("'expression'; 123 ? 456 : 789;");

test("'expression'; eval(123);");

test("'expression'; 123(456, 789);", "'expression'; 123(!undefined, 456, 789)");
test(
  "'expression'; intrinsic['ReferenceError'](123, 456);",
  "'expression'; intrinsic['ReferenceError'](!undefined, 123, 456);",
);
test(
  "'expression'; intrinsic.ReferenceError(123, 456);",
  "'expression'; intrinsic['ReferenceError'](!undefined, 123, 456);",
);

test("'expression'; 123(!456, 789);");
test(
  "'expression'; intrinsic['ReferenceError'](!123, 456, 789);",
  "'expression'; intrinsic['ReferenceError'](!123, 456, 789);",
);
test(
  "'expression'; intrinsic.ReferenceError(!123, 456, 789);",
  "'expression'; intrinsic['ReferenceError'](!123, 456, 789);",
);

test("'expression'; new 123(456, 789);");
test(
  "'expression'; new intrinsic.ReferenceError(123, 456)",
  "'expression'; new intrinsic['ReferenceError'](123, 456)",
);
test("'expression'; new intrinsic['ReferenceError'](123, 456)");

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
test("'effect'; specifier << 123;", "'effect'; 'specifier' << 123;");
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

test("'link'; import 'source';");
test("'link'; import {specifier as specifier} from 'source';");
test("'link'; export {specifier as specifier};");
test("'link'; export * as specifier from 'source';");
test("'link'; export {specifier as specifier} from 'source';");
test("'link'; export {specifier1 as specifier2} from 'source';");
test("'link'; export * as specifier from 'source';");
test("'link'; export * from 'source';");

/////////////
// Program //
/////////////

assertThrow(() => {
  test("'invalid-directive';");
});

test("'script'; 123;");
test("'module'; import 'source'; { 123; }");
test("'eval'; { 123; }");
