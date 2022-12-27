import {
  assertEqual,
  assertDeepEqual,
  assertSuccess,
} from "../../../__fixture__.mjs";

import { push } from "../../../util/index.mjs";

import {
  makeEffectStatement,
  makeLiteralExpression,
  makeExpressionEffect,
  makeWriteEffect,
  makeReadExpression,
} from "../../../ast/index.mjs";

import { testBlock } from "./__fixture__.mjs";

assertSuccess(
  testBlock(
    {
      KINDS: ["kind"],
      create: (options) => {
        assertDeepEqual(options, {});
        return { header: [], prelude: [] };
      },
      harvestHeader: ({ header }) => header,
      harvestPrelude: ({ prelude }) => prelude,
      conflict: (strict, { prelude }, kind, variable) => {
        assertEqual(strict, true);
        assertEqual(kind, "kind");
        assertEqual(variable, "variable");
        push(
          prelude,
          makeEffectStatement(
            makeExpressionEffect(makeLiteralExpression("conflict")),
          ),
        );
      },
      declare: (strict, { header }, kind, variable, options) => {
        assertEqual(strict, true);
        assertEqual(kind, "kind");
        assertDeepEqual(options, { options: null });
        push(header, variable);
      },
      makeInitializeStatementArray: (
        strict,
        _frame,
        kind,
        variable,
        expression,
      ) => {
        assertEqual(strict, true);
        assertEqual(kind, "kind");
        return [makeEffectStatement(makeWriteEffect(variable, expression))];
      },
      lookupAll: (_strict, _escaped, _frame) => {},
      makeWriteEffect: (
        _next,
        strict,
        escaped,
        _frame,
        variable,
        { expression },
      ) => {
        assertEqual(strict, true);
        assertEqual(escaped, true);
        return makeWriteEffect(variable, expression);
      },
      makeReadExpression: (
        _next,
        strict,
        escaped,
        _frame,
        variable,
        options,
      ) => {
        assertEqual(strict, false);
        assertEqual(escaped, false);
        assertEqual(options, null);
        return makeReadExpression(variable);
      },
    },
    {
      head: `
        let variable;
        void 'conflict';
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
          options: { options: null },
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
          type: "lookup-all",
          strict: true,
          escaped: false,
        },
        {
          type: "write",
          strict: true,
          escaped: true,
          variable: "variable",
          right: makeLiteralExpression("right"),
          code: "variable = 'right'",
        },
        {
          type: "read",
          strict: false,
          escaped: false,
          variable: "variable",
          code: "variable",
        },
      ],
    },
  ),
);
