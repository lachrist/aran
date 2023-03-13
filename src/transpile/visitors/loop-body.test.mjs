import { assertEqual } from "../../__fixture__.mjs";
import { makeBreakStatement, makeWhileStatement } from "../../ast/index.mjs";
import { makeEmptyContinueLabel } from "../label.mjs";
import { EXPRESSION, LOOP_BODY } from "../site.mjs";
import { visit } from "../context.mjs";
import {
  Program,
  Statement,
  Effect,
  Expression,
  compileTest,
} from "./__fixture__.mjs";
import Block from "./block.mjs";
import LoopBody from "./loop-body.mjs";

const { test, done } = compileTest({
  Program,
  Block,
  LoopBody,
  Statement: {
    ...Statement,
    ContinueStatement: (node, _context, site) => {
      assertEqual(node.label, null);
      return [makeBreakStatement(makeEmptyContinueLabel(site.continue))];
    },
    WhileStatement: (node, context, _site) => [
      makeWhileStatement(
        visit(node.test, context, EXPRESSION),
        visit(node.body, context, LOOP_BODY),
      ),
    ],
  },
  Effect,
  Expression,
});

test(`while (123) { 456; }`, `{ while (123) { void 456; } }`);
test(`while (123) { continue; }`, `{ while (123) next: { break next; } }`);

done();
