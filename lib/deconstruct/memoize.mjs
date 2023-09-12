import {
  listScopeWriteEffect,
  makeScopeLoadExpression,
  makeScopeSaveEffect,
} from "./scope/index.mjs";

/**
 * @template S
 * @typedef {{
 *   save: Effect<S>[],
 *   load: Expression<S>,
 * }} Memo
 */

/**
 * @type {<S>(
 *   strict: boolean,
 *   scope: import("./scope/index.mjs").Scope<S>,
 *   variable: Variable,
 *   node: Expression<S>,
 *   serial: S,
 *  ) => Memo<S>}
 */
export const memoize = (strict, scope, variable, node, serial) => {
  if (node.type === "PrimitiveExpression") {
    return {
      save: [],
      load: node,
    };
  } else {
    return {
      save: [makeScopeSaveEffect(strict, scope, variable, node, serial)],
      load: makeScopeLoadExpression(strict, scope, variable, serial),
    };
  }
};

/**
 * @type {<S>(
 *   strict: boolean,
 *   scope: import("./scope/index.mjs").Scope<S>,
 *   variables: {
 *     base: Variable,
 *     meta: Variable,
 *   },
 *   node: Expression<S>,
 *   serial: S,
 * ) => Effect<S>[]}
 */
export const listMemoScopeWriteEffect = (
  strict,
  scope,
  variables,
  node,
  serial,
) => {
  const effects = listScopeWriteEffect(
    strict,
    scope,
    variables.base,
    node,
    serial,
  );
  if (
    effects.length === 1 &&
    effects[0].type === "WriteEffect" &&
    effects[0].right === node
  ) {
    return effects;
  } else {
    return [
      makeScopeSaveEffect(strict, scope, variables.meta, node, serial),
      ...listScopeWriteEffect(
        strict,
        scope,
        variables.base,
        makeScopeLoadExpression(strict, scope, variables.meta, serial),
        serial,
      ),
    ];
  }
};
