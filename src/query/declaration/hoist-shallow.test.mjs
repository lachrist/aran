import {parse as parseAcorn} from "acorn";
import {assertDeepEqual} from "../../__fixture__.mjs";
import {
  makeClassDeclaration,
  makeLetDeclaration,
  makeConstDeclaration,
} from "./data.mjs";
import {hoistBlock} from "./hoist-block.mjs";

const options = {
  ecmaVersion: 2021,
  sourceType: "script",
};

const parseStatement = (code) => parseAcorn(code, options).body[0];

assertDeepEqual(
  hoistBlock(
    parseStatement(
      "{ debugger; class c {} let x = 123; const y = 456; var z = 789; }",
    ),
  ),
  [
    makeClassDeclaration("c"),
    makeLetDeclaration("x"),
    makeConstDeclaration("y"),
  ],
);

assertDeepEqual(
  hoistBlock(parseStatement("switch (123) { case 456: let x = 789; }")),
  [makeLetDeclaration("x")],
);

assertDeepEqual(hoistBlock(parseStatement("let x = 123;")), []);
