import { assertEqual } from "../../test.fixture.mjs";
import { parse } from "acorn";
import { annotateCompletion } from "./completion.mjs";
import { digestPath, prepareDigestPath } from "../../path.mjs";

/** @type {import("acorn").Options} */
const options = {
  ecmaVersion: 2023,
  sourceType: "script",
};

/**
 * @type {(
 *   code: string,
 *   record: {[key in string]: null | undefined},
 * ) => void}
 */
const test = (code, record) => {
  const root = prepareDigestPath(
    /** @type {import("../../estree").Program} */ (parse(code, options)),
    /** @type {import("../../path").Path} */ ("$"),
  );
  assertEqual(annotateCompletion(root, digestPath), record);
};

test("123;", { "$.body.0": null });

test("123; 456;", { "$.body.1": null });

test("label: { 123; }", { "$.body.0.body.body.0": null });

test("123; debugger;", { "$.body.0": null });

test("123; debugger; 456;", { "$.body.2": null });

test("123; label: { debugger; }", { "$.body.0": null });

test("123; label: { debugger; } 456;", { "$.body.2": null });

test("while (test) { 123; }", { "$.body.0.body.body.0": null });

test("while (test) { 123; 456; }", { "$.body.0.body.body.1": null });

test("while (test) { 123; break; 456; }", {
  "$.body.0.body.body.0": null,
  "$.body.0.body.body.2": null,
});

test("while (test) { 123; label: { break; } 456; }", {
  "$.body.0.body.body.0": null,
  "$.body.0.body.body.2": null,
});

test("while (test) { 123; label: { break label; } 456; }", {
  "$.body.0.body.body.2": null,
});

test(
  `
    switch (descriminant) {
      case match1:
        123;
    }
  `,
  { "$.body.0.cases.0.consequent.0": null },
);

test(
  `
    switch (descriminant) {
      case match1:
        123;
      case match2:
        456;
    }
  `,
  {
    "$.body.0.cases.0.consequent.0": null,
    "$.body.0.cases.1.consequent.0": null,
  },
);

test(
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
  {
    "$.body.0.cases.0.consequent.0": null,
    "$.body.0.cases.2.consequent.0": null,
  },
);
