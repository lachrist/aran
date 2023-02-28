import { map } from "array-lite";
import { DEFAULT_CLAUSE } from "../../node.mjs";
import {
  makeEffectStatement,
  makeExpressionEffect,
  makeLiteralExpression,
} from "../../ast/index.mjs";
import { makeScopeTestBlock } from "../scope/index.mjs";
import { visitMany } from "./context.mjs";
import { testBlock } from "./__fixture__.mjs";
import Visitors from "./callee.mjs";

const makeExpressionStatement = (expression) =>
  makeEffectStatement(makeExpressionEffect(expression));

const visitors = {
  Root: {
    [DEFAULT_CLAUSE]: (node, context1, _site) =>
      makeScopeTestBlock(context1, (context2) =>
        map(visitMany("Callee", node, context2, {}), makeExpressionStatement),
      ),
  },
  Expression: {
    Literal: (node, _context, _site) => makeLiteralExpression(node.value),
  },
  Property: {
    Identifier: (node, _context, _site) => makeLiteralExpression(node.name),
  },
  ...Visitors,
};

const test = (input, output) =>
  testBlock("Root", input, "body/0/expression", { visitors }, null, output);

test(
  `123;`,
  `
    {
      void 123;
      void undefined;
    }
  `,
);

test(
  `super.key;`,
  `
    {
      void ("super.get")("key");
      void "this";
    }
  `,
);

test(
  `(123).key;`,
  `
    {
      let callee_this;
      void (
        callee_this = 123,
        intrinsic.aran.get(callee_this, "key")
      );
      void callee_this;
    }
  `,
);

test(
  `(123)?.key;`,
  `
    {
      let callee_this;
      void (
        callee_this = 123,
        (
          (
            intrinsic.aran.binary("===", callee_this, null) ?
            true :
            intrinsic.aran.binary("===", callee_this, undefined)
          ) ?
          undefined :
          intrinsic.aran.get(callee_this, "key")
        )
      );
      void callee_this;
    }
  `,
);
