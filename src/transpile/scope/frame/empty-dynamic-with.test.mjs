import {assertSuccess} from "../../../__fixture__.mjs";

import {
  makeLiteralExpression,
  makeExpressionEffect,
} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./empty-dynamic-with.mjs";

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
        strict: false,
        output: "expression",
        next: () => makeExpressionEffect(makeLiteralExpression("next")),
        right: makeLiteralExpression("right"),
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
          effect(
            intrinsic.aran.setSloppy('dynamic', 'variable', 'right'),
          ) :
          effect('next')
        )`,
      },
    ],
  }),
);
