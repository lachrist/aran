import { flatMap, AranTypeError } from "../../../util/index.mjs";
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

const { Error } = globalThis;

/** @typedef {import("./binding/index.mjs").Binding} Binding */
/** @typedef {import("./binding/index.mjs").MissingBinding} MissingBinding */
/** @typedef {import("./binding/index.mjs").PresentBinding} PresentBinding */
/** @typedef {import("./frame.mjs").NodeFrame} NodeFrame */
/** @typedef {import("./frame.mjs").RootFrame} RootFrame */
/** @typedef {import("./frame.mjs").Frame} Frame */

/**
 * @typedef {{
 *   type: "root",
 *   frame: RootFrame,
 * } | {
 *   type: "static",
 *   frame: NodeFrame,
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

/**
 * @type {(
 *   context: {},
 *   frame: RootFrame,
 * ) => Scope & { type: "root" }}
 */
export const makeRootScope = (_context, frame) => ({ type: "root", frame });

/**
 * @type {(
 *   context: {
 *     scope: Scope,
 *   },
 *   frame: NodeFrame,
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
 *     root: import("../../context.d.ts").Root,
 *     scope: Scope,
 *   },
 * ) => unbuild.Variable[]}
 */
export const listScopeVariable = ({ root, scope }) => {
  switch (scope.type) {
    case "static": {
      return flatMap(listFrameBinding({}, scope.frame), (binding) =>
        listBindingVariable({ root }, binding),
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
 *     root: import("../../context.d.ts").Root,
 *     scope: Scope,
 *   },
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listScopeDeclareStatement = ({ mode, root, scope }, path) => {
  if (scope.type === "static" || scope.type === "root") {
    return flatMap(listFrameBinding({}, scope.frame), (binding) =>
      listBindingDeclareStatement({ mode, root }, binding, path),
    );
  } else if (scope.type === "dynamic") {
    return [];
  } else {
    throw new AranTypeError("invalid scope", scope);
  }
};

//////////////////////////////////
// listScopeInitializeStatement //
//////////////////////////////////

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../../context.d.ts").Root,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listScopeInitializeStatement = (
  { mode, root, scope },
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
      const binding = makePresentBinding({}, scope.frame, variable);
      return binding !== null
        ? listBindingInitializeStatement({ mode, root }, binding, right, path)
        : listScopeInitializeStatement(
            { mode, root, scope: scope.parent },
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
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../../context.d.ts").Root,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 *   makeBindingLookupExpression: (
 *     context: {
 *       mode: "strict" | "sloppy",
 *       root: import("../../context.d.ts").Root,
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
      const binding = makePresentBinding({}, scope.frame, variable);
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
 *     root: import("../../context.d.ts").Root,
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
 *     root: import("../../context.d.ts").Root,
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
 *     root: import("../../context.d.ts").Root,
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
 *     root: import("../../context.d.ts").Root,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listScopeWriteEffect = (
  { mode, root, scope },
  variable,
  right,
  path,
  meta,
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
      const binding = makePresentBinding({}, scope.frame, variable);
      return binding !== null
        ? listBindingWriteEffect({ mode, root }, binding, right, path, meta)
        : listScopeWriteEffect(
            { mode, root, scope: scope.parent },
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
