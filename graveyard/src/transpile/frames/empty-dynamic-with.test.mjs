import { assertSuccess } from "../../__fixture__.mjs";

import {
  makeLiteralExpression,
  makeExpressionEffect,
} from "../../ast/index.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./empty-dynamic-with.mjs";

assertSuccess(
  testBlock(Frame, {
    options: {
      pure: makeLiteralExpression("dynamic"),
      observable: true,
    },
    head: "",
    scenarios: [
      {
        type: "write",
        strict: true,
        next: (_strict, _frame, _scope, _escaped, _variable, _options) => [
          makeExpressionEffect(makeLiteralExpression("next")),
        ],
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
          void intrinsic.aran.setStrict('dynamic', 'variable', 'right') :
          void 'next'
        )`,
      },
    ],
  }),
);
