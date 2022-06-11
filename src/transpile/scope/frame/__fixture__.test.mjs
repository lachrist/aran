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

const FRAME = {layer: "layer"};

assertSuccess(
  testBlock(
    {
      create: (layer, options) => {
        assertEqual(layer, "layer");
        assertDeepEqual(options, {});
        return FRAME;
      },
      conflict: (strict, frame, kind, variable) => {
        assertEqual(strict, true);
        assertEqual(frame, FRAME);
        assertEqual(kind, "kind");
        assertEqual(variable, "variable");
      },
      harvest: (frame) => {
        assertEqual(frame, FRAME);
        return {
          header: ["variable"],
          prelude: [
            makeEffectStatement(
              makeExpressionEffect(makeLiteralExpression("prelude")),
            ),
          ],
        };
      },
      makeDeclareStatements: (strict, frame, kind, variable, options) => {
        assertEqual(strict, true);
        assertEqual(frame, FRAME);
        assertEqual(kind, "kind");
        assertEqual(variable, "variable");
        assertDeepEqual(options, {options: null});
        return [
          makeEffectStatement(
            makeExpressionEffect(makeLiteralExpression("declaration")),
          ),
        ];
      },
      makeInitializeStatements: (strict, frame, kind, variable, expression) => {
        assertEqual(strict, true);
        assertEqual(frame, FRAME);
        assertEqual(kind, "kind");
        return [makeEffectStatement(makeWriteEffect(variable, expression))];
      },
      makeLookupEffect: (_next, strict, escaped, frame, variable, right) => {
        assertEqual(strict, true);
        assertEqual(escaped, true);
        assertEqual(frame, FRAME);
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
        assertEqual(frame, FRAME);
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
          type: "conflict",
          strict: true,
          kind: "kind",
          variable: "variable",
        },
        {
          type: "declare",
          strict: true,
          kind: "kind",
          variable: "variable",
          options: {options: null},
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
