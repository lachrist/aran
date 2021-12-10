import {assertMatch, assertEqual} from "../../__fixture__.mjs";
import {
  parseExpression,
  parseEffect,
  parseBlock,
  parseStatement,
  parseLink,
  parseProgram,
} from "../format/index.mjs";
import {
  allignExpression,
  allignEffect,
  allignBlock,
  allignStatement,
  allignLink,
  allignProgram,
} from "./index.mjs";

const generateAssert = (parse, allign) => (code1, code2, pattern) => {
  const result = allign(parse(code1), parse(code2));
  if (pattern === null) {
    assertEqual(result, pattern);
  } else {
    assertMatch(result, pattern);
  }
};

const assertExpression = generateAssert(parseExpression, allignExpression);
const assertEffect = generateAssert(parseEffect, allignEffect);
const assertLink = generateAssert(parseLink, allignLink);
const assertBlock = generateAssert(parseBlock, allignBlock);
const assertStatement = generateAssert(parseStatement, allignStatement);
const assertProgram = generateAssert(parseProgram, allignProgram);

assertExpression("123;", "input;", /^/u);

////////////////
// Expression //
////////////////

assertExpression("input;", "input;", null);

assertExpression(
  "intrinsic('ReferenceError');",
  "intrinsic('ReferenceError')",
  null,
);
assertExpression(
  "intrinsic('ReferenceError');",
  "intrinsic('SyntaxError')",
  /^/u,
);

assertExpression("123;", "123;", null);
assertExpression("123;", "321;", /^/u);

assertExpression("_x;", "_X;", null);

assertExpression("$x;", "$x;", null);
assertExpression("$x;", "$X;", /^/u);

assertExpression("typeof $x;", "typeof $x;", null);
assertExpression("typeof $x;", "typeof $X;", /^/u);

assertExpression(
  "importStatic('source', 'specifier');",
  "importStatic('source', 'specifier');",
  null,
);
assertExpression(
  "importStatic('source', 'specifier');",
  "importStatic('SOURCE', 'specifier');",
  /^/u,
);
assertExpression(
  "importStatic('source', 'specifier');",
  "importStatic('source', 'SPECIFIER');",
  /^/u,
);

assertExpression("await 123;", "await 123;", null);
assertExpression("await 123;", "await 321;", /^/u);

assertExpression("yieldStraight(123);", "yieldStraight(123);", null);
assertExpression("yieldDelegate(123);", "yieldDelegate(123);", null);
assertExpression("yieldStraight(123);", "yieldDelegate(123);", /^/u);
assertExpression("yieldStraight(123);", "yieldStraight(321);", /^/u);
assertExpression("yieldDelegate(123);", "yieldDelegate(321);", /^/u);

assertExpression("throwError(123);", "throwError(123);", null);
assertExpression("throwError(123);", "throwError(321);", /^/u);

assertExpression("(effect(123), 456);", "(effect(123), 456);", null);
assertExpression("(effect(123), 456);", "(effect(321), 456);", /^/u);
assertExpression("(effect(123), 456);", "(effect(123), 654);", /^/u);

assertExpression("123 ? 456 : 789;", "123 ? 456 : 789;", null);
assertExpression("123 ? 456 : 789;", "321 ? 456 : 789;", /^/u);
assertExpression("123 ? 456 : 789;", "123 ? 654 : 789;", /^/u);
assertExpression("123 ? 456 : 789;", "123 ? 456 : 987;", /^/u);

assertExpression("$super[123];", "$super[123];", null);
assertExpression("$super[123];", "$super[321];", /^/u);

assertExpression("$super(...123);", "$super(...123);", null);
assertExpression("$super(...123);", "$super(...321);", /^/u);

assertExpression("import(123);", "import(123);", null);
assertExpression("import(123);", "import(321);", /^/u);

assertExpression("123(456, 789);", "123(456, 789);", null);
assertExpression("123(456, 789);", "321(456, 789);", /^/u);
assertExpression("123(456, 789);", "123(654, 789);", /^/u);
assertExpression("123(456, 789);", "123(456, 987);", /^/u);

assertExpression("new 123(456);", "new 123(456);", null);
assertExpression("new 123(456);", "new 321(456);", /^/u);
assertExpression("new 123(456);", "new 123(654);", /^/u);

assertExpression("!123;", "!123;", null);
assertExpression("!123;", "!456;", /^/u);

assertExpression("123 + 456;", "123 + 456;", null);
assertExpression("123 + 456;", "321 + 456;", /^/u);
assertExpression("123 + 456;", "123 + 654;", /^/u);

