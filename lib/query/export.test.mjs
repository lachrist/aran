import { assertEqual } from "../fixture.mjs";
import { parseModule } from "../fixture-parse.mjs";
import { hoistExport } from "./export.mjs";

/** @type {(code: string, mapping: Record<Variable, Specifier[]>) => void}  */
const test = (code, mapping) =>
  assertEqual(hoistExport(parseModule(code).body), mapping);

test(
  `
    const foo = 123;
    export { foo as bar, foo as qux };
  `,
  {
    foo: ["bar", "qux"],
  },
);

test("export { foo } from 'source';", {});

test("export const foo = 123;", { foo: ["foo"] });

test("export function foo () {};", { foo: ["foo"] });

test("export default function () {};", {});

test("export default class {};", {});

test("export class foo {};", { foo: ["foo"] });
