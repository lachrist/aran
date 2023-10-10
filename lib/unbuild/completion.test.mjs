import { assertEqual } from "../test.fixture.mjs";
import { parse } from "acorn";
import { isLastValue } from "./completion.mjs";

/** @type {import("acorn").Options} */
const options = {
  ecmaVersion: 2023,
  sourceType: "script",
};

/**
 * @type {(
 *   path: string,
 *   code: string,
 *   last: boolean,
 * ) => void}
 */
const test = (path, code, last) => {
  assertEqual(
    isLastValue(
      /** @type {unbuild.Path} */ (path),
      /** @type {estree.Program} */ (
        /** @type {estree.Node} */ (parse(code, options))
      ),
    ),
    last,
  );
};

test("$.body.0", "123;", true);

test("$.body.0", "123; 456;", false);

test("$.body.0", "123; debugger;", true);

test("$.body.0", "123; debugger; 456;", false);

test("$.body.0", "123; label: { debugger; }", true);

test("$.body.0", "123; label: { debugger; } 456;", false);

test("$.body.0.body.body.0", "while (test) { 123; }", true);

test("$.body.0.body.body.0", "while (test) { 123; 456; }", false);

test("$.body.0.body.body.0", "while (test) { 123; break; 456; }", true);

test(
  "$.body.0.body.body.0",
  "while (test) { 123; label: { break; } 456; }",
  true,
);

test(
  "$.body.0.cases.0.consequent.0",
  `
    switch (descriminant) {
      case match1:
        123;
    }
  `,
  true,
);

test(
  "$.body.0.cases.0.consequent.0",
  `
    switch (descriminant) {
      case match1:
        123;
      case match2:
        456;
    }
  `,
  false,
);

test(
  "$.body.0.cases.0.consequent.0",
  `
    switch (descriminant) {
      case match1:
        123;
      case match2:
        break;
      case match3:
        456;
    }
  `,
  true,
);
