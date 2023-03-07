import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import {
  Program,
  Statement,
  Effect,
  Expression,
  compileTest,
} from "./__fixture__.mjs";

const { undefined } = globalThis;

const { test, done } = compileTest({
  Program,
  Statement,
  Effect,
  Expression,
});

assertThrow(
  done,
  /^Error: superfluous visitors >> Program, Statement, Effect, Expression$/u,
);

assertEqual(test(`123;`, `{ void 123; }`), undefined);

assertEqual(
  test(
    `"use strict"; debugger; 123 + 456;`,
    `{ void "DebuggerStatement"; void "BinaryExpression"; }`,
  ),
  undefined,
);

assertEqual(done(), undefined);
