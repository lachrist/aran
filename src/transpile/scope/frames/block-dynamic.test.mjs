import { assertSuccess } from "../../../__fixture__.mjs";

import { makeLiteralExpression } from "../../../ast/index.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./block-dynamic.mjs";

assertSuccess(
  testBlock(Frame, {
    options: {
      macro: makeLiteralExpression("dynamic"),
    },
    head: `
      void (
        intrinsic.aran.binary('in', 'VARIABLE', 'dynamic') ?
        intrinsic.aran.throw(
          new intrinsic.SyntaxError(
            "Variable \\"VARIABLE\\" has already been declared",
          ),
        ) :
        undefined
      );
      void (
        intrinsic.aran.binary('in', 'variable', 'dynamic') ?
        intrinsic.aran.throw(
          new intrinsic.SyntaxError(
            "Variable \\"variable\\" has already been declared",
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
      // Dynamic //
      {
        type: "discard",
        variable: "VARIABLE",
        next: (_strict, _frame, _scope, _escaped, _variable, _options) =>
          makeLiteralExpression("next"),
        code: `(
          intrinsic.aran.binary("in", "VARIABLE", "dynamic") ?
          intrinsic.aran.deleteSloppy("dynamic", "VARIABLE") :
          "next"
        )`,
      },
      {
        type: "read",
        variable: "VARIABLE",
        next: (_strict, _frame, _scope, _escaped, _variable, _options) =>
          makeLiteralExpression("next"),
        code: `(
          intrinsic.aran.binary("in", "VARIABLE", "dynamic") ?
          (
            intrinsic.aran.binary(
              "===",
              intrinsic.aran.get("dynamic", "VARIABLE"),
              intrinsic.aran.deadzone,
            ) ?
            intrinsic.aran.throw(
              new intrinsic.ReferenceError(
                "Cannot access variable \\"VARIABLE\\" before initialization",
              ),
            ) :
            intrinsic.aran.get("dynamic", "VARIABLE")
          ) :
          "next"
        )`,
      },
      // Static //
      {
        type: "declare",
        kind: "var",
        variable: "VARIABLE",
        options: { exports: [] },
        declared: false,
      },
      {
        type: "initialize",
        kind: "var",
        variable: "VARIABLE",
        right: makeLiteralExpression("right"),
        initialized: false,
      },
      {
        type: "declare",
        kind: "const",
        variable: "variable",
        options: { exports: [] },
        declared: true,
      },
      {
        type: "discard",
        variable: "variable",
        code: `intrinsic.aran.deleteSloppy("dynamic", "variable")`,
      },
      {
        type: "read",
        escaped: false,
        variable: "variable",
        code: `intrinsic.aran.throw(
          new intrinsic.ReferenceError(
            "Cannot access variable \\"variable\\" before initialization",
          ),
        )`,
      },
      {
        type: "read",
        escaped: true,
        variable: "variable",
        code: `(
          intrinsic.aran.binary(
            '===',
            intrinsic.aran.get('dynamic', 'variable'),
            intrinsic.aran.deadzone
          ) ?
          intrinsic.aran.throw(
            new intrinsic.ReferenceError(
              "Cannot access variable \\"variable\\" before initialization",
            ),
          ) :
          intrinsic.aran.get('dynamic', 'variable')
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
        initialized: true,
      },
      {
        type: "read",
        variable: "variable",
        code: `intrinsic.aran.get('dynamic', 'variable')`,
      },
    ],
  }),
);
