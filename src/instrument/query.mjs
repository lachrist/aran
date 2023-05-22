/* eslint-disable no-use-before-define */

import {
  filterOut,
  flatMap,
  includes,
  isDuplicate,
  partialx_,
} from "../util/index.mjs";
import { DEFAULT_CLAUSE, dispatchArrayNode0 } from "../node.mjs";
import { getChildren } from "../ast/index.mjs";

const {
  Reflect: { apply },
  WeakMap,
  WeakMap: {
    protoype: { has: hasWeakMap, get: getWeakMap, set: setWeakMap },
  },
} = globalThis;

export const cache = new WeakMap();

const collectBlockFreeVariable = ({ 2: variables, 3: statements }) =>
  filterOut(
    filterOut(flatMap(statements, collectFreeVariable), isDuplicate),
    partialx_(includes, variables),
  );

export const collectFreeVariable = partialx_(dispatchArrayNode0, {
  Block: (block) => {
    if (apply(hasWeakMap, cache, block)) {
      return apply(getWeakMap, cache, block);
    } else {
      const variables = collectBlockFreeVariable(block);
      apply(setWeakMap, cache, block, variables);
      return variables;
    }
  },
  ReadExpression: ({ 1: variable }) => [variable],
  WriteEffect: ({ 1: variable, 2: expression }) => [variable, expression],
  [DEFAULT_CLAUSE]: (node) => flatMap(getChildren(node), collectFreeVariable),
});
