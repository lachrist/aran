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
      declare: (frame, kind, variable, iimport, eexports) => {
        assertEqual(frame, "frame");
        assertEqual(kind, "kind");
        assertEqual(variable, "variable"), assertEqual(iimport, null);
        assertDeepEqual(eexports, []);
        return [
          makeEffectStatement(
            makeExpressionEffect(makeLiteralExpression("declaration")),
          ),
        ];
      },
      initialize: (frame, kind, variable, expression) => {
        assertEqual(frame, "frame");
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
          code: "effect('declaration');",
        },
        {
          type: "initialize",
          code: "effect('initialization');",
        },
        {
          type: "write",
          code: "effect('assignment')",
        },
        {
          type: "read",
          code: "'read'",
        },
      ],
    },
  ),
);
