import {parse as parseAcorn} from "acorn";
import {assertDeepEqual} from "../../__fixture__.mjs";
import {makeVarDeclaration, makeFunctionDeclaration} from "./data.mjs";
import {hoistClosure} from "./hoist-closure.mjs";

const options = {
  ecmaVersion: 2021,
  sourceType: "script",
};

const parseExpression = (code) =>
  parseAcorn(`(${code});`, options).body[0].expression;

assertDeepEqual(hoistClosure(parseExpression("() => 123")), []);

/////////////////
// Declaration //
/////////////////

assertDeepEqual(
  hoistClosure(parseExpression("function () { var x; let y; }")),
  [makeVarDeclaration("x")],
);

assertDeepEqual(
  hoistClosure(parseExpression("function () { function f () {} }")),
  [makeFunctionDeclaration("f")],
);

/////////
// For //
/////////

assertDeepEqual(
  hoistClosure(parseExpression("function () { for (;;) { var x; } }")),
  [makeVarDeclaration("x")],
);

assertDeepEqual(
  hoistClosure(parseExpression("function () { for (var x;;) { var y; } }")),
  [makeVarDeclaration("x"), makeVarDeclaration("y")],
);

//////////
// Body //
//////////

assertDeepEqual(
  hoistClosure(parseExpression("function () { while (123) { var x; } }")),
  [makeVarDeclaration("x")],
);

////////////
// Switch //
////////////

assertDeepEqual(
  hoistClosure(
    parseExpression("function () { switch (123) { case 456: var x; } }"),
  ),
  [makeVarDeclaration("x")],
);

////////
// If //
////////

assertDeepEqual(
  hoistClosure(
    parseExpression("function () { if (123) { var x; } else { var y; } }"),
  ),
  [makeVarDeclaration("x"), makeVarDeclaration("y")],
);

assertDeepEqual(
  hoistClosure(parseExpression("function () { if (123) { var x; } }")),
  [makeVarDeclaration("x")],
);

/////////
// Try //
/////////

assertDeepEqual(
  hoistClosure(
    parseExpression("function () { try { var x; } catch { var y; } }"),
  ),
  [makeVarDeclaration("x"), makeVarDeclaration("y")],
);

assertDeepEqual(
  hoistClosure(
    parseExpression("function () { try { var x; } finally { var y; } }"),
  ),
  [makeVarDeclaration("x"), makeVarDeclaration("y")],
);

///////////
// Empty //
///////////

assertDeepEqual(hoistClosure(parseExpression("function () { debugger; }")), []);
