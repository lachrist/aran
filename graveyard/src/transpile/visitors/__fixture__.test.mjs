import {
  assertNotEqual,
  assertEqual,
  assertThrow,
} from "../../__fixture__.mjs";
import { reduceReverse } from "../../util/index.mjs";
import {
  makeReturnStatement,
  makeSequenceExpression,
} from "../../ast/index.mjs";
import { EXPRESSION_MEMO } from "../site.mjs";
import { visit } from "../context.mjs";
import {
  Program,
  Statement,
  Effect,
  Expression,
  ExpressionMemo,
  compileTest,
} from "./__fixture__.mjs";

const { undefined } = globalThis;

const { test, done } = compileTest({
  Program,
  Statement: {
    ...Statement,
    ReturnStatement: (node, context, _site) => {
      assertNotEqual(node.argument, null);
      const memo = visit(node.argument, context, EXPRESSION_MEMO);
      return [
        makeReturnStatement(
          reduceReverse(memo.setup, makeSequenceExpression, memo.pure),
        ),
      ];
    },
  },
  Effect,
  Expression,
  ExpressionMemo,
});

assertEqual(test(`123;`, `{ void 123; }`), undefined);

assertEqual(test(`"use strict";`, `{}`), undefined);

assertEqual(test(`debugger;`, `{ void "DebuggerStatement"; }`), undefined);

assertEqual(test(`123 + 456;`, `{ void "BinaryExpression"; }`), undefined);

assertThrow(done, /^Error: superfluous visitors >> ExpressionMemo$/u);

assertEqual(
  test(`return 123;`, `{ let memo; return (memo = 123, memo); }`),
  undefined,
);

assertEqual(done(), undefined);
