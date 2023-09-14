import { map, removeAll } from "../../util/index.mjs";

// These should never be accessed outside this file.
import {
  makeClosureBlock,
  makeControlBlock,
  makePseudoBlock,
  makeReadExpression,
  makeWriteEffect,
} from "../../node.mjs";

import { escapeStatement, escapeExpression } from "./escape.mjs";

import { collectFreeMetaVariable } from "./collect.mjs";

/** @typedef {import("./variable.mjs").MetaVariable} MetaVariable */

/** @typedef {import("./variable.mjs").BaseVariable} BaseVariable */

export const makeBaseReadExpression =
  /** @type {<T>(variable: BaseVariable, tag: T) => Expression<T>} */ (
    /** @type {unknown} */ (makeReadExpression)
  );

export const makeBaseWriteEffect =
  /** @type {<T>(variable: BaseVariable, right: Expression<T>, tag: T) => Effect<T>} */ (
    /** @type {unknown} */ (makeWriteEffect)
  );

export const makeMetaReadExpression =
  /** @type {<T>(variable: MetaVariable, tag: T) => Expression<T>} */ (
    /** @type {unknown} */ (makeReadExpression)
  );

export const makeMetaWriteEffect =
  /** @type {<T>(variable: MetaVariable, right: Expression<T>, tag: T) => Effect<T>} */ (
    /** @type {unknown} */ (makeWriteEffect)
  );

/**
 * @type {<T>(
 *   labels: Label[],
 *   bound_base_variable_array: BaseVariable[],
 *   free_meta_variable_array: MetaVariable[],
 *   statements: Statement<T>[],
 *   tag: T,
 * ) => ControlBlock<T>}
 */
export const makeLayerControlBlock = (
  labels,
  bound_base_variable_array,
  free_meta_variable_array,
  statements,
  tag,
) =>
  makeControlBlock(
    labels,
    /** @type {Variable[]} */ (
      /** @type {string[]} */ ([
        ...bound_base_variable_array,
        ...removeAll(
          collectFreeMetaVariable(statements),
          free_meta_variable_array,
        ),
      ])
    ),
    statements,
    tag,
  );

/**
 * @type {<T>(
 *   free_meta_variable_array: MetaVariable[],
 *   bound_base_variable_array: BaseVariable[],
 *   statements: Statement<T>[],
 *   completion: Expression<T>,
 *   tag: T,
 * ) => ClosureBlock<T>}
 */
export const makeLayerClosureBlock = (
  free_meta_variable_array,
  bound_base_variable_array,
  statements,
  completion,
  tag,
) =>
  makeClosureBlock(
    /** @type {Variable[]} */ (
      /** @type {string[]} */ ([
        ...bound_base_variable_array,
        ...removeAll(
          collectFreeMetaVariable(statements),
          free_meta_variable_array,
        ),
      ])
    ),
    statements,
    completion,
    tag,
  );

/**
 * @type {<T>(
 *   escape: string,
 *   statements: Statement<T>[],
 *   completion: Expression<T>,
 *   tag: T,
 * ) => PseudoBlock<T>}
 */
export const makeLayerPseudoBlock = (escape, statements, completion, tag) => {
  const variables = collectFreeMetaVariable([...statements, completion]);
  return makePseudoBlock(
    map(statements, (statement) =>
      escapeStatement(statement, escape, variables),
    ),
    escapeExpression(completion, escape, variables),
    tag,
  );
};
