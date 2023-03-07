/* c8 ignore start */
import { map } from "array-lite";
import { partial_x } from "../../util/index.mjs";
import { annotateNode } from "../../ast/index.mjs";

export const annotate = annotateNode;

export const annotateArray = (nodes, serial) =>
  map(nodes, partial_x(annotate, serial));

export const annotateCallee = (
  { callee: expression1, this: expression2 },
  serial,
) => ({
  callee: annotate(expression1, serial),
  this: annotate(expression2, serial),
});

export const annotateMacro = (
  { setup: effects, value: expression },
  serial,
) => ({
  setup: annotateArray(effects, serial),
  value: annotate(expression, serial),
});

export const annotateProperty = (
  { key: expression1, value: expression2 },
  serial,
) => ({
  key: annotate(expression1, serial),
  value: annotate(expression2, serial),
});
