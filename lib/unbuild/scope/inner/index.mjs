import { flatMap } from "../../../util/index.mjs";
import { AranError, AranTypeError } from "../../../error.mjs";
import {
  listInitCacheEffect,
  makeReadCacheExpression,
  mapSetup,
} from "../../cache.mjs";
import { splitMeta } from "../../mangle.mjs";
import {
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makePrimitiveExpression,
} from "../../node.mjs";
import {
  listFrameBinding,
  makeMissingBinding,
  makePresentBinding,
  listBindingVariable,
  listBindingDeclareStatement,
  listBindingInitializeEffect,
  makeBindingTypeofExpression,
  makeBindingDiscardExpression,
  makeBindingReadExpression,
  listBindingWriteEffect,
} from "./static/index.mjs";
import {
  makeWithExistExpression,
  makeWithReadExpression,
  makeWithTypeofExpression,
  makeWithDiscardExpression,
  makeWithWriteExpression,
} from "./dynamic.mjs";
import {
  cookFakeFrame,
  listInitializeFakeFrameEffect,
  listWriteFakeFrameEffect,
  makeDiscardFakeFrameExpression,
  makeReadFakeFrameExpression,
  makeTypeofFakeFrameExpression,
} from "./fake.mjs";

/** @typedef {import("./static/binding/index.mjs").Binding} Binding */
/** @typedef {import("./static/binding/index.mjs").MissingBinding} MissingBinding */
/** @typedef {import("./static/binding/index.mjs").PresentBinding} PresentBinding */
/** @typedef {import("./static/index.d.ts").StaticFrame} StaticFrame */
/** @typedef {import("./dynamic.d.ts").DynamicFrame} DynamicFrame */
/** @typedef {import("./fake.d.ts").RawFakeFrame} RawFakeFrame */
/** @typedef {import("./fake.d.ts").FakeFrame} FakeFrame */
/** @typedef {import("./index.d.ts").Scope} Scope */
/** @typedef {import("../../cache.mjs").Cache} Cache */
/**
 * @template V
 * @typedef {import("../../cache.mjs").Setup<V>} Setup
 */
/** @typedef {import("../../cache.mjs").WritableCache} WritableCache */
/** @typedef {import("../../program.d.ts").RootProgram} RootProgram */

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
 *   frame: StaticFrame,
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
 *   frame: DynamicFrame,
 * ) => Scope}
 */
export const extendDynamicScope = ({ scope: parent }, frame) => ({
  type: "dynamic",
  frame,
  parent,
});

/**
 * @type {<C extends { scope: Scope }>(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: C,
 *   options: {
 *     frame: RawFakeFrame,
 *   },
 * ) => Setup<C>}
 */
export const extendFakeScope = (site, context, options) =>
  mapSetup(cookFakeFrame(site, context, options), (frame) => ({
    ...context,
    scope: {
      type: "fake",
      frame,
      parent: context.scope,
    },
  }));

///////////////////////
// listScopeVariable //
///////////////////////

