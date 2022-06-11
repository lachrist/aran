import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./closure-dynamic.mjs";

assertSuccess(
  testBlock(Frame, {
    options: {
      dynamic: makeLiteralExpression("dynamic"),
      observable: false,
      conflict: makeLiteralExpression("conflict"),
    },
    head: "",
    scenarios: [
      {
        type: "declare",
        kind: "var",
        variable: "variable",
        options: {exports: []},
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
        type: "initialize",
        strict: true,
        kind: "var",
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: `effect(
          intrinsic.aran.setStrict('dynamic', 'variable', 'right'),
        )`,
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
