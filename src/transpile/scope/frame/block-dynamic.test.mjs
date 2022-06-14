import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./block-dynamic.mjs";

assertSuccess(
  testBlock(Frame, {
    options: {
      dynamic: makeLiteralExpression("dynamic"),
      observable: true,
    },
    head: `
      effect(
        (
          intrinsic.aran.binary('in', 'variable', 'dynamic') ?
          intrinsic.aran.throw(
            new intrinsic.SyntaxError(
              "Variable 'variable' has already been declared",
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
        variable: "variable",
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
        type: "read",
        variable: "VARIABLE",
        next: () => makeLiteralExpression("next"),
        code: `
          intrinsic.aran.binary('in', 'VARIABLE', 'dynamic') ?
          (
            intrinsic.aran.binary(
              '===',
              intrinsic.aran.get('dynamic', 'VARIABLE'),
              intrinsic.aran.deadzone
            ) ?
            intrinsic.aran.throw(
              new intrinsic.ReferenceError(
                "Cannot access variable 'VARIABLE' before initialization",
              ),
            ) :
            intrinsic.aran.get('dynamic', 'VARIABLE')
          ) :
          'next'
        `,
      },
      {
        type: "typeof",
        variable: "variable",
        code: `
          intrinsic.aran.binary(
            '===',
            intrinsic.aran.get('dynamic', 'variable'),
            intrinsic.aran.deadzone
          ) ?
          intrinsic.aran.throw(
            new intrinsic.ReferenceError(
              "Cannot access variable 'variable' before initialization",
            ),
          ) :
          intrinsic.aran.unary(
            'typeof',
            intrinsic.aran.get('dynamic', 'variable'),
          )
        `,
      },
      {
        type: "discard",
        strict: false,
        variable: "variable",
        code: `intrinsic.aran.deleteSloppy('dynamic', 'variable')`,
      },
      {
        type: "write",
        strict: true,
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: `effect(
          (
            intrinsic.aran.binary(
              '===',
              intrinsic.aran.get('dynamic', 'variable'),
              intrinsic.aran.deadzone
            ) ?
            intrinsic.aran.throw(
              new intrinsic.ReferenceError(
                "Cannot access variable 'variable' before initialization",
              ),
            ) :
            intrinsic.aran.setStrict('dynamic', 'variable', 'right')
          ),
        )`,
      },
    ],
  }),
);
