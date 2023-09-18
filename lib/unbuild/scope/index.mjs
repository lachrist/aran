import { map, flatMap, hasOwn, DynamicError } from "../../util/index.mjs";

import {
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeReadExpression,
} from "../node.mjs";

import {
  listBindingVariable,
  listBindingDeclareStatement,
  listBindingInitializeStatement,
  makeBindingTypeofExpression,
  makeBindingDiscardExpression,
  makeBindingReadExpression,
  listBindingWriteEffect,
} from "./binding.mjs";

import {
  makeWithExistExpression,
  makeWithReadExpression,
  makeWithTypeofExpression,
  makeWithDiscardExpression,
  makeWithWriteExpression,
} from "./with.mjs";

const {
  Object: { entries: listEntry, fromEntries: reduceEntry },
} = globalThis;

/** @typedef {import("./binding.mjs").Binding} Binding */

/**
 * @template T
 * @typedef {
 *   | { type: "script"; enclave: boolean }
 *   | {
 *     type: "module";
 *     enclave: boolean;
 *     import: Record<estree.Variable, {
 *       source: estree.Source;
 *       specifier: estree.Specifier | null;
 *     }>;
 *     export: Record<estree.Variable, estree.Specifier[]>;
 *   }
 *   | { type: "eval"; enclave: boolean }
 *   | { type: "block"; with: aran.Expression<unbuild.Atom<T>> | null }
 * } FrameContext
 */

/**
 * @template T
 * @typedef {{
 *   root: Binding | null;
 *   script: boolean;
 *   static: Record<estree.Variable, Binding>;
 *   dynamic: unbuild.Variable | null;
 * }} Frame
 */

/**
 * @template T
 * @typedef {{
 *   frame: Frame<T>;
 *   parent: Scope<T> | null;
 * }} Scope
 */

///////////////
// makeFrame //
///////////////

/**
 * @type {<T>(
 *   strict: boolean,
 *   kind: aran.VariableKind,
 *   variable: estree.Variable,
 *   context: FrameContext<T>,
 * ) => Binding}
 */
const makeBinding = (strict, kind, variable, context) => {
  if (context.type === "script") {
    if (context.enclave) {
      return {
        type: "external",
        kind,
      };
    } else {
      if (kind === "var") {
        return { type: "global" };
      } else {
        return {
          type: "hidden",
          writable: kind !== "const",
        };
      }
    }
  } else if (context.type === "eval") {
    if (strict || kind !== "var") {
      return {
        type: "regular",
        deadzone: kind !== "var",
        writable: kind !== "const",
        exports: [],
      };
    } else {
      if (context.enclave) {
        return {
          type: "external",
          kind: "var",
        };
      } else {
        return { type: "global" };
      }
    }
  } else if (context.type === "module") {
    if (hasOwn(context.import, variable)) {
      return {
        type: "import",
        ...context.import[variable],
      };
    } else {
      return {
        type: "regular",
        deadzone: kind !== "var",
        writable: kind !== "const",
        exports: hasOwn(context.export, variable)
          ? context.export[variable]
          : [],
      };
    }
  } else {
    return {
      type: "regular",
      deadzone: kind !== "var",
      writable: kind !== "const",
      exports: [],
    };
  }
};

/**
 * @type {<T>(
 *   strict: boolean,
 *   kinds: Record<estree.Variable, aran.VariableKind>,
 *   context: FrameContext<T>,
 * ) => Frame<T>}
 */
const makeFrame = (strict, kinds, context) => ({
  root:
    context.type === "block"
      ? null
      : { type: "missing", enclave: context.enclave },
  script: context.type === "script",
  static: reduceEntry(
    map(
      /** @type {[estree.Variable, aran.VariableKind][]} */ (listEntry(kinds)),
      ({ 0: variable, 1: kind }) => [
        variable,
        makeBinding(strict, kind, variable, context),
      ],
    ),
  ),
  dynamic: context.type === "block" ? context.with : null,
});

/**
 * @type {<T>(
 *   strict: boolean,
 *   scope: Scope<T> | null,
 *   kinds: Record<estree.Variable, aran.VariableKind>,
 *   context: FrameContext<T>,
 * ) => Scope<T>}
 */
export const extendScope = (strict, scope, kinds, context) => ({
  frame: makeFrame(strict, kinds, context),
  parent: scope,
});

///////////////////////
// listFrameVariable //
///////////////////////

/** @type {<T>(strict: boolean, scope: Scope<T>) => unbuild.Variable[]} */
export const listScopeVariable = (strict, scope) =>
  flatMap(
    /** @type {[estree.Variable, Binding][]} */ (listEntry(scope.frame.static)),
    ({ 0: variable, 1: binding }) =>
      listBindingVariable(strict, binding, variable),
  );

///////////////////////////////
// makeFrameDeclareStatement //
///////////////////////////////

