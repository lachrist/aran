import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./body-object.mjs";

assertSuccess(
  testBlock(Frame, {
    options: {
      dynamic: makeLiteralExpression("dynamic"),
      conflict: makeLiteralExpression("conflict"),
    },
    head: `
      effect(
        (
          intrinsic.aran.binary('in', 'variable', 'conflict') ?
          intrinsic.aran.throw(
            new intrinsic.SyntaxError("Variable 'variable' has already been declared")
          ) :
          undefined
        ),
      );
    `,
    scenarios: [
      {
        type: "declare",
        kind: "var",
        variable: "variable",
        code: `effect(
          (
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
          ),
        );`,
      },
      {
        type: "read",
        output: "expression",
        next: () => makeLiteralExpression("next"),
        variable: "variable",
        code: `(
          intrinsic.aran.binary('in', 'variable', 'dynamic') ?
          intrinsic.aran.get('dynamic', 'variable') :
          'next'
        )`,
      },
    ],
  }),
);
