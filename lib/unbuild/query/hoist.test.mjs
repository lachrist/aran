import { assertEqual, drill } from "../../test.fixture.mjs";

import { parseScript, parseModule } from "../../parse.fixture.mjs";

import { flatMap, listEntry } from "../../util/index.mjs";

import {
  listPatternVariable,
  listDeclaratorVariable,
  hoistClosure,
  hoistBlock,
} from "./hoist.mjs";

/////////////////////////
// listPatternVariable //
/////////////////////////

/** @type {(code: string, variables: string[]) => void} */
const testPattern = (code, variables) => {
  assertEqual(
    listPatternVariable(
      /** @type {estree.Pattern} */ (
        drill(parseScript(`([${code}] = 123);`), [
          "body",
          0,
          "expression",
          "left",
          "elements",
          0,
        ])
      ),
    ),
    variables,
  );
};

testPattern("foo = 123", ["foo"]);

testPattern("[foo,, bar, ...qux]", ["foo", "bar", "qux"]);

testPattern("{ foo, [123]: bar, ...qux }", ["foo", "bar", "qux"]);

testPattern("foo.bar", []);

////////////////////////////
// listDeclaratorVariable //
////////////////////////////

assertEqual(
  listDeclaratorVariable(
    /** @type {estree.VariableDeclarator} */ (
      drill(parseScript("var foo = 123;"), ["body", 0, "declarations", 0])
    ),
  ),
  ["foo"],
);

//////////////////
// hoistClosure //
//////////////////

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   program: estree.Program,
 *   record: Record<string, "var">,
 * ) => void}
 */
const testClosure = (mode, program, record) => {
  assertEqual(
    flatMap(program.body, (node) => hoistClosure(mode, node)),
    listEntry(record),
  );
};

testClosure("sloppy", parseScript("function f () {}"), { f: "var" });

testClosure("strict", parseModule("export var foo;"), { foo: "var" });

testClosure("strict", parseModule("export { foo } from 'source';"), {});

testClosure("strict", parseModule("export default function () {};"), {});

testClosure("strict", parseModule("export default class {};"), {});

testClosure("strict", parseScript("123;"), {});

testClosure("strict", parseScript("var foo;"), { foo: "var" });

testClosure("strict", parseScript("let foo;"), {});

testClosure("strict", parseScript("foo: { var bar; }"), { bar: "var" });

testClosure("strict", parseScript("if (123) { var foo; }"), { foo: "var" });

testClosure("strict", parseScript("if (123) { var foo; } else { var bar; }"), {
  foo: "var",
  bar: "var",
});

testClosure("strict", parseScript("try { var foo; } catch { var bar; }"), {
  foo: "var",
  bar: "var",
});

testClosure("strict", parseScript("try { var foo; } finally { var bar; }"), {
  foo: "var",
  bar: "var",
});

testClosure("strict", parseScript("while (123) { var foo; }"), { foo: "var" });

testClosure("strict", parseScript("do { var foo; } while (123);"), {
  foo: "var",
});

testClosure("strict", parseScript("with (123) { var foo; }"), { foo: "var" });

testClosure("strict", parseScript("try { var foo } catch { var bar }"), {
  foo: "var",
  bar: "var",
});

testClosure("strict", parseScript("for (var foo; 123; 456) { var bar; }"), {
  foo: "var",
  bar: "var",
});

testClosure("strict", parseScript("for (;;) { var foo; }"), { foo: "var" });

testClosure("strict", parseScript("for (var foo in 123) { var bar; }"), {
  foo: "var",
  bar: "var",
});

testClosure("strict", parseScript("for (var foo of 123) { var bar; }"), {
  foo: "var",
  bar: "var",
});

testClosure(
  "strict",
  parseScript(`
    switch (123) {
      case 456: var foo;
      case 789: var bar;
      default: var qux;
    }
  `),
  { foo: "var", bar: "var", qux: "var" },
);

////////////////
// hoistBlock //
////////////////

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   program: estree.Node[],
 *   record: Record<string, "let" | "const">,
 * ) => void}
 */
const testBlock = (mode, nodes, record) => {
  assertEqual(
    flatMap(nodes, (node) => hoistBlock(mode, node)),
    listEntry(record),
  );
};

testBlock("strict", parseScript("class c {}").body, {
  c: "let",
});

testBlock("strict", parseScript("const c = 123;").body, {
  c: "const",
});

testBlock("strict", parseModule("export { foo } from 'source';").body, {});

testBlock("strict", parseModule("export let foo;").body, {
  foo: "let",
});

testBlock("strict", parseModule("export default class {};").body, {});

testBlock("strict", parseScript("123;").body, {});

testBlock("strict", parseScript("var foo;").body, {});

testBlock("strict", parseScript("let foo;").body, { foo: "let" });

testBlock(
  "strict",
  /** @type {estree.Node[]} */ (
    drill(
      parseScript(`
          switch (123) {
            case 456: let foo;
            case 789: let bar;
            default: let qux;
          }
        `),
      ["body", 0, "cases"],
    )
  ),
  { foo: "let", bar: "let", qux: "let" },
);
