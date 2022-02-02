import {parse as parseAcorn} from "acorn";

import {assertDeepEqual} from "../../__fixture__.mjs";

import {collectDeclarator} from "./collect.mjs";

const options = {
  sourceType: "script",
  ecmaVersion: 2021,
};

const parse = (code) => parseAcorn(code, options).body[0].declarations[0];

assertDeepEqual(
  collectDeclarator(parse("const [x1, x2 = 123, ... rest] = 456;")),
  ["x1", "x2", "rest"],
);

assertDeepEqual(collectDeclarator(parse("const {x1, x2:y, ... rest} = 456;")), [
  "x1",
  "y",
  "rest",
]);
