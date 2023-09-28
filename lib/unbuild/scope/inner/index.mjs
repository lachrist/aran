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
 * @typedef {{
 *   root: Binding | null;
 *   script: boolean;
 *   static: Record<estree.Variable, Binding>;
 *   dynamic: unbuild.Variable | null;
 * }} Frame
 */

/**
 * @typedef {null | {
 *   frame: Frame;
 *   parent: Scope;
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
 * @type {(
 *   strict: boolean,
 *   kind: estree.VariableKind,
 *   variable: estree.Variable,
 *   frame: FrameMaterial,
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
 * @type {(
 *   strict: boolean,
 *   frame: FrameMaterial,
 * ) => Frame}
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
 * @type {(
 *   context: {
 *     strict: boolean,
 *     scope: Scope,
 *   },
 *   frame: FrameMaterial,
 * ) => Scope & {}}
 */
export const extendScope = ({ strict, scope }, frame) => ({
  frame: makeFrame(strict, frame),
  parent: scope,
});

///////////////////////
// listScopeVariable //
///////////////////////

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     scope: Scope & {},
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
 * @type {<S>(
 *   context: {
 *     strict: boolean,
 *     scope: Scope & {},
 *   },
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const listScopeDeclareStatement = ({ strict, scope }, serial) =>
  flatMap(
    /** @type {[estree.Variable, Binding][]} */ (listEntry(scope.frame.static)),
    ({ 0: variable, 1: binding }) =>
      listBindingDeclareStatement(strict, binding, variable, serial),
  );

///////////////////////////////////////
// makeScopeInitializeStatementArray //
///////////////////////////////////////

/**
 * @type {<S>(
 *   context: {
 *     strict: boolean,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const listScopeInitializeStatement = (
  { strict, scope },
  variable,
  right,
  serial,
) => {
  if (scope === null) {
    throw new DynamicError("unbound variable", variable);
  } else if (hasOwn(scope.frame.static, variable)) {
    return listBindingInitializeStatement(
      strict,
      scope.frame.static[variable],
      variable,
      // TODO: make optimized version that do require temp variable
      makeReadExpression(right, serial),
      serial,
    );
  } else {
    return listScopeInitializeStatement(
      { strict, scope },
      variable,
      right,
      serial,
    );
  }
};

///////////////////////////////
// makeScopeLookupExpression //
///////////////////////////////

/**
 * @template S
 * @param {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>} makeBindingLookupExpression
 * @param {(
 *   strict: boolean,
 *   frame: unbuild.Variable,
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>} makeWithLookupExpression
 * @return {(
 *   context: {
 *     strict: boolean,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
const compileMakeScopeLookupExpresison = (
  makeBindingLookupExpression,
  makeWithLookupExpression,
) => {
  /**
   * @type {(
   *   context: {
   *     strict: boolean,
   *     scope: Scope,
   *   },
   *   variable: estree.Variable,
   *   serial: S,
   * ) => aran.Expression<unbuild.Atom<S>>}
   */
  const makeScopeLookupExpression = ({ strict, scope }, variable, serial) => {
    if (scope === null) {
      throw new DynamicError("unbound variable", variable);
    } else if (hasOwn(scope.frame.static, variable)) {
      return makeBindingLookupExpression(
        strict,
        scope.frame.static[variable],
        variable,
        serial,
      );
    } else {
      const next =
        scope.frame.root === null
          ? makeScopeLookupExpression(
              { strict, scope: scope.parent },
              variable,
              serial,
            )
          : makeBindingLookupExpression(
              strict,
              scope.frame.root,
              variable,
              serial,
            );
      if (scope.frame.dynamic === null) {
        return next;
      } else {
        return makeConditionalExpression(
          makeWithExistExpression(
            strict,
            scope.frame.dynamic,
            variable,
            serial,
          ),
          makeWithLookupExpression(
            strict,
            scope.frame.dynamic,
            variable,
            serial,
          ),
          next,
          serial,
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
 * @type {<S>(
 *   context: {
 *     strict: boolean,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   serial: S,
 * ) => aran.Effect<unbuild.Atom<S>>[]}
 */
export const listScopeWriteEffect = (
  { strict, scope },
  variable,
  right,
  serial,
) => {
  if (scope === null) {
    throw new DynamicError("unbound variable", variable);
  } else if (hasOwn(scope.frame.static, variable)) {
    return listBindingWriteEffect(
      strict,
      scope.frame.static[variable],
      variable,
      right,
      serial,
    );
  } else {
    const next =
      scope.frame.root === null
        ? listScopeWriteEffect(
            { strict, scope: scope.parent },
            variable,
            right,
            serial,
          )
        : listBindingWriteEffect(
            strict,
            scope.frame.root,
            variable,
            right,
            serial,
          );
    if (scope.frame.dynamic === null) {
      return next;
    } else {
      return [
        makeConditionalEffect(
          makeWithExistExpression(
            strict,
            scope.frame.dynamic,
            variable,
            serial,
          ),
          [
            makeExpressionEffect(
              makeWithWriteExpression(
                strict,
                scope.frame.dynamic,
                variable,
                right,
                serial,
              ),
              serial,
            ),
          ],
          next,
          serial,
        ),
      ];
    }
  }
};