/**
 * @type {(
 *   context: {
 *     root: RootProgram,
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
    case "fake": {
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
 *     root: RootProgram,
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
    case "fake": {
      return [];
    }
    case "dynamic": {
      return [];
    }
    default: {
      throw new AranTypeError("invalid scope", scope);
    }
  }
};

///////////////////////////////
// listScopeInitializeEffect //
///////////////////////////////

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: RootProgram,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom> | null,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listScopeInitializeEffect = (
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
      if (binding === null) {
        return listScopeInitializeEffect(
          { mode, root, scope: scope.parent },
          variable,
          right,
          { path, meta },
        );
      } else {
        return listBindingInitializeEffect(
          { mode, root },
          binding,
          right,
          path,
        );
      }
    }
    case "fake": {
      const nodes = listInitializeFakeFrameEffect(
        { path },
        {},
        {
          frame: scope.frame,
          variable,
          right,
        },
      );
      if (nodes === null) {
        return listScopeInitializeEffect(
          { mode, root, scope: scope.parent },
          variable,
          right,
          { path, meta },
        );
      } else {
        return nodes;
      }
    }
    case "dynamic": {
      if (right === null) {
        return [
          makeConditionalEffect(
            makeWithExistExpression({}, scope.frame, variable, path),
            [
              makeExpressionEffect(
                makeWithWriteExpression(
                  { mode },
                  scope.frame,
                  variable,
                  makePrimitiveExpression({ undefined: null }, path),
                  path,
                ),
                path,
              ),
            ],
            listScopeInitializeEffect(
              { mode, root, scope: scope.parent },
              variable,
              right,
              { path, meta },
            ),
            path,
          ),
        ];
      } else {
        const metas = splitMeta(meta, ["right", "next"]);
        return listInitCacheEffect(
          "constant",
          right,
          { path, meta: metas.right },
          (right) => [
            makeConditionalEffect(
              makeWithExistExpression({}, scope.frame, variable, path),
              [
                makeExpressionEffect(
                  makeWithWriteExpression(
                    { mode },
                    scope.frame,
                    variable,
                    makeReadCacheExpression(right, path),
                    path,
                  ),
                  path,
                ),
              ],
              listScopeInitializeEffect(
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
 *     root: RootProgram,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   makeBindingLookupExpression: (
 *     context: {
 *       mode: "strict" | "sloppy",
 *       root: RootProgram,
 *     },
 *     binding: Binding,
 *     site: {
 *       path: unbuild.Path,
 *       meta: unbuild.Meta,
 *     },
 *   ) => aran.Expression<unbuild.Atom>,
 *   makeFakeLookupExpression: (
 *     site: {
 *       path: unbuild.Path,
 *     },
 *     context: {},
 *     options: {
 *       frame: FakeFrame,
 *       variable: estree.Variable,
 *     },
 *   ) => aran.Expression<unbuild.Atom> | null,
 *   makeWithLookupExpression: (
 *     context: {
 *       mode: "strict" | "sloppy",
 *     },
 *     frame: Cache,
 *     variable: estree.Variable,
 *     path: unbuild.Path,
 *   ) => aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeScopeLookupExpression = (
  { mode, root, scope },
  variable,
  { path, meta },
  makeBindingLookupExpression,
  makeFakeLookupExpression,
  makeWithLookupExpression,
) => {
  switch (scope.type) {
    case "root": {
      return makeBindingLookupExpression(
        { mode, root },
        makeMissingBinding(variable),
        { path, meta },
      );
    }
    case "static": {
      const binding = makePresentBinding(
        {},
        scope.parent.type === "root",
        scope.frame,
        variable,
      );
      if (binding === null) {
        return makeScopeLookupExpression(
          { mode, root, scope: scope.parent },
          variable,
          { path, meta },
          makeBindingLookupExpression,
          makeFakeLookupExpression,
          makeWithLookupExpression,
        );
      } else {
        return makeBindingLookupExpression({ mode, root }, binding, {
          path,
          meta,
        });
      }
    }
    case "fake": {
      const node = makeFakeLookupExpression(
        { path },
        {},
        {
          frame: scope.frame,
          variable,
        },
      );
      if (node === null) {
        return makeScopeLookupExpression(
          { mode, root, scope: scope.parent },
          variable,
          { path, meta },
          makeBindingLookupExpression,
          makeFakeLookupExpression,
          makeWithLookupExpression,
        );
      } else {
        return node;
      }
    }
    case "dynamic": {
      return makeConditionalExpression(
        makeWithExistExpression({ mode }, scope.frame, variable, path),
        makeWithLookupExpression({ mode }, scope.frame, variable, path),
        makeScopeLookupExpression(
          { mode, root, scope: scope.parent },
          variable,
          { path, meta },
          makeBindingLookupExpression,
          makeFakeLookupExpression,
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
 *     root: RootProgram,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeReadExpression = (context, variable, site) =>
  makeScopeLookupExpression(
    context,
    variable,
    site,
    makeBindingReadExpression,
    makeReadFakeFrameExpression,
    makeWithReadExpression,
  );

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: RootProgram,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeTypeofExpression = (context, variable, site) =>
  makeScopeLookupExpression(
    context,
    variable,
    site,
    makeBindingTypeofExpression,
    makeTypeofFakeFrameExpression,
    makeWithTypeofExpression,
  );

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: RootProgram,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeDiscardExpression = (context, variable, site) =>
  makeScopeLookupExpression(
    context,
    variable,
    site,
    makeBindingDiscardExpression,
    makeDiscardFakeFrameExpression,
    makeWithDiscardExpression,
  );

//////////////////////////
// listScopeWriteEffect //
//////////////////////////

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: RootProgram,
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
        { path, meta },
      );
    }
    case "static": {
      const binding = makePresentBinding(
        {},
        scope.parent.type === "root",
        scope.frame,
        variable,
      );
      if (binding === null) {
        return listScopeWriteEffect(
          { mode, root, scope: scope.parent },
          variable,
          right,
          { path, meta },
        );
      } else {
        return listBindingWriteEffect({ mode, root }, binding, right, {
          path,
          meta,
        });
      }
    }
    case "fake": {
      const nodes = listWriteFakeFrameEffect(
        { path, meta },
        {},
        {
          frame: scope.frame,
          variable,
          right,
        },
      );
      if (nodes === null) {
        return listScopeWriteEffect(
          { mode, root, scope: scope.parent },
          variable,
          right,
          { path, meta },
        );
      } else {
        return nodes;
      }
    }
    case "dynamic": {
      const metas = splitMeta(meta, ["right", "next"]);
      return listInitCacheEffect(
        "constant",
        right,
        { path, meta: metas.right },
        (right) => [
          makeConditionalEffect(
            makeWithExistExpression(mode, scope.frame, variable, path),
            [
              makeExpressionEffect(
                makeWithWriteExpression(
                  { mode },
                  scope.frame,
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
