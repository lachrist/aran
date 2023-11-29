import { flatMap } from "../../../util/index.mjs";
import { AranError, AranTypeError } from "../../../error.mjs";
import {
  listInitCacheEffect,
  makeReadCacheExpression,
  mapSetup,
} from "../../cache.mjs";
import { splitMeta } from "../../mangle.mjs";
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
  makeWithReadExpression,
  makeWithTypeofExpression,
  makeWithDiscardExpression,
  listWithWriteEffect,
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
  context,
  variable,
  right,
  { path, meta },
) => {
  switch (context.scope.type) {
    case "root": {
      throw new AranError("unbound variable initialization", variable);
    }
    case "static": {
      const binding = makePresentBinding(
        {},
        context.scope.parent.type === "root",
        context.scope.frame,
        variable,
      );
      if (binding === null) {
        return listScopeInitializeEffect(
          { ...context, scope: context.scope.parent },
          variable,
          right,
          { path, meta },
        );
      } else {
        return listBindingInitializeEffect(context, binding, right, path);
      }
    }
    case "fake": {
      const nodes = listInitializeFakeFrameEffect(
        { path },
        {},
        {
          frame: context.scope.frame,
          variable,
          right,
        },
      );
      if (nodes === null) {
        return listScopeInitializeEffect(
          { ...context, scope: context.scope.parent },
          variable,
          right,
          { path, meta },
        );
      } else {
        return nodes;
      }
    }
    case "dynamic": {
      return listScopeInitializeEffect(
        { ...context, scope: context.scope.parent },
        variable,
        right,
        { path, meta },
      );
    }
    default: {
      throw new AranTypeError("invalid scope", context.scope);
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
 *     site: {
 *       path: unbuild.Path,
 *     },
 *     context: {
 *       mode: "strict" | "sloppy",
 *     },
 *     options: {
 *       frame: Cache,
 *       variable: estree.Variable,
 *       alternate: aran.Expression<unbuild.Atom>,
 *     },
 *   ) => aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeScopeLookupExpression = (
  context,
  variable,
  { path, meta },
  makeBindingLookupExpression,
  makeFakeLookupExpression,
  makeWithLookupExpression,
) => {
  switch (context.scope.type) {
    case "root": {
      return makeBindingLookupExpression(
        context,
        makeMissingBinding(variable),
        { path, meta },
      );
    }
    case "static": {
      const binding = makePresentBinding(
        {},
        context.scope.parent.type === "root",
        context.scope.frame,
        variable,
      );
      if (binding === null) {
        return makeScopeLookupExpression(
          { ...context, scope: context.scope.parent },
          variable,
          { path, meta },
          makeBindingLookupExpression,
          makeFakeLookupExpression,
          makeWithLookupExpression,
        );
      } else {
        return makeBindingLookupExpression(context, binding, {
          path,
          meta,
        });
      }
    }
    case "fake": {
      const node = makeFakeLookupExpression({ path }, context, {
        frame: context.scope.frame,
        variable,
      });
      if (node === null) {
        return makeScopeLookupExpression(
          { ...context, scope: context.scope.parent },
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
      return makeWithLookupExpression({ path }, context, {
        frame: context.scope.frame,
        variable,
        alternate: makeScopeLookupExpression(
          { ...context, scope: context.scope.parent },
          variable,
          { path, meta },
          makeBindingLookupExpression,
          makeFakeLookupExpression,
          makeWithLookupExpression,
        ),
      });
    }
    default: {
      throw new AranTypeError("invalid scope", context.scope);
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
  context,
  variable,
  right,
  { path, meta },
) => {
  switch (context.scope.type) {
    case "root": {
      return listBindingWriteEffect(
        context,
        makeMissingBinding(variable),
        right,
        { path, meta },
      );
    }
    case "static": {
      const binding = makePresentBinding(
        {},
        context.scope.parent.type === "root",
        context.scope.frame,
        variable,
      );
      if (binding === null) {
        return listScopeWriteEffect(
          { ...context, scope: context.scope.parent },
          variable,
          right,
          { path, meta },
        );
      } else {
        return listBindingWriteEffect(context, binding, right, {
          path,
          meta,
        });
      }
    }
    case "fake": {
      const nodes = listWriteFakeFrameEffect({ path, meta }, context, {
        frame: context.scope.frame,
        variable,
        right,
      });
      if (nodes === null) {
        return listScopeWriteEffect(
          { ...context, scope: context.scope.parent },
          variable,
          right,
          { path, meta },
        );
      } else {
        return nodes;
      }
    }
    case "dynamic": {
      const TS_NARROW_context_scope = context.scope;
      const metas = splitMeta(meta, ["right", "next"]);
      return listInitCacheEffect(
        "constant",
        right,
        { path, meta: metas.right },
        (right) =>
          listWithWriteEffect({ path }, context, {
            frame: TS_NARROW_context_scope.frame,
            variable,
            right,
            alternate: listScopeWriteEffect(
              { ...context, scope: TS_NARROW_context_scope.parent },
              variable,
              makeReadCacheExpression(right, path),
              { path, meta: metas.next },
            ),
          }),
      );
    }
    default: {
      throw new AranTypeError("invalid scope", context.scope);
    }
  }
};