assertExpression(
  "({__proto__:123, [456]:789});",
  "({__proto__:123, [456]:789});",
  null,
);
assertExpression(
  "({__proto__:123, [456]:789});",
  "({__proto__:321, [456]:789});",
  /^/u,
);
assertExpression(
  "({__proto__:123, [456]:789});",
  "({__proto__:123, [654]:789});",
  /^/u,
);
assertExpression(
  "({__proto__:123, [456]:789});",
  "({__proto__:123, [456]:987});",
  /^/u,
);

assertExpression(
  "(function () { return 123; });",
  "(function () { return 123; });",
  null,
);
assertExpression(
  "(function () { return 123; });",
  "(function method () { return 123; });",
  /^/u,
);
assertExpression(
  "(function () { return 123; });",
  "(async function () { return 123; });",
  /^/u,
);
assertExpression(
  "(function () { return 123; });",
  "(function* () { return 123; });",
  /^/u,
);
assertExpression(
  "(function () { return 123; });",
  "(function () { return 321; });",
  /^/u,
);

assertExpression(
  "eval([$this], [_x], 123);",
  "eval([$this], [_x], 123);",
  null,
);
assertExpression(
  "eval([$this], [_x], 123);",
  "eval([$this], [_x], 321);",
  /^/u,
);
assertExpression(
  "eval([$this], [_x], 123);",
  "eval([$new.target], [_x], 123);",
  /^/u,
);
assertExpression("eval([$this], [_x], _x);", "eval([$this], [_X], _x);", /^/u);

////////////
// Effect //
////////////

assertEffect("effect(123);", "effect(123);", null);
assertEffect("effect(123);", "effect(321);", /^/u);

assertEffect("$super[123] = 456;", "$super[123] = 456;", null);
assertEffect("$super[123] = 456;", "$super[321] = 456;", /^/u);
assertEffect("$super[123] = 456;", "$super[123] = 654;", /^/u);

assertEffect(
  "exportStatic('specifier', 123);",
  "exportStatic('specifier', 123);",
  null,
);
assertEffect(
  "exportStatic('specifier', 123);",
  "exportStatic('SPECIFIER', 123);",
  /^/u,
);
assertEffect(
  "exportStatic('specifier', 123);",
  "exportStatic('specifier', 321);",
  /^/u,
);

assertEffect("_x = 123;", "_X = 123;", null);
assertEffect("_x = 123;", "_x = 321;", /^/u);

assertEffect("$x = 123;", "$x = 123;", null);
assertEffect("$x = 123;", "$y = 123;", /^/u);
assertEffect("$x = 123;", "$x = 321;", /^/u);

assertEffect(
  "(effect(123), effect(456));",
  "(effect(123), effect(456));",
  null,
);
assertEffect(
  "(effect(123), effect(456));",
  "(effect(789), effect(456));",
  /^/u,
);
assertEffect(
  "(effect(123), effect(456));",
  "(effect(123), effect(789));",
  /^/u,
);

assertEffect(
  "123 ? effect(456) : effect(789);",
  "123 ? effect(456) : effect(789);",
  null,
);
assertEffect(
  "123 ? effect(456) : effect(789);",
  "321 ? effect(456) : effect(789);",
  /^/u,
);
assertEffect(
  "123 ? effect(456) : effect(789);",
  "123 ? effect(654) : effect(789);",
  /^/u,
);
assertEffect(
  "123 ? effect(456) : effect(789);",
  "123 ? effect(456) : effect(987);",
  /^/u,
);

///////////////
// Statement //
///////////////

assertStatement("debugger;", "debugger;", null);

assertStatement("effect(123);", "effect(123);", null);
assertStatement("effect(123);", "effect(321);", /^/u);

assertStatement("break l;", "break L;", null);

assertStatement("return 123;", "return 123;", null);
assertStatement("return 123;", "return 321;", /^/u);

assertStatement("let $x = 123;", "let $x = 123;", null);
assertStatement("let $x = 123;", "const $x = 123;", /^/u);
assertStatement("let $x = 123;", "let $y = 123;", /^/u);
assertStatement("let $x = 123;", "let $x = 321;", /^/u);

assertStatement("{ effect(123); }", "{ effect(123); }", null);
assertStatement("{ effect(123); }", "{ effect(321); }", /^/u);

