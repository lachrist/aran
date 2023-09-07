import { map, flatMap, hasOwn, DynamicError } from "../../util/index.mjs";

import {
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
} from "../../syntax.mjs";

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

import {
  listMetaVariable,
  makeMetaLoadExpression,
  makeMetaSaveEffect,
} from "./meta.mjs";

const {
  Object: { entries: listEntry, fromEntries: reduceEntry },
} = globalThis;

export { unmangleVariable } from "./variable.mjs";

///////////////
// makeFrame //
///////////////

/**
 * @type {<T>(
 *   strict: boolean,
 *   kind: VariableKind,
 *   variable: Variable,
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
 *   kinds: Record<Variable, VariableKind>,
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
      /** @type {[Variable, VariableKind][]} */ (listEntry(kinds)),
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
 *   kinds: Record<string, VariableKind>,
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

/** @type {<T>(strict: boolean, scope: Scope<T>, nodes: Statement<T>[]) => string[]} */
export const listScopeVariable = (strict, scope, nodes) => [
  ...flatMap(
    /** @type {[Variable, Binding][]} */ (listEntry(scope.frame.static)),
    ({ 0: variable, 1: binding }) =>
      listBindingVariable(strict, binding, variable),
  ),
  ...flatMap(nodes, listMetaVariable),
];

///////////////////////////////
// makeFrameDeclareStatement //
///////////////////////////////

/** @type {<T>(strict: boolean, scope: Scope<T>, tag: T) => Statement<T>[]} */
export const listScopeDeclareStatement = (strict, scope, tag) =>
  flatMap(
    /** @type {[Variable, Binding][]} */ (listEntry(scope.frame.static)),
    ({ 0: variable, 1: binding }) =>
      listBindingDeclareStatement(strict, binding, variable, tag),
  );

///////////////////////////////////////
// makeFrameInitializeStatementArray //
///////////////////////////////////////

/** @type {<T>(strict: boolean, scope: Scope<T>, variable: Variable, right: Expression<T>, tag: T) => Statement<T>[]} */
export const listScopeInitializeStatement = (
  strict,
  scope,
  variable,
  expression,
  tag,
) =>
  listBindingInitializeStatement(
    strict,
    scope.frame.static[variable],
    variable,
    expression,
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
 *   variable: Variable,
 *   tag: T,
 * ) => Expression<T>} makeBindingLookupExpression
 * @param {(
 *   strict: boolean,
 *   dynamic: Expression<T>,
 *   variable: Variable,
 *   tag: T,
 * ) => Expression<T>} makeWithLookupExpression
 * @return {(
 *   strict: boolean,
 *   scope: Scope<T>,
 *   variable: Variable,
 *   tag: T,
 * ) => Expression<T>}
 */
const compileMakeScopeLookupExpresison = (
  makeBindingLookupExpression,
  makeWithLookupExpression,
) => {
  /** @type {(strict: boolean, scope: Scope<T>, variable: Variable, tag: T) => Expression<T>} */
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
// makeFrameWriteEffect //
//////////////////////////

/**
 * @type {<T>(
 *   strict: boolean,
 *   scope: Scope<T>,
 *   variable: Variable,
 *   pure: Expression<T>,
 *   tag: T,
 * ) => Effect<T>[]}
 */
export const listFrameWriteEffect = (strict, scope, variable, pure, tag) => {
  if (hasOwn(scope.frame.static, variable)) {
    return listBindingWriteEffect(
      strict,
      scope.frame.static[variable],
      variable,
      pure,
      tag,
    );
  } else if (scope.parent === null) {
    throw new DynamicError("unbound variable", variable);
  } else {
    const next =
      scope.frame.root === null
        ? listFrameWriteEffect(strict, scope.parent, variable, pure, tag)
        : listBindingWriteEffect(strict, scope.frame.root, variable, pure, tag);
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
                pure,
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

/////////////////////////
// makeScopeSaveEffect //
/////////////////////////

/**
 * @type {<T>(
 *   strict: boolean,
 *   scope: Scope<T>,
 *   variable: Variable,
 *   expression: Expression<T>,
 *   tag: T,
 * ) => Effect<T>}
 */
export const makeScopeSaveEffect = (strict, scope, variable, expression, tag) =>
  makeMetaSaveEffect(strict, scope.frame.script, variable, expression, tag);

/////////////////////////////
// makeScopeLoadExpression //
/////////////////////////////

/**
 * @type {<T>(
 *   strict: boolean,
 *   scope: Scope<T>,
 *   variable: Variable,
 *   tag: T,
 * ) => Expression<T>}
 */
export const makeScopeLoadExpression = (strict, scope, variable, tag) =>
  makeMetaLoadExpression(strict, scope.frame.script, variable, tag);
