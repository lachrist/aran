import { assertEqual, assertSuccess } from "../../../__fixture__.mjs";

import { createCounter, gaugeCounter } from "../../../util/index.mjs";

import {
  makeLiteralExpression,
  makeExpressionEffect,
} from "../../../ast/index.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./empty-dynamic-with.mjs";

const initial = 123;

const counter = createCounter(initial);

assertSuccess(
  testBlock(Frame, {
    options: {
      macro: makeLiteralExpression("dynamic"),
      observable: true,
    },
    head: "",
    scenarios: [
      {
        type: "write",
        strict: true,
        next: () => makeExpressionEffect(makeLiteralExpression("next")),
        right: makeLiteralExpression("right"),
        counter,
        variable: "variable",
        code: `(
          (
            intrinsic.aran.get('dynamic', intrinsic.Symbol.unscopables) ?
            (
              intrinsic.aran.get(
                intrinsic.aran.get('dynamic', intrinsic.Symbol.unscopables),
                'variable',
              ) ?
              false :
              intrinsic.aran.binary('in', 'variable', 'dynamic')
            ) :
            intrinsic.aran.binary('in', 'variable', 'dynamic')
          ) ?
          void intrinsic.aran.setStrict('dynamic', 'variable', 'right') :
          void 'next'
        )`,
      },
    ],
  }),
);

assertEqual(gaugeCounter(counter), initial + 3);
