import { map, reduce } from "array-lite";
import { parseScript } from "../../__fixture__parser__.mjs";
import { assertDeepEqual } from "../../__fixture__.mjs";
import { inferCompletionNodeArray } from "./index.mjs";

const { Set } = globalThis;

const get = (object, key) => object[key];

const test = (code, ...paths) => {
  const program = parseScript(code);
  assertDeepEqual(
    new Set(inferCompletionNodeArray(program.body)),
    new Set(map(paths, (path) => reduce(path, get, program.body))),
  );
};

/////////////
// Program //
/////////////

test("123;", [0]);

test("123; debugger;", [0]);

///////////
// Label //
///////////

test(
  "123; label: { 456; break label; 789; }",
  [1, "body", "body", 0],
  [1, "body", "body", 2],
);

//////////
// Loop //
//////////

test("123; while (456) 789;", [1], [1, "body"]);

test(
  "while (123) { 456; break; 789; }",
  [0],
  [0, "body", "body", 0],
  [0, "body", "body", 2],
);

test(
  "label: { while (123) { break label; 456; } 789; }",
  [0, "body", "body", 0],
  [0, "body", "body", 1],
);

///////////////////
// WithStatement //
///////////////////

test("123; with (456) debugger;", [1]);

test("with (123) 456;", [0, "body"]);

/////////////////
// IfStatement //
/////////////////

test("123; if (456) 789;", [1], [1, "consequent"]);

test("if (123) 456; else debugger;", [0], [0, "consequent"]);

test("if (123) 456; else 789;", [0, "consequent"], [0, "alternate"]);

test(
  "label: { if (123) break label; else 456; 789; }",
  [0, "body", "body", 0],
  [0, "body", "body", 1],
);

test(
  "label: { if (123) 456; else break label; 789; }",
  [0, "body", "body", 0],
  [0, "body", "body", 1],
);

//////////////////
// TryStatement //
//////////////////

test(
  "123; try { 456; } catch { 789; }",
  [1, "block", "body", 0],
  [1, "handler", "body", "body", 0],
);

test("try { 123; } finally { 456; }", [0], [0, "block", "body", 0]);

test(
  "label: { try { break label; } catch { 123; } 456; }",
  [0, "body", "body", 0],
  [0, "body", "body", 1],
);

test(
  "label: { try { 123; } catch { break label; } 456; }",
  [0, "body", "body", 0],
  [0, "body", "body", 1],
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
  [0],
  [0, "cases", 0, "consequent", 1],
  [0, "cases", 1, "consequent", 1],
  [0, "cases", 2, "consequent", 1],
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
  [0],
  [0, "cases", 0, "consequent", 0],
  [0, "cases", 0, "consequent", 2],
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
  [0],
  [0, "cases", 0, "consequent", 0],
);
