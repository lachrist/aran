import { flatMap } from "../../../util/index.mjs";
import { AranError, AranTypeError } from "../../../error.mjs";
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
import {
  listFrameBinding,
  makeMissingBinding,
  makePresentBinding,
} from "./frame.mjs";
import {
  makeWithExistExpression,
  makeWithReadExpression,
  makeWithTypeofExpression,
  makeWithDiscardExpression,
  makeWithWriteExpression,
} from "./with.mjs";

/** @typedef {import("./binding/index.mjs").Binding} Binding */
/** @typedef {import("./binding/index.mjs").MissingBinding} MissingBinding */
/** @typedef {import("./binding/index.mjs").PresentBinding} PresentBinding */
/** @typedef {import("./frame.mjs").Frame} Frame */

/**
 * @typedef {{
 *   type: "root",
 * } | {
 *   type: "static",
 *   frame: Frame,
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

/** @type {Scope} */
export const ROOT_SCOPE = { type: "root" };

/**
 * @type {(
 *   context: {
 *     scope: Scope,
 *   },
 *   frame: Frame,
 * ) => Scope & { type: "static" }}
 */
export const extendStaticScope = ({ scope: parent }, frame) => ({
  type: "static",
  frame,
  parent,
});

/**
 * @type {(
 *   context: {
 *     scope: Scope,
 *   },
 *   with_: import("../../cache.mjs").Cache,
 * ) => Scope}
 */
export const extendDynamicScope = ({ scope: parent }, with_) => ({
  type: "dynamic",
  with: with_,
  parent,
});

///////////////////////
// listScopeVariable //
///////////////////////

/**
 * @type {(
 *   context: {
 *     root: import("../../program.js").RootProgram,
 *     scope: Scope,
 *   },
 * ) => unbuild.Variable[]}
 */
export const listScopeVariable = ({ root, scope }) => {
  switch (scope.type) {
    case "static": {
      return flatMap(
        listFrameBinding({}, scope.parent.type === "root", scope.frame),
        (binding) => listBindingVariable({ root }, binding),
      );
    }
    case "dynamic": {
      return [];
    }
    case "root": {
      return [];
    }
    default: {
      throw new AranTypeError("invalid scope", scope);
    }
  }
};

///////////////////////////////
// listScopeDeclareStatement //
///////////////////////////////

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../../program.js").RootProgram,
 *     scope: Scope,
 *   },
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listScopeDeclareStatement = ({ mode, root, scope }, path) => {
  switch (scope.type) {
    case "root": {
      return [];
    }
    case "static": {
      return flatMap(
        listFrameBinding({}, scope.parent.type === "root", scope.frame),
        (binding) => listBindingDeclareStatement({ mode, root }, binding, path),
      );
    }
    case "dynamic": {
      return [];
    }
    default: {
      throw new AranTypeError("invalid scope", scope);
    }
  }
};

//////////////////////////////////
// listScopeInitializeStatement //
//////////////////////////////////

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../../program.js").RootProgram,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listScopeInitializeStatement = (
  { mode, root, scope },
  variable,
  right,
  { path, meta },
) => {
  switch (scope.type) {
    case "root": {
      throw new AranError("unbound variable initialization", variable);
    }
    case "static": {
      const binding = makePresentBinding(
        {},
        scope.parent.type === "root",
        scope.frame,
        variable,
      );
      return binding !== null
        ? listBindingInitializeStatement({ mode, root }, binding, right, path)
        : listScopeInitializeStatement(
            { mode, root, scope: scope.parent },
            variable,
            right,
            { path, meta },
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
            makeWithExistExpression({}, scope.with, variable, path),
            makeControlBlock(
              [],
              [],
              [
                makeEffectStatement(
                  makeExpressionEffect(
                    makeWithWriteExpression(
                      { mode },
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
                { mode, root, scope: scope.parent },
                variable,
                makeReadCacheExpression(right, path),
                { path, meta: metas.next },
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
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../../program.js").RootProgram,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 *   makeBindingLookupExpression: (
 *     context: {
 *       mode: "strict" | "sloppy",
 *       root: import("../../program.js").RootProgram,
 *     },
 *     binding: Binding,
 *     path: unbuild.Path,
 *   ) => aran.Expression<unbuild.Atom>,
 *   makeWithLookupExpression: (
 *     context: {
 *       mode: "strict" | "sloppy",
 *     },
 *     frame: import("../../cache.mjs").Cache,
 *     variable: estree.Variable,
 *     path: unbuild.Path,
 *   ) => aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeScopeLookupExpression = (
  { mode, root, scope },
  variable,
  path,
  makeBindingLookupExpression,
  makeWithLookupExpression,
) => {
  switch (scope.type) {
    case "root": {
      return makeBindingLookupExpression(
        { mode, root },
        makeMissingBinding(variable),
        path,
      );
    }
    case "static": {
      const binding = makePresentBinding(
        {},
        scope.parent.type === "root",
        scope.frame,
        variable,
      );
      return binding !== null
        ? makeBindingLookupExpression({ mode, root }, binding, path)
        : makeScopeLookupExpression(
            { mode, root, scope: scope.parent },
            variable,
            path,
            makeBindingLookupExpression,
            makeWithLookupExpression,
          );
    }
    case "dynamic": {
      return makeConditionalExpression(
        makeWithExistExpression({ mode }, scope.with, variable, path),
        makeWithLookupExpression({ mode }, scope.with, variable, path),
        makeScopeLookupExpression(
          { mode, root, scope: scope.parent },
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
 *     root: import("../../program.js").RootProgram,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeReadExpression = (context, variable, path) =>
  makeScopeLookupExpression(
    context,
    variable,
    path,
    makeBindingReadExpression,
    makeWithReadExpression,
  );

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../../program.js").RootProgram,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeTypeofExpression = (context, variable, path) =>
  makeScopeLookupExpression(
    context,
    variable,
    path,
    makeBindingTypeofExpression,
    makeWithTypeofExpression,
  );

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../../program.js").RootProgram,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeDiscardExpression = (context, variable, path) =>
  makeScopeLookupExpression(
    context,
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
 *     root: import("../../program.js").RootProgram,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listScopeWriteEffect = (
  { mode, root, scope },
  variable,
  right,
  { path, meta },
) => {
  switch (scope.type) {
    case "root": {
      return listBindingWriteEffect(
        { mode, root },
        makeMissingBinding(variable),
        right,
        path,
        meta,
      );
    }
    case "static": {
      const binding = makePresentBinding(
        {},
        scope.parent.type === "root",
        scope.frame,
        variable,
      );
      return binding !== null
        ? listBindingWriteEffect({ mode, root }, binding, right, path, meta)
        : listScopeWriteEffect(
            { mode, root, scope: scope.parent },
            variable,
            right,
            { path, meta },
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
                  { mode },
                  scope.with,
                  variable,
                  makeReadCacheExpression(right, path),
                  path,
                ),
                path,
              ),
            ],
            listScopeWriteEffect(
              { mode, root, scope: scope.parent },
              variable,
              makeReadCacheExpression(right, path),
              { path, meta: metas.next },
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
