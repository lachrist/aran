import { filter, map, removeAll } from "../../util/index.mjs";

import {
  makeClosureBlock,
  makeControlBlock,
  makePseudoBlock,
} from "../../node.mjs";

import { escapeStatement, escapeExpression } from "./escape.mjs";

import { collectFreeVariable } from "./collect.mjs";

import { isMetaVariable } from "../mangle.mjs";

/**
 * @type {<T>(
 *   labels: unbuild.Label[],
 *   free_meta_variable_array: unbuild.Variable[],
 *   bound_variable_array: unbuild.Variable[],
 *   statements: aran.Statement<unbuild.Atom<T>>[],
 *   tag: T,
 * ) => aran.ControlBlock<unbuild.Atom<T>>}
 */
export const makeLayerControlBlock = (
  labels,
  bound_variable_array,
  free_meta_variable_array,
  statements,
  tag,
) =>
  makeControlBlock(
    labels,
    [
      ...bound_variable_array,
      ...removeAll(
        filter(collectFreeVariable(statements), isMetaVariable),
        free_meta_variable_array,
      ),
    ],
    statements,
    tag,
  );

/**
 * @type {<T>(
 *   free_meta_variable_array: unbuild.Variable[],
 *   bound_variable_array: unbuild.Variable[],
 *   statements: aran.Statement<unbuild.Atom<T>>[],
 *   completion: aran.Expression<unbuild.Atom<T>>,
 *   tag: T,
 * ) => aran.ClosureBlock<unbuild.Atom<T>>}
 */
export const makeLayerClosureBlock = (
  free_meta_variable_array,
  bound_variable_array,
  statements,
  completion,
  tag,
) =>
  makeClosureBlock(
    [
      ...bound_variable_array,
      ...removeAll(
        filter(collectFreeVariable(statements), isMetaVariable),
        free_meta_variable_array,
      ),
    ],
    statements,
    completion,
    tag,
  );

/**
 * @type {<T>(
 *   escape: estree.Variable,
 *   statements: aran.Statement<unbuild.Atom<T>>[],
 *   completion: aran.Expression<unbuild.Atom<T>>,
 *   tag: T,
 * ) => aran.PseudoBlock<unbuild.Atom<T>>}
 */
export const makeLayerPseudoBlock = (escape, statements, completion, tag) => {
  const variables = collectFreeVariable([...statements, completion]);
  return makePseudoBlock(
    map(statements, (statement) =>
      escapeStatement(statement, escape, variables),
    ),
    escapeExpression(completion, escape, variables),
    tag,
  );
};
