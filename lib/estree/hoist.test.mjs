import { assertEqual, drill } from "../test.fixture.mjs";

import { parseScript, parseModule } from "../parse.fixture.mjs";

import { map } from "../util/index.mjs";

import {
  listPatternVariable,
  listDeclaratorVariable,
  hoistClosure,
  hoistBlock,
} from "./hoist.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

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

assertEqual(hoistClosure(parseScript("function f () {}").body), {
  f: "function",
});

assertEqual(hoistClosure(parseModule("export var foo;").body), { foo: "var" });

assertEqual(
  hoistClosure(parseModule("export { foo } from 'source';").body),
  {},
);

assertEqual(
  hoistClosure(parseModule("export default function () {};").body),
  {},
);

assertEqual(hoistClosure(parseModule("export default class {};").body), {});

/** @type {(code: string, variables: string[]) => void} */
const testClosure = (code, variables) => {
  assertEqual(
    hoistClosure(parseScript(code).body),
    reduceEntry(map(variables, (variable) => [variable, "var"])),
  );
};

testClosure("123;", []);

testClosure("var foo;", ["foo"]);

testClosure("let foo;", []);

testClosure("foo: { var bar; }", ["bar"]);

testClosure("if (123) { var foo; }", ["foo"]);

testClosure("if (123) { var foo; } else { var bar; }", ["foo", "bar"]);

testClosure("try { var foo; } catch { var bar; }", ["foo", "bar"]);

testClosure("try { var foo; } finally { var bar; }", ["foo", "bar"]);

testClosure("while (123) { var foo; }", ["foo"]);

testClosure("do { var foo; } while (123);", ["foo"]);

testClosure("with (123) { var foo; }", ["foo"]);

testClosure("try { var foo } catch { var bar }", ["foo", "bar"]);

testClosure("for (var foo; 123; 456) { var bar; }", ["foo", "bar"]);

testClosure("for (;;) { var foo; }", ["foo"]);

testClosure("for (var foo in 123) { var bar; }", ["foo", "bar"]);

testClosure("for (var foo of 123) { var bar; }", ["foo", "bar"]);

testClosure(
  `
    switch (123) {
      case 456: var foo;
      case 789: var bar;
      default: var qux;
    }
  `,
  ["foo", "bar", "qux"],
);

////////////////
// hoistBlock //
////////////////

assertEqual(hoistBlock(parseScript("class c {}").body), {
  c: "class",
});

assertEqual(hoistBlock(parseScript("const c = 123;").body), {
  c: "const",
});

assertEqual(hoistBlock(parseModule("export { foo } from 'source';").body), {});

assertEqual(hoistBlock(parseModule("export let foo;").body), { foo: "let" });

assertEqual(hoistBlock(parseModule("export default class {};").body), {});

assertEqual(hoistBlock(parseScript("123;").body), {});

assertEqual(hoistBlock(parseScript("var foo;").body), {});

assertEqual(hoistBlock(parseScript("let foo;").body), { foo: "let" });

assertEqual(
  hoistBlock(
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
  ),
  { foo: "let", bar: "let", qux: "let" },
);
