import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./block-dynamic.mjs";

assertSuccess(
  testBlock(Frame, {
    options: {
      macro: makeLiteralExpression("dynamic"),
      observable: true,
    },
    head: `
      effect(
        (
          intrinsic.aran.binary('in', 'VARIABLE', 'dynamic') ?
          intrinsic.aran.throw(
            new intrinsic.SyntaxError(
              "Variable 'VARIABLE' has already been declared",
            ),
          ) :
          undefined
        ),
      );
      effect(
        intrinsic.Reflect.defineProperty(
          'dynamic',
          'variable',
          intrinsic.aran.createObject(
            null,
            'value', intrinsic.aran.deadzone,
            'writable', true,
            'enumerable', true,
            'configurable', false,
          ),
        ),
      );
    `,
    scenarios: [
      {
        type: "conflict",
        variable: "VARIABLE",
      },
      {
        type: "declare",
        kind: "const",
        variable: "variable",
        options: {exports: []},
      },
      {
        type: "initialize",
        kind: "const",
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: `effect(
          intrinsic.Reflect.defineProperty(
            'dynamic',
            'variable',
            intrinsic.aran.createObject(
              null,
              'value', 'right',
              'writable', false,
              'enumerable', true,
              'configurable', false,
            ),
          ),
        );`,
      },
      {
        type: "write",
        strict: true,
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: `(
          intrinsic.aran.binary(
            '===',
            intrinsic.aran.get('dynamic', 'variable'),
            intrinsic.aran.deadzone
          ) ?
          effect(
            intrinsic.aran.throw(
              new intrinsic.ReferenceError(
                "Cannot access variable 'variable' before initialization",
              ),
            ),
          ) :
          effect(
            intrinsic.aran.setStrict('dynamic', 'variable', 'right'),
          )
        )`,
      },
    ],
  }),
);
