import { AranError, AranTypeError } from "../../error.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import { splitMeta } from "../mangle.mjs";
import {
  listStaticVariable,
  listStaticDeclareEffect,
  listStaticInitializeEffect,
  makeStaticTypeofExpression,
  makeStaticDiscardExpression,
  makeStaticReadExpression,
  listStaticWriteEffect,
} from "./static_old/index.mjs";
import {
  makeDynamicReadExpression,
  makeDynamicTypeofExpression,
  makeDynamicDiscardExpression,
  listDynamicWriteEffect,
} from "./dynamic.mjs";
import {
  declareFakeFrame,
  listFakeInitializeEffect,
  listFakeWriteEffect,
  makeFakeDiscardExpression,
  makeFakeReadExpression,
  makeFakeTypeofExpression,
} from "./fake.mjs";
import {
  listRootWriteEffect,
  makeRootDiscardExpression,
  makeRootReadExpression,
  makeRootTypeofExpression,
} from "./root/index.mjs";
import {
  bindSequence,
  initSequence,
  listenSequence,
  mapSequence,
  tellSequence,
} from "../sequence.mjs";
import { makeEffectStatement, makePrimitiveExpression } from "../node.mjs";
import { map } from "../../util/index.mjs";

///////////////////////
// listScopeVariable //
///////////////////////

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../program.d.ts").RootProgram,
 *     scope: import("./index.d.ts").Scope,
 *   },
 * ) => unbuild.Variable[]}
 */
