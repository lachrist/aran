import { assertEqual, assertThrow } from "../fixture.mjs";

import { parseBabel } from "./babel.mjs";

import { stringifyPrettier } from "./prettier.mjs";

import {
  parseProgram,
  parseLink,
  parseBlock,
  parseStatement,
  parseEffect,
  parseExpression,
} from "./parse.mjs";

import {
  stringifyProgram,
  stringifyLink,
  stringifyBlock,
  stringifyStatement,
  stringifyEffect,
  stringifyExpression,
} from "./stringify.mjs";

/**
 * @template N
 * @param {(code: string) => N} parse
 * @param {(node: N) => string} stringify
 * @return {(code1: string, code2?: string) => void}
 */
const compileTest =
  (parse, stringify) =>
  (code1, code2 = code1) => {
    assertEqual(stringify(parse(code1)), stringifyPrettier(parseBabel(code2)));
  };

const testExpression = compileTest(parseExpression, stringifyExpression);
const testEffect = compileTest(parseEffect, stringifyEffect);
const testLink = compileTest(parseLink, stringifyLink);
const testStatement = compileTest(parseStatement, stringifyStatement);
const testProgram = compileTest(parseProgram, stringifyProgram);
const testBlock = compileTest(parseBlock, stringifyBlock);

////////////////
// Expression //
////////////////

testExpression("new.target;");
testExpression("import.dynamic;");
testExpression("import.meta;");
assertThrow(() => testExpression("import.foo;"));
testExpression("super.get;");
testExpression("super.set;");
testExpression("super.call;");
assertThrow(() => testExpression("super.foo;"));
testExpression("this;");
testExpression("error;");
testExpression("arguments;");

testExpression("123;");
testExpression("123n;");
testExpression("undefined;");
testExpression("null;");

testExpression("intrinsic['ReferenceError'];");
testExpression(
  "intrinsic.Symbol.unscopables;",
  "intrinsic['Symbol.unscopables'];",
);
assertThrow(() => testExpression("[].unscopables;"));

assertThrow(() => testExpression("'source' >> [];"));
testExpression("'source' >> 'specifier';");
testExpression("'source' >> '*';");
testExpression("'source' >> specifier;", "'source' >> 'specifier';");

testExpression("variable;");
testExpression("[variable];");
testExpression("typeof [variable];");

testExpression("(() => { return 123; });");
testExpression("(async () => { return 123; });");
testExpression("(function () { return 123; });");
testExpression("(async function* method () { return 123; });");

testExpression("await 123;");

testExpression("yield 123;");
testExpression("yield* 123;");

testExpression("(void 123, 456);");

testExpression("123 ? 456 : 789;");

testExpression("eval(123);");

testExpression("123(456, 789);", "123(!undefined, 456, 789)");
testExpression(
  "intrinsic['ReferenceError'](123, 456);",
  "intrinsic['ReferenceError'](!undefined, 123, 456);",
);
testExpression(
  "intrinsic.ReferenceError(123, 456);",
  "intrinsic['ReferenceError'](!undefined, 123, 456);",
);

testExpression("123(!456, 789);");
testExpression(
  "intrinsic['ReferenceError'](!123, 456, 789);",
  "intrinsic['ReferenceError'](!123, 456, 789);",
);
testExpression(
  "intrinsic.ReferenceError(!123, 456, 789);",
  "intrinsic['ReferenceError'](!123, 456, 789);",
);

// testExpression("123[456](789);");
// testExpression(
//   "intrinsic.ReferenceError[123](789);",
//   "intrinsic['ReferenceError'][123](789);",
// );
// testExpression("intrinsic['ReferenceError'][123](789);");

testExpression("new 123(456, 789);");
testExpression(
  "new intrinsic.ReferenceError(123, 456)",
  "new intrinsic['ReferenceError'](123, 456)",
);
testExpression("new intrinsic['ReferenceError'](123, 456)");

////////////
// Effect //
////////////

assertThrow(() => {
  testEffect("foo();");
});

testEffect("variable = 123;");
assertThrow(() => {
  testEffect("({variable} = 123);");
});
testEffect("[variable] = 123;");
testEffect("'specifier' << 123;");
testEffect("specifier << 123;", "'specifier' << 123;");
testEffect("123 ? undefined : undefined;");
testEffect("123 ? void 456 : void 789;");
testEffect("1 ? (void 2, void 3, void 4) : (void 4, void 5, void 6);");
testEffect("void 123;");

///////////////
// Statement //
///////////////

testStatement("void 123;");
testStatement("return 123;");
testStatement("break label;");
testStatement("debugger;");
testStatement("let [variable] = 123;");
testStatement("{ void 123; }");
testStatement("label: { void 123; }");
testStatement("if (123) { void 456; } else { void 789; }");
testStatement("while (123) { void 123; }");
testStatement("try { void 123; } catch { void 456; } finally { void 789; }");

///////////
// Block //
///////////

testBlock("label1: label2: { let variable1, variable2; void 123; }");
testBlock("{}");

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
