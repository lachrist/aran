import { assertEqual, assertNotEqual } from "../__fixture__.mjs";
import {
  parseExpression,
  parseEffect,
  parseBlock,
  parseStatement,
  parseLink,
  parseProgram,
} from "../lang/index.mjs";
import { makeRootError } from "./error.mjs";
import { getResultError } from "./result.mjs";
import {
  visitExpression,
  visitEffect,
  visitBlock,
  visitStatement,
  visitLink,
  visitProgram,
} from "./visit.mjs";

const generateAssert = (parse, visit) => (code1, code2, success) => {
  const error = getResultError(
    visit(parse(code1), parse(code2), makeRootError()),
  );
  if (success) {
    assertEqual(error, null);
  } else {
    assertNotEqual(error, null);
  }
};

const assertExpression = generateAssert(parseExpression, visitExpression);
const assertEffect = generateAssert(parseEffect, visitEffect);
const assertLink = generateAssert(parseLink, visitLink);
const assertBlock = generateAssert(parseBlock, visitBlock);
const assertStatement = generateAssert(parseStatement, visitStatement);
const assertProgram = generateAssert(parseProgram, visitProgram);

assertExpression("123;", "_x;", false);

////////////////
// Expression //
////////////////

assertExpression("this;", "this;", true);

assertExpression("this;", "new.target;", false);

assertExpression(
  "intrinsic.ReferenceError;",
  "intrinsic.ReferenceError;",
  true,
);

assertExpression("intrinsic.ReferenceError;", "intrinsic.SyntaxError;", false);

assertExpression("123;", "123;", true);
assertExpression("123;", "321;", false);

assertExpression("123n;", "123n;", true);
assertExpression("123n;", "321n;", false);

assertExpression("x;", "X;", true);

assertExpression("_x;", "_x;", true);
assertExpression("_x;", "_X;", false);

assertExpression("typeof _x;", "typeof _x;", true);
assertExpression("typeof _x;", "typeof _X;", false);

assertExpression(
  "importStatic('source', 'specifier');",
  "importStatic('source', 'specifier');",
  true,
);

assertExpression(
  "importStatic('source', 'specifier');",
  "importStatic('SOURCE', 'specifier');",
  false,
);

assertExpression(
  "importStatic('source', 'specifier');",
  "importStatic('source', 'SPECIFIER');",
  false,
);

assertExpression("await 123;", "await 123;", true);
assertExpression("await 123;", "await 321;", false);

assertExpression("yield 123;", "yield 123;", true);
assertExpression("yield* 123;", "yield* 123;", true);
assertExpression("yield 123;", "yield* 123;", false);
assertExpression("yield* 123;", "yield 123;", false);
assertExpression("yield 123;", "yield 321;", false);

assertExpression("(effect(123), 456);", "(effect(123), 456);", true);
assertExpression("(effect(123), 456);", "(effect(321), 456);", false);
assertExpression("(effect(123), 456);", "(effect(123), 654);", false);

assertExpression("123 ? 456 : 789;", "123 ? 456 : 789;", true);
assertExpression("123 ? 456 : 789;", "321 ? 456 : 789;", false);
assertExpression("123 ? 456 : 789;", "123 ? 654 : 789;", false);
assertExpression("123 ? 456 : 789;", "123 ? 456 : 987;", false);

assertExpression("123(!456, 789);", "123(!456, 789);", true);
assertExpression("123(!456, 789);", "321(!456, 789);", false);
assertExpression("123(!456, 789);", "123(!654, 789);", false);
assertExpression("123(!456, 789);", "123(!456, 987);", false);

// assertExpression("123[456](789);", "123[456](789);", true);
// assertExpression("123[456](789);", "321[456](789);", false);
// assertExpression("123[456](789);", "123[654](789);", false);
// assertExpression("123[456](789);", "123[456](987);", false);

assertExpression("new 123(456);", "new 123(456);", true);
assertExpression("new 123(456);", "new 321(456);", false);
assertExpression("new 123(456);", "new 123(654);", false);

