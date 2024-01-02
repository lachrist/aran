import { assertEqual } from "../../test.fixture.mjs";
import { parseModule } from "../../parse.fixture.mjs";
import { hoistImport } from "./import.mjs";
import { flatMap } from "../../util/index.mjs";

/** @type {(code: string, mapping: Record<string, {source: string, specifier: string | null}>) => void}  */
const test = (code, mapping) =>
  assertEqual(flatMap(parseModule(code).body, hoistImport), mapping);

test(`import { foo as bar, qux } from "source";`, {
  bar: { source: "source", specifier: "foo" },
  qux: { source: "source", specifier: "qux" },
});

test(`import * as foo from "source";`, {
  foo: { source: "source", specifier: null },
});

test(`import foo from "source";`, {
  foo: { source: "source", specifier: "default" },
});

test(`import { default as foo } from "source";`, {
  foo: { source: "source", specifier: "default" },
});

test(`123;`, {});
