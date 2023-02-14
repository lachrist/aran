import { assertSuccess, assertEqual } from "../../../__fixture__.mjs";

import { createCounter, gaugeCounter } from "../../../util/index.mjs";

import { makeLiteralExpression } from "../../../ast/index.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./closure-dynamic.mjs";

const initial = 123;

const counter = createCounter(initial);

assertSuccess(
  testBlock(Frame, {
    options: {
      macro: makeLiteralExpression("dynamic"),
      observable: true,
    },
    head: `void (
      intrinsic.aran.binary('in', 'variable', 'dynamic') ?
      undefined :
      intrinsic.Reflect.defineProperty(
        'dynamic',
        'variable',
        intrinsic.aran.createObject(
          null,
          'value', undefined,
          'writable', true,
          'enumerable', true,
          'configurable', false,
        ),
      )
    );`,
    scenarios: [
      {
        type: "read",
        variable: "variable",
        next: (_strict, _frame, _scope, _escaped, _variable, _options) =>
          makeLiteralExpression("next"),
        code: `(
          intrinsic.aran.binary('in', 'variable', 'dynamic') ?
          intrinsic.aran.get('dynamic', 'variable') :
          'next'
        )`,
      },
      {
        type: "declare",
        kind: "var",
        variable: "variable",
        options: { exports: [] },
      },
      {
        type: "typeof",
        variable: "variable",
        code: `
          intrinsic.aran.unary(
            "typeof",
            intrinsic.aran.get('dynamic', 'variable'),
          )
        `,
      },
      {
        type: "initialize",
        kind: "var",
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: `void intrinsic.aran.setStrict('dynamic', 'variable', 'right')`,
      },
      {
        type: "discard",
        variable: "variable",
        code: `intrinsic.aran.deleteSloppy('dynamic', 'variable')`,
      },
      {
        type: "write",
        variable: "variable",
        code: `void intrinsic.aran.setStrict('dynamic', 'variable', 'right')`,
        right: makeLiteralExpression("right"),
        counter,
      },
    ],
  }),
);

assertEqual(gaugeCounter(counter), initial + 3);
