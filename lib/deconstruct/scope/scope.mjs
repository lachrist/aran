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

///////////////
// makeFrame //
///////////////

/**
 * @type {<T>(
 *   strict: boolean,
 *   kind: VariableKind,
 *   variable: string,
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
 *   kinds: Record<string, VariableKind>,
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
    map(listEntry(kinds), ({ 0: variable, 1: kind }) => [
      variable,
      makeBinding(strict, kind, variable, context),
    ]),
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
  ...flatMap(listEntry(scope.frame.static), ({ 0: variable, 1: binding }) =>
    listBindingVariable(strict, binding, variable),
  ),
  ...flatMap(nodes, listMetaVariable),
];

///////////////////////////////
// makeFrameDeclareStatement //
///////////////////////////////

/**
 * @template T
 * @param {boolean} strict
 * @param {Scope<T>} scope
 * @return {Statement<T>[]}
 */
export const listScopeDeclareStatement = (strict, scope) =>
  flatMap(listEntry(scope.frame.static), ({ 0: variable, 1: binding }) =>
    listBindingDeclareStatement(strict, binding, variable),
  );

///////////////////////////////////////
// makeFrameInitializeStatementArray //
///////////////////////////////////////

/**
 * @template T
 * @param {boolean} strict
 * @param {Scope<T>} scope
 * @param {string} variable
 * @param {Expression<T>} expression
 * @return {Statement<T>[]}
 */
export const listScopeInitializeStatement = (
  strict,
  scope,
  variable,
  expression,
) =>
  listBindingInitializeStatement(
    strict,
    scope.frame.static[variable],
    variable,
    expression,
  );

///////////////////////////////
// makeFrameLookupExpression //
///////////////////////////////

/**
 * @template T
 * @param {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: string,
 * ) => Expression<T>} makeBindingLookupExpression
 * @param {(
 *   strict: boolean,
 *   dynamic: Expression<T>,
 *   variable: string,
 * ) => Expression<T>} makeWithLookupExpression
 * @return {(
 *   strict: boolean,
 *   scope: Scope<T>,
 *   variable: string,
 * ) => Expression<T>}
 */
const compileMakeScopeLookupExpresison = (
  makeBindingLookupExpression,
  makeWithLookupExpression,
) => {
  /** @type {(strict: boolean, scope: Scope<T>, variable: string) => Expression<T>} */
  const makeScopeLookupExpression = (strict, scope, variable) => {
    if (hasOwn(scope.frame.static, variable)) {
      return makeBindingLookupExpression(
        strict,
        scope.frame.static[variable],
        variable,
      );
    } else if (scope.parent === null) {
      throw new DynamicError("unbound variable", variable);
    } else {
      const next =
        scope.frame.root === null
          ? makeScopeLookupExpression(strict, scope.parent, variable)
          : makeBindingLookupExpression(strict, scope.frame.root, variable);
      if (scope.frame.dynamic === null) {
        return next;
      } else {
        return makeConditionalExpression(
          makeWithExistExpression(strict, scope.frame.dynamic, variable),
          makeWithLookupExpression(strict, scope.frame.dynamic, variable),
          next,
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
 * @template T
 * @param {boolean} strict
 * @param {Scope<T>} scope
 * @param {string} variable
 * @param {Expression<T>} pure
 * @return {Effect<T>[]}
 */
export const listFrameWriteEffect = (strict, scope, variable, pure) => {
  if (hasOwn(scope.frame.static, variable)) {
    return listBindingWriteEffect(
      strict,
      scope.frame.static[variable],
      variable,
      pure,
    );
  } else if (scope.parent === null) {
    throw new DynamicError("unbound variable", variable);
  } else {
    const next =
      scope.frame.root === null
        ? listFrameWriteEffect(strict, scope.parent, variable, pure)
        : listBindingWriteEffect(strict, scope.frame.root, variable, pure);
    if (scope.frame.dynamic === null) {
      return next;
    } else {
      return [
        makeConditionalEffect(
          makeWithExistExpression(strict, scope.frame.dynamic, variable),
          [
            makeExpressionEffect(
              makeWithWriteExpression(
                strict,
                scope.frame.dynamic,
                variable,
                pure,
              ),
            ),
          ],
          next,
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
 *   variable: string,
 *   expression: Expression<T>,
 * ) => Effect<T>}
 */
export const makeScopeSaveEffect = (strict, scope, variable, expression) =>
  makeMetaSaveEffect(strict, scope.frame.script, variable, expression);

/////////////////////////////
// makeScopeLoadExpression //
/////////////////////////////

/**
 * @type {<T>(
 *   strict: boolean,
 *   scope: Scope<T>,
 *   variable: string,
 * ) => Expression<T>}
 */
export const makeScopeLoadExpression = (strict, scope, variable) =>
  makeMetaLoadExpression(strict, scope.frame.script, variable);
