import { assertEqual } from "../../fixture.mjs";
import { parseModule } from "../../fixture-parse.mjs";
import { hoistImport } from "../../../lib/estree/import.mjs";

/** @type {(code: string, mapping: Record<string, {source: string, specifier: string | null}>) => void}  */
const test = (code, mapping) =>
  assertEqual(hoistImport(parseModule(code).body), mapping);

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
