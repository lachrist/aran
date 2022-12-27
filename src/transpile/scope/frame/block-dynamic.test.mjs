import { assertSuccess } from "../../../__fixture__.mjs";

import { makeLiteralExpression } from "../../../ast/index.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./block-dynamic.mjs";

assertSuccess(
  testBlock(Frame, {
    options: {
      macro: makeLiteralExpression("dynamic"),
      observable: true,
    },
    head: `
      void (
        intrinsic.aran.binary('in', 'VARIABLE', 'dynamic') ?
        intrinsic.aran.throw(
          new intrinsic.SyntaxError(
            "Variable 'VARIABLE' has already been declared",
          ),
        ) :
        undefined
      );
      void intrinsic.Reflect.defineProperty(
        'dynamic',
        'variable',
        intrinsic.aran.createObject(
          null,
          'value', intrinsic.aran.deadzone,
          'writable', true,
          'enumerable', true,
          'configurable', false,
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
        options: { exports: [] },
      },
      {
        type: "write",
        escaped: false,
        strict: false,
        variable: "variable",
        code: `void intrinsic.aran.throw(
          new intrinsic.ReferenceError(
            "Cannot access variable 'variable' before initialization",
          ),
        )`,
      },
      {
        type: "write",
        escaped: true,
        strict: false,
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: `(
          intrinsic.aran.binary(
            '===',
            intrinsic.aran.get('dynamic', 'variable'),
            intrinsic.aran.deadzone
          ) ?
          void intrinsic.aran.throw(
            new intrinsic.ReferenceError(
              "Cannot access variable 'variable' before initialization",
            ),
          ) :
          void intrinsic.aran.setStrict('dynamic', 'variable', 'right')
        )`,
      },
      {
        type: "initialize",
        kind: "const",
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: `void intrinsic.Reflect.defineProperty(
          'dynamic',
          'variable',
          intrinsic.aran.createObject(
            null,
            'value', 'right',
            'writable', false,
            'enumerable', true,
            'configurable', false,
          ),
        );`,
      },
      {
        type: "write",
        strict: false,
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: `void intrinsic.aran.setStrict('dynamic', 'variable', 'right')`,
      },
    ],
  }),
);