/**
 * @type {<T>(
 *   strict: boolean,
 *   scope: Scope<T>,
 *   tag: T,
 * ) => aran.Statement<unbuild.Atom<T>>[]}
 */
export const listScopeDeclareStatement = (strict, scope, tag) =>
  flatMap(
    /** @type {[estree.Variable, Binding][]} */ (listEntry(scope.frame.static)),
    ({ 0: variable, 1: binding }) =>
      listBindingDeclareStatement(strict, binding, variable, tag),
  );

///////////////////////////////////////
// makeFrameInitializeStatementArray //
///////////////////////////////////////

/**
 * @type {<T>(
 *   strict: boolean,
 *   scope: Scope<T>,
 *   variable: estree.Variable,
 *   right: unbuild.Variable,
 *   tag: T,
 * ) => aran.Statement<unbuild.Atom<T>>[]}
 */
export const listScopeInitializeStatement = (
  strict,
  scope,
  variable,
  right,
  tag,
) =>
  listBindingInitializeStatement(
    strict,
    scope.frame.static[variable],
    variable,
    // TODO: make optimized version that do require temp variable
    makeReadExpression(right, tag),
    tag,
  );

///////////////////////////////
// makeFrameLookupExpression //
///////////////////////////////

/**
 * @template T
 * @param {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   tag: T,
 * ) => aran.Expression<unbuild.Atom<T>>} makeBindingLookupExpression
 * @param {(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 *   tag: T,
 * ) => aran.Expression<unbuild.Atom<T>>} makeWithLookupExpression
 * @return {(
 *   strict: boolean,
 *   scope: Scope<T>,
 *   variable: estree.Variable,
 *   tag: T,
 * ) => aran.Expression<unbuild.Atom<T>>}
 */
const compileMakeScopeLookupExpresison = (
  makeBindingLookupExpression,
  makeWithLookupExpression,
) => {
  /**
   * @type {(
   *   strict: boolean,
   *   scope: Scope<T>,
   *   variable: estree.Variable,
   *   tag: T,
   * ) => aran.Expression<unbuild.Atom<T>>}
   */
  const makeScopeLookupExpression = (strict, scope, variable, tag) => {
    if (hasOwn(scope.frame.static, variable)) {
      return makeBindingLookupExpression(
        strict,
        scope.frame.static[variable],
        variable,
        tag,
      );
    } else if (scope.parent === null) {
      throw new DynamicError("unbound variable", variable);
    } else {
      const next =
        scope.frame.root === null
          ? makeScopeLookupExpression(strict, scope.parent, variable, tag)
          : makeBindingLookupExpression(
              strict,
              scope.frame.root,
              variable,
              tag,
            );
      if (scope.frame.dynamic === null) {
        return next;
      } else {
        return makeConditionalExpression(
          makeWithExistExpression(strict, scope.frame.dynamic, variable, tag),
          makeWithLookupExpression(strict, scope.frame.dynamic, variable, tag),
          next,
          tag,
        );
      }
    }
  };
  return makeScopeLookupExpression;
};

export const makeScopeReadExpression = compileMakeScopeLookupExpresison(
  makeBindingReadExpression,
  makeWithReadExpression,
);

export const makeScopeTypeofExpression = compileMakeScopeLookupExpresison(
  makeBindingTypeofExpression,
  makeWithTypeofExpression,
);

export const makeScopeDiscardExpression = compileMakeScopeLookupExpresison(
  makeBindingDiscardExpression,
  makeWithDiscardExpression,
);

//////////////////////////
// listScopeWriteEffect //
//////////////////////////

/**
 * @type {<T>(
 *   strict: boolean,
 *   scope: Scope<T>,
 *   variable: estree.Variable,
 *   right: unbuild.Variable,
 *   tag: T,
 * ) => aran.Effect<unbuild.Atom<T>>[]}
 */
export const listScopeWriteEffect = (strict, scope, variable, right, tag) => {
  if (hasOwn(scope.frame.static, variable)) {
    return listBindingWriteEffect(
      strict,
      scope.frame.static[variable],
      variable,
      right,
      tag,
    );
  } else if (scope.parent === null) {
    throw new DynamicError("unbound variable", variable);
  } else {
    const next =
      scope.frame.root === null
        ? listScopeWriteEffect(strict, scope.parent, variable, right, tag)
        : listBindingWriteEffect(
            strict,
            scope.frame.root,
            variable,
            right,
            tag,
          );
    if (scope.frame.dynamic === null) {
      return next;
    } else {
      return [
        makeConditionalEffect(
          makeWithExistExpression(strict, scope.frame.dynamic, variable, tag),
          [
            makeExpressionEffect(
              makeWithWriteExpression(
                strict,
                scope.frame.dynamic,
                variable,
                right,
                tag,
              ),
              tag,
            ),
          ],
          next,
          tag,
        ),
      ];
    }
  }
};
