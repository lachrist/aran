import { assertSuccess } from "../../../__fixture__.mjs";

import { makeLiteralExpression } from "../../../ast/index.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./closure-dynamic.mjs";

assertSuccess(
  testBlock(Frame, {
    options: {
      macro: makeLiteralExpression("dynamic"),
      observable: true,
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
        kind: "var",
        variable: "variable",
        options: { exports: [] },
      },
      {
        type: "initialize",
        strict: true,
        kind: "var",
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: `void intrinsic.aran.setStrict('dynamic', 'variable', 'right')`,
      },
      {
        type: "read",
        variable: "variable",
        code: "intrinsic.aran.get('dynamic', 'variable')",
      },
    ],
  }),
);