assertExpression(
  "(function () { return 123; });",
  "(function () { return 123; });",
  true,
);

assertExpression(
  "(function () { return 123; });",
  "(function method () { return 123; });",
  false,
);

assertExpression(
  "(function () { return 123; });",
  "(async function () { return 123; });",
  false,
);

assertExpression(
  "(function () { return 123; });",
  "(function* () { return 123; });",
  false,
);

assertExpression(
  "(function () { return 123; });",
  "(function () { return 321; });",
  false,
);

assertExpression("eval([this], [x], 123);", "eval([this], [x], 123);", true);
assertExpression(
  "eval([this], [x], 123);",
  "eval([new.target], [x], 123);",
  false,
);
assertExpression("eval([this], [x], 123);", "eval([this], [x], 321);", false);
assertExpression("eval([this], [x], x);", "eval([this], [X], x);", false);

////////////
// Effect //
////////////

assertEffect("effect(123);", "effect(123);", true);
assertEffect("effect(123);", "effect(321);", false);

assertEffect(
  "exportStatic('specifier', 123);",
  "exportStatic('specifier', 123);",
  true,
);

assertEffect(
  "exportStatic('specifier', 123);",
  "exportStatic('SPECIFIER', 123);",
  false,
);

assertEffect(
  "exportStatic('specifier', 123);",
  "exportStatic('specifier', 321);",
  false,
);

assertEffect("x = 123;", "X = 123;", true);
assertEffect("x = 123;", "x = 321;", false);

assertEffect("_x = 123;", "_x = 123;", true);
assertEffect("_x = 123;", "_x = 321;", false);
assertEffect("_x = 123;", "_X = 123;", false);

assertEffect(
  "(effect(123), effect(456));",
  "(effect(123), effect(456));",
  true,
);

assertEffect(
  "(effect(123), effect(456));",
  "(effect(789), effect(456));",
  false,
);

assertEffect(
  "(effect(123), effect(456));",
  "(effect(123), effect(789));",
  false,
);

assertEffect(
  "123 ? effect(456) : effect(789);",
  "123 ? effect(456) : effect(789);",
  true,
);

assertEffect(
  "123 ? effect(456) : effect(789);",
  "321 ? effect(456) : effect(789);",
  false,
);

assertEffect(
  "123 ? effect(456) : effect(789);",
  "123 ? effect(654) : effect(789);",
  false,
);

assertEffect(
  "123 ? effect(456) : effect(789);",
  "123 ? effect(456) : effect(987);",
  false,
);

///////////////
// Statement //
///////////////

assertStatement("debugger;", "debugger;", true);

assertStatement("effect(123);", "effect(123);", true);
assertStatement("effect(123);", "effect(321);", false);

assertStatement("break l;", "break L;", true);

assertStatement("return 123;", "return 123;", true);
assertStatement("return 123;", "return 321;", false);

assertStatement("let _x = 123;", "let _x = 123;", true);
assertStatement("let _x = 123;", "const _x = 123;", false);
assertStatement("let _x = 123;", "let _y = 123;", false);
assertStatement("let _x = 123;", "let _x = 321;", false);

assertStatement("{ effect(123); }", "{ effect(123); }", true);
assertStatement("{ effect(123); }", "{ effect(321); }", false);

assertStatement(
  "if (123) { effect(456); } else { effect(789); }",
  "if (123) { effect(456); } else { effect(789); }",
  true,
);

assertStatement(
  "if (123) { effect(456); } else { effect(789); }",
  "if (321) { effect(456); } else { effect(789); }",
  false,
);

assertStatement(
  "if (123) { effect(456); } else { effect(789); }",
  "if (123) { effect(654); } else { effect(789); }",
  false,
);

assertStatement(
  "if (123) { effect(456); } else { effect(789); }",
  "if (123) { effect(456); } else { effect(987); }",
  false,
);

