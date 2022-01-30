import {parse as parseAcorn} from "acorn";
import {map, reduce} from "array-lite";
import {assertDeepEqual} from "../../__fixture__.mjs";
import {inferCompletionNodeArray} from "./index.mjs";

const {Set} = globalThis;

const parseScript = (code) =>
  parseAcorn(code, {
    ecmaVersion: 2021,
    sourceType: "script",
  });

const get = (object, key) => object[key];

const test = (code, ...paths) => {
  const program = parseScript(code);
  assertDeepEqual(
    new Set(inferCompletionNodeArray(program)),
    new Set(map(paths, (path) => reduce(path, get, program))),
  );
};

/////////////
// Program //
/////////////

test("123;", ["body", 0]);

test("123; debugger;", ["body", 0]);

///////////
// Label //
///////////

test(
  "123; label: { 456; break label; 789; }",
  ["body", 1, "body", "body", 0],
  ["body", 1, "body", "body", 2],
);

//////////
// Loop //
//////////

test("123; while (456) 789;", ["body", 1], ["body", 1, "body"]);

test(
  "while (123) { 456; break; 789; }",
  ["body", 0],
  ["body", 0, "body", "body", 0],
  ["body", 0, "body", "body", 2],
);

test(
  "label: { while (123) { break label; 456; } 789; }",
  ["body", 0, "body", "body", 0],
  ["body", 0, "body", "body", 1],
);

///////////////////
// WithStatement //
///////////////////

test("123; with (456) debugger;", ["body", 1]);

test("with (123) 456;", ["body", 0, "body"]);

/////////////////
// IfStatement //
/////////////////

test("123; if (456) 789;", ["body", 1], ["body", 1, "consequent"]);

test("if (123) 456; else debugger;", ["body", 0], ["body", 0, "consequent"]);

test(
  "if (123) 456; else 789;",
  ["body", 0, "consequent"],
  ["body", 0, "alternate"],
);

test(
  "label: { if (123) break label; else 456; 789; }",
  ["body", 0, "body", "body", 0],
  ["body", 0, "body", "body", 1],
);

test(
  "label: { if (123) 456; else break label; 789; }",
  ["body", 0, "body", "body", 0],
  ["body", 0, "body", "body", 1],
);

//////////////////
// TryStatement //
//////////////////

test(
  "123; try { 456; } catch { 789; }",
  ["body", 1, "block", "body", 0],
  ["body", 1, "handler", "body", "body", 0],
);

test(
  "try { 123; } finally { 456; }",
  ["body", 0],
  ["body", 0, "block", "body", 0],
);

test(
  "label: { try { break label; } catch { 123; } 456; }",
  ["body", 0, "body", "body", 0],
  ["body", 0, "body", "body", 1],
);

test(
  "label: { try { 123; } catch { break label; } 456; }",
  ["body", 0, "body", "body", 0],
  ["body", 0, "body", "body", 1],
);

////////////
// Switch //
////////////

test(
  `
    switch (1) {
      case 2:
        3;
        4;
      case 5:
        6;
        7;
      default:
        8;
        9;
    }
  `,
  ["body", 0],
  ["body", 0, "cases", 0, "consequent", 1],
  ["body", 0, "cases", 1, "consequent", 1],
  ["body", 0, "cases", 2, "consequent", 1],
);

test(
  `
    switch (1) {
      case 2:
        3;
        break;
        4;
    }
  `,
  ["body", 0],
  ["body", 0, "cases", 0, "consequent", 0],
  ["body", 0, "cases", 0, "consequent", 2],
);

test(
  `
    switch (1) {
      case 2:
        3;
      case 4:
        break;
    }
  `,
  ["body", 0],
  ["body", 0, "cases", 0, "consequent", 0],
);
