import {assertEqual, assertThrow} from "../__fixture__.mjs";
import {parseAcornLoose} from "./acorn.mjs";
import {stringifyPrettier} from "./prettier.mjs";

import {
  parseExpression,
  parseEffect,
  parseStatement,
  parseBlock,
  parseLink,
  parseProgram,
  stringifyExpression,
  stringifyEffect,
  stringifyLink,
  stringifyBlock,
  stringifyProgram,
  stringifyStatement,
} from "./index.mjs";

const generateTest =
  (parse, stringify) =>
  (code1, code2 = code1) => {
    assertEqual(
      stringify(parse(code1)),
      stringifyPrettier(parseAcornLoose(code2)),
    );
  };

const testExpression = generateTest(parseExpression, stringifyExpression);
const testEffect = generateTest(parseEffect, stringifyEffect);
const testLink = generateTest(parseLink, stringifyLink);
const testStatement = generateTest(parseStatement, stringifyStatement);
const testProgram = generateTest(parseProgram, stringifyProgram);
const testBlock = generateTest(parseBlock, stringifyBlock);

////////////////
// Expression //
////////////////

testExpression("input;");

testExpression("123;");
testExpression("123n;");
testExpression("undefined;");
testExpression("null;");

testExpression("intrinsic['ReferenceError'];");
testExpression(
  "intrinsic.Symbol.unscopables;",
  "intrinsic['Symbol.unscopables'];",
);

testExpression("importStatic('specifier', 'source');");

testExpression("variable;");

testExpression("(() => { return 123; });");
testExpression("(async () => { return 123; });");
testExpression("(function () { return 123; });");
testExpression("(async function* method () { return 123; });");

testExpression("await 123;");

testExpression("yieldStraight(123);");
testExpression("yieldDelegate(123);");

testExpression("(effect(123), 456);");

testExpression("123 ? 456 : 789;");

testExpression("eval([variable1, variable2], 123);");

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

testExpression("123[456](789);");
testExpression(
  "intrinsic.ReferenceError[123](789);",
  "intrinsic['ReferenceError'][123](789);",
);
testExpression("intrinsic['ReferenceError'][123](789);");

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
testEffect("exportStatic('specifier', 123);");
testEffect("(effect(123), effect(456));");
testEffect("123 ? effect(456) : effect(789);");
testEffect("effect(123);");

///////////////
// Statement //
///////////////

testStatement("effect(123);");
testStatement("return 123;");
testStatement("break label;");
testStatement("debugger;");
testStatement("let variable = 123;");
testStatement("{ effect(123); }");
testStatement("label: { effect(123); }");
testStatement("if (123) { effect(456); } else { effect(789); }");
testStatement("while (123) { effect(123); }");
testStatement(
  "try { effect(123); } catch { effect(456); } finally { effect(789); }",
);

///////////
// Block //
///////////

testBlock("label1: label2: { let variable1, variable2; effect(123); }");
testBlock("{}");

//////////
// Link //
//////////

testLink("import 'source';");
testLink("import {specifier} from 'source';");
testLink("export {specifier};");
testLink("export * as specifier from 'source';");
testLink("export {specifier} from 'source';");
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
testProgram("'external'; ['new.target', 'this']; { return 123; }");
testProgram("'external'; []; { return 123; }");
testProgram("'internal'; let variable1, variable2; { return 123; }");
testProgram("'internal'; { return 123; }");
