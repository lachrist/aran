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
  makeWriteEffect,
  makeReadExpression,
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
      makeDeclareStatements: (
        strict,
        frame,
        kind,
        variable,
        iimport,
        eexports,
      ) => {
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
      makeInitializeStatements: (strict, frame, kind, variable, expression) => {
        assertEqual(frame, "frame");
        assertEqual(strict, true);
        assertEqual(kind, "kind");
        return [makeEffectStatement(makeWriteEffect(variable, expression))];
      },
      makeLookupEffect: (_next, strict, escaped, frame, variable, right) => {
        assertEqual(frame, "frame");
        assertEqual(strict, true);
        assertEqual(escaped, true);
        assert(isWrite(right));
        return makeWriteEffect(variable, accessWrite(right));
      },
      makeLookupExpression: (
        _next,
        strict,
        escaped,
        frame,
        variable,
        right,
      ) => {
        assertEqual(frame, "frame");
        assertEqual(strict, false);
        assertEqual(escaped, false);
        assert(isRead(right));
        return makeReadExpression(variable);
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
          code: "variable = 'right';",
        },
        {
          type: "write",
          output: "effect",
          strict: true,
          escaped: true,
          variable: "variable",
          right: makeLiteralExpression("right"),
          code: "variable = 'right'",
        },
        {
          type: "read",
          output: "expression",
          strict: false,
          escaped: false,
          variable: "variable",
          code: "variable",
        },
      ],
    },
  ),
);

// assertSuccess(
//   testBlock(
//     {
//       create: (_layer, _options) => null,
//       harvest: (_frame) => ({
//         header: [],
//         prelude: [],
//       }),
//       declare: (_frame, _kind, _variable, _iimport, _eexports) => null,
//       initialize: (_frame, _kind, _variable, _expression) => null,
//       lookup: (next, _frame, _strict, _escaped, _variable, _right) => next(),
//     },
//     {
//       layer: "layer",
//       options: {},
//       scenarios: [
//         {
//           type: "declare",
//         },
//         {
//           type: "initialize",
//         },
//         {
//           type: "read",
//           next: () => makeLiteralExpression("next"),
//           code: "'next'",
//         },
//         {
//           type: "write",
//           next: () => makeExpressionEffect(makeLiteralExpression("next")),
//           code: "effect('next')",
//         },
//       ],
//     },
//   ),
// );
