import { map, flatMap, hasOwn, AranTypeError } from "../../../util/index.mjs";
import {
  listInitCacheEffect,
  listInitCacheStatement,
  makeReadCacheExpression,
} from "../../cache.mjs";
import { splitMeta } from "../../mangle.mjs";
import {
  makeConditionalEffect,
  makeConditionalExpression,
  makeControlBlock,
  makeEffectStatement,
  makeExpressionEffect,
  makeIfStatement,
} from "../../node.mjs";
import {
  listBindingVariable,
  listBindingDeclareStatement,
  listBindingInitializeStatement,
  makeBindingTypeofExpression,
  makeBindingDiscardExpression,
  makeBindingReadExpression,
  listBindingWriteEffect,
} from "./binding/index.mjs";
import { makeMissingBinding, makePresentBinding } from "./frame.mjs";
import {
  makeWithExistExpression,
  makeWithReadExpression,
  makeWithTypeofExpression,
  makeWithDiscardExpression,
  makeWithWriteExpression,
} from "./with.mjs";

const {
  Error,
  Object: { entries: listEntry, fromEntries: reduceEntry },
} = globalThis;

/** @typedef {import("./binding/index.mjs").Binding} Binding */
/** @typedef {import("./binding/index.mjs").MissingBinding} MissingBinding */
/** @typedef {import("./binding/index.mjs").PresentBinding} PresentBinding */
/** @typedef {import("./frame.mjs").Frame} Frame */

/**
 * @typedef {{
 *   type: "root",
 *   missing: MissingBinding,
 * } | {
 *   type: "static",
 *   bindings: Record<estree.Variable, PresentBinding>,
 *   parent: Scope,
 * } | {
 *   type: "dynamic",
 *   with: import("../../cache.mjs").Cache,
 *   parent: Scope,
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
  import: "const",
};

/**
 * @type {(
 *   options: {
 *     situ: "global",
 *     enclave: boolean,
 *   } | {
 *     situ: "global" | "local",
 *     enclave: true,
 *   },
 * ) => Scope}
 */
export const makeRootScope = (options) => ({
  type: "root",
  missing: makeMissingBinding(options),
});

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     scope: Scope,
 *   },
 *   frame: Frame,
 * ) => Scope & { type: "static" }}
 */
export const extendStaticScope = ({ mode, scope }, frame) => ({
  type: "static",
  bindings: reduceEntry(
    map(
      /** @type {[estree.Variable, estree.VariableKind][]} */ (
        listEntry(frame.kinds)
      ),
      ({ 0: variable, 1: kind }) => [
        variable,
        makePresentBinding(mode, KINDS[kind], variable, frame),
      ],
    ),
  ),
  parent: scope,
});

/**
 * @type {(
 *   context: {
 *     scope: Scope,
 *   },
 *   frame: import("../../cache.mjs").Cache,
 * ) => Scope}
 */
export const extendDynamicScope = ({ scope }, with_) => ({
  type: "dynamic",
  with: with_,
  parent: scope,
});

///////////////////////
// listScopeVariable //
///////////////////////

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     scope: Scope & { type: "static" },
 *   },
 * ) => unbuild.Variable[]}
 */
export const listScopeVariable = ({ mode, scope }) =>
  flatMap(
    /** @type {[estree.Variable, PresentBinding][]} */ (
      listEntry(scope.bindings)
    ),
    ({ 0: variable, 1: binding }) =>
      listBindingVariable(mode, binding, variable),
  );

///////////////////////////////
// listScopeDeclareStatement //
///////////////////////////////

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     scope: Scope & { type: "static" },
 *   },
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listScopeDeclareStatement = ({ mode, scope }, path) =>
  flatMap(
    /** @type {[estree.Variable, PresentBinding][]} */ (
      listEntry(scope.bindings)
    ),
    ({ 0: variable, 1: binding }) =>
      listBindingDeclareStatement(mode, binding, variable, path),
  );

