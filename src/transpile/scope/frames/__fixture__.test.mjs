import {
  assert,
  assertEqual,
  assertDeepEqual,
  assertSuccess,
} from "../../../__fixture__.mjs";

import {
  makeEffectStatement,
  makeLiteralExpression,
  makeExpressionEffect,
} from "../../../ast/index.mjs";

import {accessWrite, isWrite, isRead} from "../right.mjs";

import {testBlock} from "./__fixture__.mjs";

assertSuccess(
  testBlock(
    {
      create: (layer, options) => {
        assertEqual(layer, "layer");
        assertDeepEqual(options, {});
        return "frame";
      },
      harvest: (frame) => {
        assertEqual(frame, "frame");
        return {
          header: ["variable"],
          prelude: [
            makeEffectStatement(
              makeExpressionEffect(makeLiteralExpression("prelude")),
            ),
          ],
        };
      },
      declare: (frame, strict, kind, variable, iimport, eexports) => {
        assertEqual(frame, "frame");
        assertEqual(strict, true);
        assertEqual(kind, "kind");
        assertEqual(variable, "variable"), assertEqual(iimport, null);
        assertDeepEqual(eexports, []);
        return [
          makeEffectStatement(
            makeExpressionEffect(makeLiteralExpression("declaration")),
          ),
        ];
      },
      initialize: (frame, strict, kind, variable, expression) => {
        assertEqual(frame, "frame");
        assertEqual(strict, true);
        assertEqual(kind, "kind");
        assertEqual(variable, "variable");
        return [makeEffectStatement(makeExpressionEffect(expression))];
      },
      lookup: (_next, frame, strict, escaped, variable, right) => {
        assertEqual(frame, "frame");
        assertEqual(strict, false);
        assertEqual(escaped, false);
        assertEqual(variable, "variable");
        if (isWrite(right)) {
          return makeExpressionEffect(accessWrite(right));
        } else {
          assert(isRead(right));
          return makeLiteralExpression("read");
        }
      },
    },
    {
      head: `
        let variable;
        effect('prelude');
      `,
      layer: "layer",
      options: {},
      scenarios: [
        {
          type: "declare",
          strict: true,
          kind: "kind",
          variable: "variable",
          import: null,
          exports: [],
          code: "effect('declaration');",
        },
        {
          type: "initialize",
          strict: true,
          kind: "kind",
          variable: "variable",
          right: makeLiteralExpression("right"),
          code: "effect('right');",
        },
        {
          type: "write",
          strict: false,
          escaped: false,
          variable: "variable",
          right: makeLiteralExpression("right"),
          code: "effect('right')",
        },
        {
          type: "read",
          strict: false,
          escaped: false,
          variable: "variable",
          code: "'read'",
        },
      ],
    },
  ),
);

assertSuccess(
  testBlock(
    {
      create: (_layer, _options) => null,
      harvest: (_frame) => ({
        header: [],
        prelude: [],
      }),
      declare: (_frame, _kind, _variable, _iimport, _eexports) => null,
      initialize: (_frame, _kind, _variable, _expression) => null,
      lookup: (next, _frame, _strict, _escaped, _variable, _right) => next(),
    },
    {
      layer: "layer",
      options: {},
      scenarios: [
        {
          type: "declare",
        },
        {
          type: "initialize",
        },
        {
          type: "read",
          next: () => makeLiteralExpression("next"),
          code: "'next'",
        },
        {
          type: "write",
          next: () => makeExpressionEffect(makeLiteralExpression("next")),
          code: "effect('next')",
        },
      ],
    },
  ),
);
