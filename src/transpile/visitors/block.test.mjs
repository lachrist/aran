import { makeIfStatement } from "../../ast/index.mjs";
import { EXPRESSION, BLOCK } from "../site.mjs";
import { visit } from "../context.mjs";
import {
  Program,
  Statement,
  Effect,
  Expression,
  compileTest,
} from "./__fixture__.mjs";
import Block from "./block.mjs";

const { test, done } = compileTest({
  Program,
  Block,
  Statement: {
    ...Statement,
    IfStatement: (node, context, _site) => [
      makeIfStatement(
        visit(node.test, context, EXPRESSION),
        visit(node.consequent, context, BLOCK),
        visit(node.alternate, context, BLOCK),
      ),
    ],
  },
  Effect,
  Expression,
});

test(
  `if (123) k: l: { 456; } else m: n: 789;`,
  `{ if (123) k: l: { void 456; } else m: n: { void 789; } }`,
);

done();