//////////////////////////////////
// listScopeInitializeStatement //
//////////////////////////////////

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listScopeInitializeStatement = (
  { mode, scope },
  variable,
  right,
  path,
  meta,
) => {
  switch (scope.type) {
    case "root": {
      throw new Error("unbound variable initialization");
    }
    case "static": {
      return hasOwn(scope.bindings, variable)
        ? listBindingInitializeStatement(
            mode,
            scope.bindings[variable],
            variable,
            right,
            path,
          )
        : listScopeInitializeStatement(
            { mode, scope: scope.parent },
            variable,
            right,
            path,
            meta,
          );
    }
    case "dynamic": {
      const metas = splitMeta(meta, ["right", "next"]);
      return listInitCacheStatement(
        "constant",
        right,
        { path, meta: metas.right },
        (right) => [
          makeIfStatement(
            makeWithExistExpression(mode, scope.with, variable, path),
            makeControlBlock(
              [],
              [],
              [
                makeEffectStatement(
                  makeExpressionEffect(
                    makeWithWriteExpression(
                      mode,
                      scope.with,
                      variable,
                      makeReadCacheExpression(right, path),
                      path,
                    ),
                    path,
                  ),
                  path,
                ),
              ],
              path,
            ),
            makeControlBlock(
              [],
              [],
              listScopeInitializeStatement(
                { mode, scope: scope.parent },
                variable,
                makeReadCacheExpression(right, path),
                path,
                metas.next,
              ),
              path,
            ),
            path,
          ),
        ],
      );
    }
    default: {
      throw new AranTypeError("invalid scope", scope);
    }
  }
};

///////////////////////////////
// makeScopeLookupExpression //
///////////////////////////////

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   scope: Scope,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 *   makeBindingLookupExpression: (
 *     mode: "strict" | "sloppy",
 *     binding: Binding,
 *     variable: estree.Variable,
 *     path: unbuild.Path,
 *   ) => aran.Expression<unbuild.Atom>,
 *   makeWithLookupExpression: (
 *     mode: "strict" | "sloppy",
 *     frame: import("../../cache.mjs").Cache,
 *     variable: estree.Variable,
 *     path: unbuild.Path,
 *   ) => aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeScopeLookupExpression = (
  strict,
  scope,
  variable,
  path,
  makeBindingLookupExpression,
  makeWithLookupExpression,
) => {
  switch (scope.type) {
    case "root": {
      return makeBindingLookupExpression(strict, scope.missing, variable, path);
    }
    case "static": {
      return hasOwn(scope.bindings, variable)
        ? makeBindingLookupExpression(
            strict,
            scope.bindings[variable],
            variable,
            path,
          )
        : makeScopeLookupExpression(
            strict,
            scope.parent,
            variable,
            path,
            makeBindingLookupExpression,
            makeWithLookupExpression,
          );
    }
    case "dynamic": {
      return makeConditionalExpression(
        makeWithExistExpression(strict, scope.with, variable, path),
        makeWithLookupExpression(strict, scope.with, variable, path),
        makeScopeLookupExpression(
          strict,
          scope.parent,
          variable,
          path,
          makeBindingLookupExpression,
          makeWithLookupExpression,
        ),
        path,
      );
    }
    default: {
      throw new AranTypeError("invalid scope", scope);
    }
  }
};

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeReadExpression = ({ mode, scope }, variable, path) =>
  makeScopeLookupExpression(
    mode,
    scope,
    variable,
    path,
    makeBindingReadExpression,
    makeWithReadExpression,
  );

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeTypeofExpression = ({ mode, scope }, variable, path) =>
  makeScopeLookupExpression(
    mode,
    scope,
    variable,
    path,
    makeBindingTypeofExpression,
    makeWithTypeofExpression,
  );

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeDiscardExpression = ({ mode, scope }, variable, path) =>
  makeScopeLookupExpression(
    mode,
    scope,
    variable,
    path,
    makeBindingDiscardExpression,
    makeWithDiscardExpression,
  );

//////////////////////////
// listScopeWriteEffect //
//////////////////////////

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listScopeWriteEffect = (
  { mode, scope },
  variable,
  right,
  path,
  meta,
) => {
  switch (scope.type) {
    case "root": {
      return listBindingWriteEffect(
        mode,
        scope.missing,
        variable,
        right,
        path,
        meta,
      );
    }
    case "static": {
      return hasOwn(scope.bindings, variable)
        ? listBindingWriteEffect(
            mode,
            scope.bindings[variable],
            variable,
            right,
            path,
            meta,
          )
        : listScopeWriteEffect(
            { mode, scope: scope.parent },
            variable,
            right,
            path,
            meta,
          );
    }
    case "dynamic": {
      const metas = splitMeta(meta, ["right", "next"]);
      return listInitCacheEffect(
        "constant",
        right,
        { path, meta: metas.right },
        (right) => [
          makeConditionalEffect(
            makeWithExistExpression(mode, scope.with, variable, path),
            [
              makeExpressionEffect(
                makeWithWriteExpression(
                  mode,
                  scope.with,
                  variable,
                  makeReadCacheExpression(right, path),
                  path,
                ),
                path,
              ),
            ],
            listScopeWriteEffect(
              { mode, scope: scope.parent },
              variable,
              makeReadCacheExpression(right, path),
              path,
              metas.next,
            ),
            path,
          ),
        ],
      );
    }
    default: {
      throw new AranTypeError("invalid scope", scope);
    }
  }
};
