import { LOOP } from "../site.mjs";
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
import Loop from "./loop.mjs";

const { test, done } = compileTest({
  Program,
  Block,
  LoopBody,
  Loop,
  Statement: {
    ...Statement,
    WhileStatement: (node, context, _site) => visit(node, context, LOOP),
  },
  Effect,
  Expression,
});

test(`while (123) { 456; }`, `{ while (123) { void 456; } }`);

done();
