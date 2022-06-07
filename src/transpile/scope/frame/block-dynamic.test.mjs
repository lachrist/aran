import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./block-dynamic.mjs";

assertSuccess(
  testBlock(Frame, {
    options: {
      dynamic: makeLiteralExpression("dynamic"),
    },
    head: `effect(
      (
        intrinsic.aran.binary('in', 'variable', 'dynamic') ?
        intrinsic.aran.throw(
          new intrinsic.SyntaxError(
            "Variable 'variable' has already been declared",
          ),
        ) :
        undefined
      ),
    );`,
    scenarios: [
      {
        type: "conflict",
        variable: "variable",
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
        output: "expression",
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
        output: "expression",
        next: () => makeLiteralExpression("next"),
        strict: false,
        variable: "variable",
        code: `(
          intrinsic.aran.binary('in', 'variable', 'dynamic') ?
          intrinsic.aran.deleteSloppy('dynamic', 'variable') :
          'next'
        )`,
      },
    ],
  }),
);
