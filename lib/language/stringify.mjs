import { stringifyPrettier } from "./prettier.mjs";

import {
  revertExpression,
  revertEffect,
  revertLink,
  revertClosureBlock,
  revertControlBlock,
  revertPseudoBlock,
  revertStatement,
  revertProgram,
} from "./revert.mjs";

/** @type {(program: Program<unknown>) => string} */
export const stringifyProgram = (program) =>
  stringifyPrettier(revertProgram(program));

/** @type {(node: PseudoBlock<unknown>) => string} */
export const stringifyPseudoBlock = (node) =>
  stringifyPrettier({
    type: "Program",
    sourceType: "module",
    body: revertPseudoBlock(node),
  });

/** @type {<N>(revert: (node: N) => EstreeProgramStatement) => (node: N) => string} */
const compileRootStringify = (revert) => (node) =>
  stringifyPrettier({
    type: "Program",
    sourceType: "module",
    body: [revert(node)],
  });

/** @type {<N>(revert: (node: N) => EstreeExpression) => (node: N) => string} */
const compileDeepStringify = (revert) => (node) =>
  stringifyPrettier({
    type: "Program",
    sourceType: "module",
    body: [
      {
        type: "ExpressionStatement",
        expression: revert(node),
      },
    ],
  });

export const stringifyControlBlock = compileRootStringify(revertControlBlock);

export const stringifyClosureBlock = compileRootStringify(revertClosureBlock);

export const stringifyLink = compileRootStringify(revertLink);

export const stringifyStatement = compileRootStringify(revertStatement);

export const stringifyEffect = compileDeepStringify(revertEffect);

export const stringifyExpression = compileDeepStringify(revertExpression);
