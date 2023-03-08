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
import { EXPRESSION_MACRO } from "../site.mjs";
import { visit } from "../context.mjs";
import {
  Program,
  Statement,
  Effect,
  Expression,
  ExpressionMacro,
  compileTest,
} from "./__fixture__.mjs";

const { undefined } = globalThis;

const { test, done } = compileTest({
  Program,
  Statement: {
    ...Statement,
    ReturnStatement: (node, context, _site) => {
      assertNotEqual(node.argument, null);
      const macro = visit(node.argument, context, EXPRESSION_MACRO);
      return [
        makeReturnStatement(
          reduceReverse(macro.setup, makeSequenceExpression, macro.pure),
        ),
      ];
    },
  },
  Effect,
  Expression,
  ExpressionMacro,
});

assertEqual(test(`123;`, `{ void 123; }`), undefined);

assertEqual(test(`"use strict";`, `{}`), undefined);

assertEqual(test(`debugger;`, `{ void "DebuggerStatement"; }`), undefined);

assertEqual(test(`123 + 456;`, `{ void "BinaryExpression"; }`), undefined);

assertThrow(done, /^Error: superfluous visitors >> ExpressionMacro$/u);

assertEqual(
  test(`return 123;`, `{ let macro; return (macro = 123, macro); }`),
  undefined,
);

assertEqual(done(), undefined);
