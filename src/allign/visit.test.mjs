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

assertExpression("'source' >> specifier;", "'source' >> specifier;", true);

assertExpression("'source' >> specifier;", "'SOURCE' >> specifier;", false);

assertExpression("'source' >> specifier;", "'source' >> SPECIFIER;", false);

assertExpression("await 123;", "await 123;", true);
assertExpression("await 123;", "await 321;", false);

assertExpression("yield 123;", "yield 123;", true);
assertExpression("yield* 123;", "yield* 123;", true);
assertExpression("yield 123;", "yield* 123;", false);
assertExpression("yield* 123;", "yield 123;", false);
assertExpression("yield 123;", "yield 321;", false);

assertExpression("(void 123, 456);", "(void 123, 456);", true);
assertExpression("(void 123, 456);", "(void 321, 456);", false);
assertExpression("(void 123, 456);", "(void 123, 654);", false);

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

assertEffect("void 123;", "void 123;", true);
assertEffect("void 123;", "void 321;", false);

assertEffect("specifier << 123;", "specifier << 123;", true);

assertEffect("specifier << 123;", "SPECIFIER << 123;", false);

assertEffect("specifier << 123;", "specifier << 321;", false);

assertEffect("x = 123;", "X = 123;", true);
assertEffect("x = 123;", "x = 321;", false);

assertEffect("_x = 123;", "_x = 123;", true);
assertEffect("_x = 123;", "_x = 321;", false);
assertEffect("_x = 123;", "_X = 123;", false);

assertEffect("(void 123, void 456);", "(void 123, void 456);", true);

assertEffect("(void 123, void 456);", "(void 789, void 456);", false);

assertEffect("(void 123, void 456);", "(void 123, void 789);", false);

assertEffect("123 ? void 456 : void 789;", "123 ? void 456 : void 789;", true);

assertEffect("123 ? void 456 : void 789;", "321 ? void 456 : void 789;", false);

assertEffect("123 ? void 456 : void 789;", "123 ? void 654 : void 789;", false);

assertEffect("123 ? void 456 : void 789;", "123 ? void 456 : void 987;", false);

///////////////
// Statement //
///////////////

assertStatement("debugger;", "debugger;", true);

assertStatement("void 123;", "void 123;", true);
assertStatement("void 123;", "void 321;", false);

assertStatement("break l;", "break L;", true);

assertStatement("return 123;", "return 123;", true);
assertStatement("return 123;", "return 321;", false);

assertStatement("let _x = 123;", "let _x = 123;", true);
assertStatement("let _x = 123;", "const _x = 123;", false);
assertStatement("let _x = 123;", "let _y = 123;", false);
assertStatement("let _x = 123;", "let _x = 321;", false);

assertStatement("{ void 123; }", "{ void 123; }", true);
assertStatement("{ void 123; }", "{ void 321; }", false);

assertStatement(
  "if (123) { void 456; } else { void 789; }",
  "if (123) { void 456; } else { void 789; }",
  true,
);

assertStatement(
  "if (123) { void 456; } else { void 789; }",
  "if (321) { void 456; } else { void 789; }",
  false,
);

assertStatement(
  "if (123) { void 456; } else { void 789; }",
  "if (123) { void 654; } else { void 789; }",
  false,
);

assertStatement(
  "if (123) { void 456; } else { void 789; }",
  "if (123) { void 456; } else { void 987; }",
  false,
);

assertStatement("while (123) { void 456; }", "while (123) { void 456; }", true);

assertStatement(
  "while (123) { void 456; }",
  "while (321) { void 456; }",
  false,
);

assertStatement(
  "while (123) { void 456; }",
  "while (123) { void 654; }",
  false,
);

assertStatement(
  "try { void 123; } catch { void 456; } finally { void 789; }",
  "try { void 123; } catch { void 456; } finally { void 789; }",
  true,
);

assertStatement(
  "try { void 123; } catch { void 456; } finally { void 789; }",
  "try { void 321; } catch { void 456; } finally { void 789; }",
  false,
);

assertStatement(
  "try { void 123; } catch { void 456; } finally { void 789; }",
  "try { void 123; } catch { void 654; } finally { void 789; }",
  false,
);

assertStatement(
  "try { void 123; } catch { void 456; } finally { void 789; }",
  "try { void 123; } catch { void 456; } finally { void 987; }",
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
