
import {assertEqual} from "../../__fixture__.mjs";
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

const generateTest = (parse, stringify) => (code) => {
  assertEqual(
    stringify(parse(code)),
    stringifyPrettier(parseAcornLoose(code)),
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

testExpression("input");

testExpression("123;");
testExpression("123n;");
testExpression("undefined;");
testExpression("null;");

testExpression("intrinsic('ReferenceError');");

testExpression("importStatic('specifier', 'source');");

testExpression("$variable;");

testExpression("_variable;");

testExpression("typeof $variable;");

testExpression("(() => { return 123; });");
testExpression("(async () => { return 123; });");
testExpression("(function () { return 123; });");
testExpression("(async function* method () { return 123; });");

testExpression("await 123;");

testExpression("yieldStraight(123);");
testExpression("yieldDelegate(123);");

testExpression("throwError(123);");

testExpression("(effect(123), 456);");

testExpression("123 ? 456 : 789;");

testExpression("$super[123];");

testExpression("$super(...123);");

testExpression("eval([$new.target, $this], [_variable1, _variable2], 123);");

testExpression("import(123);");

testExpression("123(456, 789)");

testExpression("new 123(456)");

testExpression("!123;");

testExpression("123 + 456;");

// testExpression("({__proto__:12, [34]:56, key:78, 'k.e.y':90});");

////////////
// Effect //
////////////

testEffect("$super[123] = 456;");
testEffect("_variable = 123;");
testEffect("$variable = 123;");
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
testStatement("let $variable = 123;");
testStatement("{ effect(123); }");
testStatement("if (123) { effect(456); } else { effect(789); }");
testStatement("while (123) { effect(123); }");
testStatement("try { effect(123); } catch { effect(456); } finally { effect(789); }");

///////////
// Block //
///////////

testBlock("label1: label2: { let _variable1, _variable2; effect(123); }");

//////////
// Link //
//////////

testLink("import 'source';");
testLink("import {specifier} from 'source';");
testLink("export {specifier};");
// testLink("export {specifier1 as specifier2} from 'source';");
testLink("export * as specifier from 'source';");
testLink("export * from 'source';");

/////////////
// Program //
/////////////

testProgram("('script'); return 123;");
testProgram("('module'); import 'source'; { effect(123); }");
testProgram("('eval'); [$new.target, $this]; let _variable1, _variable2; { return 123; }");
