import {assertSuccess} from "../../../__fixture__.mjs";

import {
  makeExpressionEffect,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./body-record.mjs";

assertSuccess(
  testBlock(Frame, {
    options: {
      dynamic: makeLiteralExpression("dynamic"),
    },
    head: `
      effect(
        (
          intrinsic.aran.binary('in', 'VARIABLE', 'dynamic') ?
          intrinsic.aran.throw(
            new intrinsic.SyntaxError("Variable 'VARIABLE' has already been declared")
          ) :
          undefined
        ),
      );
      effect(
        (
          intrinsic.aran.binary('in', 'variable', 'dynamic') ?
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
        variable: "VARIABLE",
      },
      {
        type: "declare",
        kind: "const",
        variable: "variable",
        code: `effect(
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
        );`,
      },
      {
        type: "initialize",
        kind: "var",
        variable: "VARIABLE",
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
        next: () => makeLiteralExpression("next"),
        variable: "variable",
        code: `(
          intrinsic.aran.binary('in', 'variable', 'dynamic') ?
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
            intrinsic.aran.get('dynamic', 'variable')
          ) :
          'next'
        )`,
      },
      {
        type: "discard",
        next: () => makeLiteralExpression("next"),
        strict: false,
        variable: "variable",
        code: `(
          intrinsic.aran.binary('in', 'variable', 'dynamic') ?
          intrinsic.aran.deleteSloppy('dynamic', 'variable') :
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
          intrinsic.aran.binary('in', 'variable', 'dynamic') ?
          effect(
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
          ) :
          effect('next')
        )`,
      },
    ],
  }),
);
