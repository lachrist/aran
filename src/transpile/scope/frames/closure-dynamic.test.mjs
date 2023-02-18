import { assertSuccess } from "../../../__fixture__.mjs";

import { makeLiteralExpression } from "../../../ast/index.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./closure-dynamic.mjs";

assertSuccess(
  testBlock(Frame, {
    options: {
      macro: makeLiteralExpression("dynamic"),
    },
    head: `void (
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
    );`,
    scenarios: [
      {
        type: "declare",
        kind: "let",
        variable: "variable",
        declared: false,
      },
      {
        type: "initialize",
        kind: "let",
        variable: "variable",
        initialized: false,
      },
      {
        type: "read",
        variable: "variable",
        next: (_strict, _frame, _scope, _escaped, _variable, _options) =>
          makeLiteralExpression("next"),
        code: `(
          intrinsic.aran.binary('in', 'variable', 'dynamic') ?
          intrinsic.aran.get('dynamic', 'variable') :
          'next'
        )`,
      },
      {
        type: "declare",
        kind: "var",
        variable: "variable",
        options: { exports: [] },
        declared: true,
      },
      {
        type: "typeof",
        variable: "variable",
        code: `
          intrinsic.aran.unary(
            "typeof",
            intrinsic.aran.get('dynamic', 'variable'),
          )
        `,
      },
      {
        type: "initialize",
        kind: "var",
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: `void intrinsic.aran.setStrict('dynamic', 'variable', 'right')`,
        initialized: true,
      },
      {
        type: "discard",
        variable: "variable",
        code: `intrinsic.aran.deleteSloppy('dynamic', 'variable')`,
      },
      {
        type: "write",
        variable: "variable",
        code: `void intrinsic.aran.setStrict('dynamic', 'variable', 'right')`,
        right: makeLiteralExpression("right"),
      },
    ],
  }),
);