const listScopeVariable = (context) => {
  const { scope } = context;
  switch (scope.type) {
    case "static": {
      return listStaticVariable(context, scope.frame);
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
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../program.d.ts").RootProgram,
 *     scope: import("./index.d.ts").Scope,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listScopeDeclareEffect = ({ path }, context) => {
  const { scope } = context;
  switch (scope.type) {
    case "root": {
      return [];
    }
    case "static": {
      return listStaticDeclareEffect({ path }, context, {
        frame: scope.frame,
      });
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

/////////////////
// extendScope //
/////////////////

/** @type {import("./index.d.ts").Scope} */
export const ROOT_SCOPE = { type: "root" };

/**
 * @type {<C extends {
 *   mode: "strict" | "sloppy",
 *   situ: import("../../situ.js").RootSitu,
 *   scope: import("./index.d.ts").Scope,
 * }>(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: C,
 *   options: {
 *     frame: import("./static_old/index.js").StaticFrame,
 *   },
 * ) => import("../sequence.d.ts").BlockSequence<C>}
 */
export const extendStaticScope = ({ path }, context1, { frame }) => {
  const context2 = {
    ...context1,
    scope: {
      type: "static",
      frame,
      parent: context1.scope,
    },
  };
  return initSequence(
    [
      ...listScopeVariable(context2),
      ...map(listScopeDeclareEffect({ path }, context2), (node) =>
        makeEffectStatement(node, path),
      ),
    ],
    context2,
  );
};

/**
 * @type {(
 *   context: {
 *     scope: import("./index.d.ts").Scope,
 *   },
 *   frame: import("./dynamic.js").DynamicFrame,
 * ) => import("./index.d.ts").Scope}
 */
export const extendDynamicScope = ({ scope: parent }, frame) => ({
  type: "dynamic",
  frame,
  parent,
});

/**
 * @type {<C extends { scope: import("./index.d.ts").Scope }>(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: C,
 *   options: {
 *     frame: import("./fake.js").RawFakeFrame,
 *   },
 * ) => import("../sequence.d.ts").EffectSequence<C>}
 */
export const extendFakeScope = (site, context, options) =>
  mapSequence(declareFakeFrame(site, context, options), (frame) => ({
    ...context,
    scope: {
      type: "fake",
      frame,
      parent: context.scope,
    },
  }));

///////////////////////////////
// listScopeInitializeEffect //
///////////////////////////////

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../program.d.ts").RootProgram,
 *     scope: import("./index.d.ts").Scope,
 *   },
 *   options: {
 *     variable: estree.Variable,
 *     right: aran.Expression<unbuild.Atom> | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listScopeInitializeEffect = (
  { path, meta },
  context,
  { variable, right },
) => {
  const { scope } = context;
  switch (scope.type) {
    case "root": {
      throw new AranError("unbound variable initialization", variable);
    }
    case "static": {
      const nodes = listStaticInitializeEffect({ path }, context, {
        frame: scope.frame,
        variable,
        right,
      });
      if (nodes === null) {
        return listScopeInitializeEffect(
          { path, meta },
          { ...context, scope: scope.parent },
          { variable, right },
        );
      } else {
        return nodes;
      }
    }
    case "fake": {
      const nodes = listFakeInitializeEffect(
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
          { path, meta },
          { ...context, scope: scope.parent },
          { variable, right },
        );
      } else {
        return nodes;
      }
    }
    case "dynamic": {
      const metas = splitMeta(meta, ["right", "dynamic", "next"]);
      return listenSequence(
        bindSequence(
          cacheConstant(
            metas.right,
            right ?? makePrimitiveExpression({ undefined: null }, path),
            path,
          ),
          (right) =>
            tellSequence(
              listDynamicWriteEffect({ path, meta: metas.dynamic }, context, {
                frame: scope.frame,
                variable,
                right,
                alternate: listScopeInitializeEffect(
                  { path, meta: metas.next },
                  { ...context, scope: scope.parent },
                  { variable, right: makeReadCacheExpression(right, path) },
                ),
              }),
            ),
        ),
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
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../program.d.ts").RootProgram,
 *     scope: import("./index.d.ts").Scope,
 *   },
 *   options: {
 *     variable: estree.Variable,
 *     makeRootLookupExpression: (
 *       site: {
 *         path: unbuild.Path,
 *         meta: unbuild.Meta,
 *       },
 *       context: {
 *         mode: "strict" | "sloppy",
 *         root: import("../program.d.ts").RootProgram,
 *       },
 *       options: {
 *         variable: estree.Variable,
 *       },
 *     ) => aran.Expression<unbuild.Atom>,
 *     makeStaticLookupExpression: (
 *       site: {
 *         path: unbuild.Path,
 *         meta: unbuild.Meta,
 *       },
 *       context: {
 *         mode: "strict" | "sloppy",
 *         root: import("../program.d.ts").RootProgram,
 *       },
 *       options: {
 *         frame: import("./static_old/index.js").StaticFrame,
 *         variable: estree.Variable,
 *       },
 *     ) => aran.Expression<unbuild.Atom> | null,
 *     makeFakeLookupExpression: (
 *       site: {
 *         path: unbuild.Path,
 *       },
 *       context: {},
 *       options: {
 *         frame: import("./fake.js").FakeFrame,
 *         variable: estree.Variable,
 *       },
 *     ) => aran.Expression<unbuild.Atom> | null,
 *     makeDynamicLookupExpression: (
 *       site: {
 *         path: unbuild.Path,
 *         meta: unbuild.Meta,
 *       },
 *       context: {
 *         mode: "strict" | "sloppy",
 *       },
 *       options: {
 *         frame: import("../cache.d.ts").Cache,
 *         variable: estree.Variable,
 *         alternate: aran.Expression<unbuild.Atom>,
 *       },
 *     ) => aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeScopeLookupExpression = (
  { path, meta },
  context,
  {
    variable,
    makeRootLookupExpression,
    makeStaticLookupExpression,
    makeFakeLookupExpression,
    makeDynamicLookupExpression,
  },
) => {
  const { scope } = context;
  switch (scope.type) {
    case "root": {
      return makeRootLookupExpression({ path, meta }, context, { variable });
    }
    case "static": {
      const node = makeStaticLookupExpression({ path, meta }, context, {
        frame: scope.frame,
        variable,
      });
      if (node === null) {
        return makeScopeLookupExpression(
          { path, meta },
          { ...context, scope: scope.parent },
          {
            variable,
            makeRootLookupExpression,
            makeStaticLookupExpression,
            makeFakeLookupExpression,
            makeDynamicLookupExpression,
          },
        );
      } else {
        return node;
      }
    }
    case "fake": {
      const node = makeFakeLookupExpression({ path }, context, {
        frame: scope.frame,
        variable,
      });
      if (node === null) {
        return makeScopeLookupExpression(
          { path, meta },
          { ...context, scope: scope.parent },
          {
            variable,
            makeRootLookupExpression,
            makeStaticLookupExpression,
            makeFakeLookupExpression,
            makeDynamicLookupExpression,
          },
        );
      } else {
        return node;
      }
    }
    case "dynamic": {
      const metas = splitMeta(meta, ["dynamic", "next"]);
      return makeDynamicLookupExpression(
        { path, meta: metas.dynamic },
        context,
        {
          frame: scope.frame,
          variable,
          alternate: makeScopeLookupExpression(
            { path, meta },
            { ...context, scope: scope.parent },
            {
              variable,
              makeRootLookupExpression,
              makeStaticLookupExpression,
              makeFakeLookupExpression,
              makeDynamicLookupExpression,
            },
          ),
        },
      );
    }
    default: {
      throw new AranTypeError("invalid scope", scope);
    }
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../program.d.ts").RootProgram,
 *     scope: import("./index.d.ts").Scope,
 *   },
 *   options: {
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeReadExpression = (site, context, { variable }) =>
  makeScopeLookupExpression(site, context, {
    variable,
    makeRootLookupExpression: makeRootReadExpression,
    makeStaticLookupExpression: makeStaticReadExpression,
    makeFakeLookupExpression: makeFakeReadExpression,
    makeDynamicLookupExpression: makeDynamicReadExpression,
  });

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../program.d.ts").RootProgram,
 *     scope: import("./index.d.ts").Scope,
 *   },
 *   options: {
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeTypeofExpression = (site, context, { variable }) =>
  makeScopeLookupExpression(site, context, {
    variable,
    makeRootLookupExpression: makeRootTypeofExpression,
    makeStaticLookupExpression: makeStaticTypeofExpression,
    makeFakeLookupExpression: makeFakeTypeofExpression,
    makeDynamicLookupExpression: makeDynamicTypeofExpression,
  });

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../program.d.ts").RootProgram,
 *     scope: import("./index.d.ts").Scope,
 *   },
 *   options: {
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeDiscardExpression = (site, context, { variable }) =>
  makeScopeLookupExpression(site, context, {
    variable,
    makeRootLookupExpression: makeRootDiscardExpression,
    makeStaticLookupExpression: makeStaticDiscardExpression,
    makeFakeLookupExpression: makeFakeDiscardExpression,
    makeDynamicLookupExpression: makeDynamicDiscardExpression,
  });

//////////////////////////
// listScopeWriteEffect //
//////////////////////////

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../program.d.ts").RootProgram,
 *     scope: import("./index.d.ts").Scope,
 *   },
 *   options: {
 *     variable: estree.Variable,
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listScopeWriteEffect = (
  { path, meta },
  context,
  { variable, right },
) => {
  const { scope } = context;
  switch (scope.type) {
    case "root": {
      return listRootWriteEffect({ path, meta }, context, { variable, right });
    }
    case "static": {
      const nodes = listStaticWriteEffect({ path, meta }, context, {
        frame: scope.frame,
        variable,
        right,
      });
      if (nodes === null) {
        return listScopeWriteEffect(
          { path, meta },
          { ...context, scope: scope.parent },
          { variable, right },
        );
      } else {
        return nodes;
      }
    }
    case "fake": {
      const nodes = listFakeWriteEffect({ path, meta }, context, {
        frame: scope.frame,
        variable,
        right,
      });
      if (nodes === null) {
        return listScopeWriteEffect(
          { path, meta },
          { ...context, scope: scope.parent },
          { variable, right },
        );
      } else {
        return nodes;
      }
    }
    case "dynamic": {
      const metas = splitMeta(meta, ["right", "dynamic", "next"]);
      return listenSequence(
        bindSequence(cacheConstant(metas.right, right, path), (right) =>
          tellSequence(
            listDynamicWriteEffect({ path, meta: metas.dynamic }, context, {
              frame: scope.frame,
              variable,
              right,
              alternate: listScopeWriteEffect(
                { path, meta: metas.next },
                { ...context, scope: scope.parent },
                { variable, right: makeReadCacheExpression(right, path) },
              ),
            }),
          ),
        ),
      );
    }
    default: {
      throw new AranTypeError("invalid scope", scope);
    }
  }
};
