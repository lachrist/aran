import {
  assertEqual,
  assertDeepEqual,
  assertSuccess,
} from "../../__fixture__.mjs";

import { push, deadcode_______ } from "../../util/index.mjs";

import {
  makeEffectStatement,
  makeLiteralExpression,
  makeExpressionEffect,
  makeWriteEffect,
  makeReadExpression,
} from "../../ast/index.mjs";

import { testBlock } from "./__fixture__.mjs";

assertSuccess(
  testBlock(
    {
      KINDS: ["kind"],
      createFrame: (options) => {
        assertDeepEqual(options, {});
        return {
          tag: "frame",
          header: [],
          prelude: [
            makeEffectStatement(
              makeExpressionEffect(makeLiteralExpression("prelude")),
            ),
          ],
        };
      },
      harvestFrameHeader: ({ header }) => header,
      harvestFramePrelude: ({ prelude }) => prelude,
      declareFrame: (strict, { header }, _trail, kind, variable, options) => {
        assertEqual(strict, true);
        assertEqual(kind, "kind");
        assertDeepEqual(options, { options: null });
        push(header, variable);
        return null;
      },
      makeFrameInitializeStatementArray: (
        strict,
        { tag },
        _trail,
        kind,
        variable,
        expression,
      ) => {
        assertEqual(strict, true);
        assertEqual(tag, "frame");
        assertEqual(kind, "kind");
        return [makeEffectStatement(makeWriteEffect(variable, expression))];
      },
      lookupFrameAll: (_strict, _frame) => {},
      makeFrameReadExpression: (
        next,
        strict,
        { tag },
        scope,
        escaped,
        variable,
        options,
      ) => {
        assertEqual(typeof next, "function");
        assertEqual(strict, false);
        assertEqual(tag, "frame");
        assertEqual(scope, "scope");
        assertEqual(escaped, false);
        assertEqual(options, null);
        return makeReadExpression(variable);
      },
      makeFrameTypeofExpression: deadcode_______("makeTypeofExpression"),
      makeFrameDiscardExpression: deadcode_______("makeDiscardExpression"),
      makeFrameWriteEffectArray: (
        next,
        strict,
        { tag },
        scope,
        escaped,
        variable,
        { expression },
      ) => {
        assertEqual(typeof next, "function");
        assertEqual(strict, true);
        assertEqual(tag, "frame");
        assertEqual(scope, "scope");
        assertEqual(escaped, true);
        return [makeWriteEffect(variable, expression)];
      },
    },
    {
      head: `
        let variable;
        void 'prelude';
      `,
      layer: "layer",
      options: {},
      scenarios: [
        {
          type: "declare",
          strict: true,
          kind: "kind",
          variable: "variable",
          options: { options: null },
          declared: true,
        },
        {
          type: "initialize",
          strict: true,
          kind: "kind",
          variable: "variable",
          right: makeLiteralExpression("right"),
          code: "variable = 'right';",
          initialized: true,
        },
        {
          type: "lookup-all",
          strict: true,
          escaped: false,
        },
        {
          type: "write",
          strict: true,
          escaped: true,
          scope: "scope",
          variable: "variable",
          right: makeLiteralExpression("right"),
          code: "variable = 'right';",
        },
        {
          type: "read",
          strict: false,
          scope: "scope",
          escaped: false,
          variable: "variable",
          code: "variable",
        },
      ],
    },
  ),
);
