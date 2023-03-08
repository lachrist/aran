import { concat } from "array-lite";
import { makeExpressionEffect } from "../../ast/index.mjs";
import { EXPRESSION_MACRO } from "../site.mjs";
import { visit } from "../context.mjs";
import { Program, Statement, Expression, compileTest } from "./__fixture__.mjs";
import ExpressionMacro from "./expression-macro.mjs";

const { test, done } = compileTest({
  Program,
  Statement,
  Effect: {
    __ANNOTATE__: (nodes, _serial) => nodes,
    __DEFAULT__: (node, context, _site) => {
      const macro = visit(node, context, EXPRESSION_MACRO);
      return concat(macro.setup, [makeExpressionEffect(macro.value)]);
    },
  },
  Expression,
  ExpressionMacro,
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
