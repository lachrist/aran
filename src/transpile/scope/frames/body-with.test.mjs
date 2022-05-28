import {assertSuccess} from "../../../__fixture__.mjs";

import {
  makeExpressionEffect,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./body-with.mjs";

assertSuccess(
  testBlock(Frame, {
    options: {
      dynamic: makeLiteralExpression("dynamic"),
    },
    head: "",
    scenarios: [
      {
        type: "read",
        next: () => makeLiteralExpression("next"),
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
          intrinsic.aran.get('dynamic', 'variable') :
          'next'
        )`,
      },
      {
        type: "write",
        next: () => makeExpressionEffect(makeLiteralExpression("next")),
        strict: true,
        variable: "variable",
        right: makeLiteralExpression("right"),
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
          effect(
            intrinsic.aran.setStrict('dynamic', 'variable', 'right'),
          ) :
          effect('next')
        )`,
      },
    ],
  }),
);