assertStatement(
  "if (123) { effect(456); } else { effect(789); }",
  "if (123) { effect(456); } else { effect(789); }",
  null,
);
assertStatement(
  "if (123) { effect(456); } else { effect(789); }",
  "if (321) { effect(456); } else { effect(789); }",
  /^/u,
);
assertStatement(
  "if (123) { effect(456); } else { effect(789); }",
  "if (123) { effect(654); } else { effect(789); }",
  /^/u,
);
assertStatement(
  "if (123) { effect(456); } else { effect(789); }",
  "if (123) { effect(456); } else { effect(987); }",
  /^/u,
);

assertStatement(
  "while (123) { effect(456); }",
  "while (123) { effect(456); }",
  null,
);
assertStatement(
  "while (123) { effect(456); }",
  "while (321) { effect(456); }",
  /^/u,
);
assertStatement(
  "while (123) { effect(456); }",
  "while (123) { effect(654); }",
  /^/u,
);

assertStatement(
  "try { effect(123); } catch { effect(456); } finally { effect(789); }",
  "try { effect(123); } catch { effect(456); } finally { effect(789); }",
  null,
);
assertStatement(
  "try { effect(123); } catch { effect(456); } finally { effect(789); }",
  "try { effect(321); } catch { effect(456); } finally { effect(789); }",
  /^/u,
);
assertStatement(
  "try { effect(123); } catch { effect(456); } finally { effect(789); }",
  "try { effect(123); } catch { effect(654); } finally { effect(789); }",
  /^/u,
);
assertStatement(
  "try { effect(123); } catch { effect(456); } finally { effect(789); }",
  "try { effect(123); } catch { effect(456); } finally { effect(987); }",
  /^/u,
);

//////////
// Link //
//////////

assertLink("export {specifier};", "export {specifier};", null);
assertLink("export {specifier};", "export {SPECIFIER};", /^/u);

assertLink(
  "import {specifier} from 'source';",
  "import {specifier} from 'source';",
  null,
);
assertLink(
  "import {specifier} from 'source';",
  "import {SPECIFIER} from 'source';",
  /^/u,
);
assertLink(
  "import {specifier} from 'source';",
  "import {specifier} from 'SOURCE';",
  /^/u,
);

assertLink(
  "export {specifier1 as specifier2} from 'source';",
  "export {specifier1 as specifier2} from 'source';",
  null,
);
assertLink(
  "export {specifier1 as specifier2} from 'source';",
  "export {SPECIFIER1 as specifier2} from 'source';",
  /^/u,
);
assertLink(
  "export {specifier1 as specifier2} from 'source';",
  "export {specifier1 as SPECIFIER2} from 'source';",
  /^/u,
);
assertLink(
  "export {specifier1 as specifier2} from 'source';",
  "export {specifier1 as specifier2} from 'SOURCE';",
  /^/u,
);

///////////
// Block //
///////////

assertBlock("l: { break l; }", "L: { break L; }", null);
assertBlock("l: { break l; }", "L: { break l; }", /^/u);
assertBlock(
  "{ l: { break l; } l: { break l; } }",
  "{ l: { break l; } L: { break L; } }",
  null,
);

assertBlock("{ let _x; _x = _x; }", "{ let _y; _y = _y; }", null);
assertBlock("{ let _x; _x = _x; }", "{ let _x; _y = _y; }", /^/u);
assertBlock(
  "{ let _x; _x = _x; { let _x; _x = _x } }",
  "{ let _x; _x = _x; { let _X; _X = _X } }",
  null,
);

/////////////
// Program //
/////////////

assertProgram("'script'; return 123;", "'script'; return 123;", null);
assertProgram("'script'; return 123;", "'script'; return 321;", /^/u);

assertProgram(
  "'module'; export {specifier}; { effect(123); }",
  "'module'; export {specifier}; { effect(123); }",
  null,
);
assertProgram(
  "'module'; export {specifier}; { effect(123); }",
  "'module'; export {SPECIFIER}; { effect(123); }",
  /^/u,
);
assertProgram(
  "'module'; export {specifier}; { effect(123); }",
  "'module'; export {specifier}; { effect(321); }",
  /^/u,
);

assertProgram(
  "'eval'; [$this]; let _x; { return 123; }",
  "'eval'; [$this]; let _x; { return 123; }",
  null,
);
assertProgram(
  "'eval'; [$this]; let _x; { return 123; }",
  "'eval'; [$this]; let _x; { return 321; }",
  /^/u,
);
assertProgram(
  "'eval'; [$this]; let _x; { return 123; }",
  "'eval'; [$new.target]; let _x; { return 123; }",
  /^/u,
);
assertProgram(
  "'eval'; [$this]; let _x, _y; { return _x + _y; }",
  "'eval'; [$new.target]; let _x, _y; { return _y + _x; }",
  /^/u,
);
