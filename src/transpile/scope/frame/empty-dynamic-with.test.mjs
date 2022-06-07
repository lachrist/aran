import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./empty-dynamic-with.mjs";

assertSuccess(
  testBlock(Frame, {
    options: {
      dynamic: makeLiteralExpression("dynamic"),
    },
    head: "",
    scenarios: [
      {
        type: "read",
        output: "expression",
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
    ],
  }),
);