assertStatement(
  "while (123) { effect(456); }",
  "while (123) { effect(456); }",
  true,
);

assertStatement(
  "while (123) { effect(456); }",
  "while (321) { effect(456); }",
  false,
);

assertStatement(
  "while (123) { effect(456); }",
  "while (123) { effect(654); }",
  false,
);

assertStatement(
  "try { effect(123); } catch { effect(456); } finally { effect(789); }",
  "try { effect(123); } catch { effect(456); } finally { effect(789); }",
  true,
);

assertStatement(
  "try { effect(123); } catch { effect(456); } finally { effect(789); }",
  "try { effect(321); } catch { effect(456); } finally { effect(789); }",
  false,
);

assertStatement(
  "try { effect(123); } catch { effect(456); } finally { effect(789); }",
  "try { effect(123); } catch { effect(654); } finally { effect(789); }",
  false,
);

assertStatement(
  "try { effect(123); } catch { effect(456); } finally { effect(789); }",
  "try { effect(123); } catch { effect(456); } finally { effect(987); }",
  false,
);

//////////
// Link //
//////////

assertLink("export {specifier};", "export {specifier};", true);
assertLink("export {specifier};", "export {SPECIFIER};", false);

assertLink(
  "import {specifier} from 'source';",
  "import {specifier} from 'source';",
  true,
);

assertLink(
  "import {specifier} from 'source';",
  "import {SPECIFIER} from 'source';",
  false,
);

assertLink(
  "import {specifier} from 'source';",
  "import {specifier} from 'SOURCE';",
  false,
);

assertLink(
  "export {specifier1 as specifier2} from 'source';",
  "export {specifier1 as specifier2} from 'source';",
  true,
);

assertLink(
  "export {specifier1 as specifier2} from 'source';",
  "export {SPECIFIER1 as specifier2} from 'source';",
  false,
);

assertLink(
  "export {specifier1 as specifier2} from 'source';",
  "export {specifier1 as SPECIFIER2} from 'source';",
  false,
);

assertLink(
  "export {specifier1 as specifier2} from 'source';",
  "export {specifier1 as specifier2} from 'SOURCE';",
  false,
);

///////////
// Block //
///////////

assertBlock("l: { break l; }", "L: { break L; }", true);
assertBlock("l: { break l; }", "L: { break l; }", false);
assertBlock(
  "{ l: { break l; } l: { break l; } }",
  "{ l: { break l; } L: { break L; } }",
  true,
);

assertBlock("{ let x; x = x; }", "{ let y; y = y; }", true);
assertBlock("{ let x; x = x; }", "{ let x; y = y; }", false);
assertBlock(
  "{ let x; x = x; { let x; x = x } }",
  "{ let x; x = x; { let X; X = X } }",
  true,
);

/////////////
// Program //
/////////////

assertProgram("'script'; return 123;", "'script'; return 123;", true);
assertProgram("'script'; return 123;", "'script'; return 321;", false);

assertProgram(
  "'module'; export {specifier}; { return 123; }",
  "'module'; export {specifier}; { return 123; }",
  true,
);

assertProgram(
  "'module'; export {specifier}; { return 123; }",
  "'module'; export {SPECIFIER}; { return 123; }",
  false,
);

assertProgram(
  "'module'; export {specifier}; { return 123; }",
  "'module'; export {specifier}; { return 321; }",
  false,
);

assertProgram(
  "'eval'; [this]; let x; { return 123; }",
  "'eval'; [this]; let x; { return 123; }",
  true,
);

assertProgram(
  "'eval'; [this]; let x; { return 123; }",
  "'eval'; [this]; let x; { return 321; }",
  false,
);

assertProgram(
  "'eval'; [this]; let x; { return 123; }",
  "'eval'; [new.target]; let x; { return 123; }",
  false,
);

assertProgram(
  "'eval'; [this]; let x; { return x; }",
  "'eval'; [this]; let x; { return X; }",
  false,
);
