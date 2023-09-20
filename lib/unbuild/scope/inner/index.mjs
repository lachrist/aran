import { map, flatMap, hasOwn, DynamicError } from "../../../util/index.mjs";

import {
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeReadExpression,
} from "../../node.mjs";

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
 * @typedef {(
 *   | {
 *     type: "script";
 *     kinds: Record<estree.Variable, estree.VariableKind>;
 *     enclave: boolean
 *   }
 *   | {
 *     type: "module";
 *     kinds: Record<estree.Variable, estree.VariableKind>;
 *     enclave: boolean;
 *     import: Record<estree.Variable, {
 *       source: estree.Source;
 *       specifier: estree.Specifier | null;
 *     }>;
 *     export: Record<estree.Variable, estree.Specifier[]>;
 *   }
 *   | {
 *     type: "eval";
 *     kinds: Record<estree.Variable, estree.VariableKind>;
 *     enclave: boolean;
 *   }
 *   | {
 *     type: "block";
 *     kinds: Record<estree.Variable, estree.VariableKind>;
 *     with: unbuild.Variable | null;
 *   }
 * )} FrameMaterial
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

/////////////////
// extendScope //
/////////////////

/** @type {Record<estree.VariableKind, aran.VariableKind>} */
const KINDS = {
  var: "var",
  function: "var",
  let: "let",
  const: "const",
  class: "let",
};

/** @type {(kind: estree.VariableKind) => boolean} */
const hasDeadzone = (kind) =>
  kind === "let" || kind === "const" || kind === "class";

/** @type {(kind: estree.VariableKind) => boolean} */
const isClosureScoped = (kind) => kind === "function" || kind === "class";

/** @type {(kind: estree.VariableKind) => boolean} */
const isWritable = (kind) => kind !== "const";

/**
 * @type {<T>(
 *   strict: boolean,
 *   kind: estree.VariableKind,
 *   variable: estree.Variable,
 *   frame: FrameMaterial<T>,
 * ) => Binding}
 */
const makeBinding = (strict, kind, variable, frame) => {
  if (frame.type === "script") {
    if (frame.enclave) {
      return {
        type: "external",
        kind: KINDS[kind],
      };
    } else {
      if (isClosureScoped(kind)) {
        return { type: "global" };
      } else {
        return {
          type: "hidden",
          writable: isWritable(kind),
        };
      }
    }
  } else if (frame.type === "eval") {
    if (strict || !isClosureScoped(kind)) {
      return {
        type: "regular",
        deadzone: hasDeadzone(kind),
        writable: isWritable(kind),
        exports: [],
      };
    } else {
      if (frame.enclave) {
        return {
          type: "external",
          kind: "var",
        };
      } else {
        return { type: "global" };
      }
    }
  } else if (frame.type === "module") {
    if (hasOwn(frame.import, variable)) {
      return {
        type: "import",
        ...frame.import[variable],
      };
    } else {
      return {
        type: "regular",
        deadzone: hasDeadzone(kind),
        writable: isWritable(kind),
        exports: hasOwn(frame.export, variable) ? frame.export[variable] : [],
      };
    }
  } else {
    return {
      type: "regular",
      deadzone: hasDeadzone(kind),
      writable: isWritable(kind),
      exports: [],
    };
  }
};

/**
 * @type {<T>(
 *   strict: boolean,
 *   frame: FrameMaterial<T>,
 * ) => Frame<T>}
 */
const makeFrame = (strict, frame) => ({
  root:
    frame.type === "block" ? null : { type: "missing", enclave: frame.enclave },
  script: frame.type === "script",
  static: reduceEntry(
    map(
      /** @type {[estree.Variable, estree.VariableKind][]} */ (
        listEntry(frame.kinds)
      ),
      ({ 0: variable, 1: kind }) => [
        variable,
        makeBinding(strict, kind, variable, frame),
      ],
    ),
  ),
  dynamic: frame.type === "block" ? frame.with : null,
});

/**
 * @type {<T>(
 *   context: {
 *     strict: boolean,
 *     scope: Scope<T> | null,
 *   },
 *   frame: FrameMaterial<T>,
 * ) => Scope<T>}
 */
export const extendScope = ({ strict, scope }, frame) => ({
  frame: makeFrame(strict, frame),
  parent: scope,
});

///////////////////////
// listScopeVariable //
///////////////////////

/**
 * @type {<T>(
 *   context: {
 *     strict: boolean,
 *     scope: Scope<T>,
 *   },
 * ) => unbuild.Variable[]}
 */
export const listScopeVariable = ({ strict, scope }) =>
  flatMap(
    /** @type {[estree.Variable, Binding][]} */ (listEntry(scope.frame.static)),
    ({ 0: variable, 1: binding }) =>
      listBindingVariable(strict, binding, variable),
  );

///////////////////////////////
// makeScopeeclareStatement //
///////////////////////////////

/**
 * @type {<T>(
 *   context: {
 *     strict: boolean,
 *     scope: Scope<T>,
 *   },
 *   tag: T,
 * ) => aran.Statement<unbuild.Atom<T>>[]}
 */
export const listScopeDeclareStatement = ({ strict, scope }, tag) =>
  flatMap(
    /** @type {[estree.Variable, Binding][]} */ (listEntry(scope.frame.static)),
    ({ 0: variable, 1: binding }) =>
      listBindingDeclareStatement(strict, binding, variable, tag),
  );

///////////////////////////////////////
// makeScopeInitializeStatementArray //
///////////////////////////////////////

/**
 * @type {<T>(
 *   context: {
 *     strict: boolean,
 *     scope: Scope<T>,
 *   },
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   tag: T,
 * ) => aran.Statement<unbuild.Atom<T>>[]}
 */
export const listScopeInitializeStatement = (
  { strict, scope },
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
// makeScopeLookupExpression //
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
 *   context: {
 *     strict: boolean,
 *     scope: Scope<T>,
 *   },
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
   *   context: {
   *     strict: boolean,
   *     scope: Scope<T>,
   *   },
   *   variable: estree.Variable,
   *   tag: T,
   * ) => aran.Expression<unbuild.Atom<T>>}
   */
  const makeScopeLookupExpression = ({ strict, scope }, variable, tag) => {
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
          ? makeScopeLookupExpression(
              { strict, scope: scope.parent },
              variable,
              tag,
            )
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
 *   context: {
 *     strict: boolean,
 *     scope: Scope<T>,
 *   },
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   tag: T,
 * ) => aran.Effect<unbuild.Atom<T>>[]}
 */
export const listScopeWriteEffect = (
  { strict, scope },
  variable,
  right,
  tag,
) => {
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
        ? listScopeWriteEffect(
            { strict, scope: scope.parent },
            variable,
            right,
            tag,
          )
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
