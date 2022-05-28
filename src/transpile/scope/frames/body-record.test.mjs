import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./body-record.mjs";

assertSuccess(
  testBlock(Frame, {
    head: `
      effect(
        (
          intrinsic.aran.binary('in', 'VARIABLE', 'dynamic') ?
          intrinsic.aran.throw(
            new intrinsic.SyntaxError('Identifier \\'VARIABLE\\' has already been declared')
          ) :
          undefined
        ),
      );
      effect(
        (
          intrinsic.aran.binary('in', 'variable', 'dynamic') ?
          intrinsic.aran.throw(
            new intrinsic.SyntaxError('Identifier \\'variable\\' has already been declared')
          ) :
          undefined
        ),
      );
    `,
    options: {
      dynamic: makeLiteralExpression("dynamic"),
    },
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
        initialization: "initialization",
        code: `effect(
          intrinsic.Reflect.defineProperty(
            'dynamic',
            'variable',
            intrinsic.aran.createObject(
              null,
              'value', 'initialization',
              'writable', false,
              'enumerable', true,
              'configurable', false,
            ),
          ),
        );`,
      },
      {
        type: "read",
        next: "next",
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
                'Cannot access \\'variable\\' before initialization',
              ),
            ) :
            intrinsic.aran.get('dynamic', 'variable')
          ) :
          'next'
        )`,
      },
      {
        type: "typeof",
        next: "next",
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
                'Cannot access \\'variable\\' before initialization',
              ),
            ) :
            intrinsic.aran.unary(
              'typeof',
              intrinsic.aran.get('dynamic', 'variable'),
            )
          ) :
          'next'
        )`,
      },
      {
        type: "discard",
        next: "next",
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
        next: "next",
        strict: true,
        variable: "variable",
        assignment: "assignment",
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
                  'Cannot access \\'variable\\' before initialization',
                ),
              ) :
              intrinsic.aran.setStrict('dynamic', 'variable', 'assignment')
            ),
          ) :
          effect('next')
        )`,
      },
    ],
  }),
);
