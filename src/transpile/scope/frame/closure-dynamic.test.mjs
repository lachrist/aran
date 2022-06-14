import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./closure-dynamic.mjs";

assertSuccess(
  testBlock(Frame, {
    options: {
      dynamic: makeLiteralExpression("dynamic"),
      observable: true,
    },
    head: `effect(
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
    scenarios: [
      {
        type: "declare",
        kind: "var",
        variable: "variable",
        options: {exports: []},
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
        next: () => makeLiteralExpression("next"),
        variable: "VARIABLE",
        code: `
          intrinsic.aran.binary('in', 'VARIABLE', 'dynamic') ?
          intrinsic.aran.get('dynamic', 'VARIABLE') :
          'next'
        `,
      },
      {
        type: "typeof",
        variable: "variable",
        code: `intrinsic.aran.unary(
          'typeof',
          intrinsic.aran.get('dynamic', 'variable'),
        )`,
      },
      {
        type: "discard",
        strict: false,
        variable: "variable",
        code: "intrinsic.aran.deleteSloppy('dynamic', 'variable')",
      },
      {
        type: "write",
        strict: true,
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: `effect(
          intrinsic.aran.setStrict('dynamic', 'variable', 'right'),
        )`,
      },
    ],
  }),
);
