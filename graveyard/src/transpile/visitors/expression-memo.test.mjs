import { concat } from "array-lite";
import { makeExpressionEffect } from "../../ast/index.mjs";
import { EXPRESSION_MEMO } from "../site.mjs";
import { visit } from "../context.mjs";
import { Program, Statement, Expression, compileTest } from "./__fixture__.mjs";
import ExpressionMemo from "./expression-memo.mjs";

const { test, done } = compileTest({
  Program,
  Statement,
  Effect: {
    __ANNOTATE__: (nodes, _serial) => nodes,
    __DEFAULT__: (node, context, _site) => {
      const memo = visit(node, context, EXPRESSION_MEMO);
      return concat(memo.setup, [makeExpressionEffect(memo.pure)]);
    },
  },
  Expression,
  ExpressionMemo,
});

test(`123;`, `{ void 123; }`);

test(
  `123 + 456;`,
  `
    {
      let x;
      x = "BinaryExpression";
      void x;
    }
  `,
);

done();
