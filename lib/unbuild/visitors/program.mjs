import {
  hoistBlock,
  hoistClosure,
  hoistExport,
  hoistImport,
} from "../query/index.mjs";
import { flatMap, map, slice } from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import {
  makeProgram,
  makePrimitiveExpression,
  makeClosureBlock,
  makeClosureBody,
  concatEffect,
} from "../node.mjs";
import { unbuildBody } from "./statement.mjs";
import { cacheWritable, makeReadCacheExpression } from "../cache.mjs";
import {
  bindSequence,
  initSequence,
  mapSequence,
  mapTwoSequence,
  zeroSequence,
} from "../sequence.mjs";
import { drillSite, drillSiteArray } from "../site.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  extendScope,
  setupRegularFrame,
  makeRootScope,
  listScopeSaveEffect,
  getMode,
  setupRootFrame,
  setupModuleFrame,
} from "../scope/index.mjs";
import { makeEffectPrelude } from "../prelude.mjs";
import {
  isExternalLocalEvalSort,
  isGlobalEvalSort,
  isModuleSort,
  isScriptSort,
} from "../../sort.mjs";
import { setupTemplate } from "../template.mjs";
import { VOID_COMPLETION } from "../completion.mjs";
import { unbuildExpression } from "./expression.mjs";

/**
 * @type {(
 *   site: import("../site").Site<estree.Program>,
 * ) => import("../sequence").Sequence<
 *   import("../prelude").NodePrelude,
 *   {
 *     body: import("../site").Site<(
 *       | estree.Directive
 *       | estree.Statement
 *       | estree.ModuleDeclaration
 *     )>[],
 *     completion: import("../completion").Completion,
 *   }
 * >}
 */
const extractCompletion = ({ node: root, path, meta }) => {
  const body = drillSiteArray(drillSite(root, path, meta, "body"));
  switch (root.sourceType) {
    case "module": {
      return zeroSequence({
        body,
        completion: {
          type: "void",
        },
      });
    }
    case "script": {
      if (body.length === 0) {
        return zeroSequence({
          body,
          completion: VOID_COMPLETION,
        });
      } else {
        const { node, path, meta } = body[body.length - 1];
        if (node.type === "ExpressionStatement") {
          return zeroSequence({
            body: slice(body, 0, body.length - 1),
            completion: {
              type: "direct",
              site: drillSite(node, path, meta, "expression"),
            },
          });
        } else {
          const meta0 = forkMeta(meta);
          const meta1 = nextMeta(meta0);
          const meta2 = nextMeta(meta1);
          return mapSequence(
            cacheWritable(
              forkMeta(meta1),
              makePrimitiveExpression({ undefined: null }, path),
              path,
            ),
            (cache) => ({
              body: [
                ...slice(body, 0, body.length - 1),
                {
                  node,
                  path,
                  meta: forkMeta(meta2),
                },
              ],
              completion: {
                type: "indirect",
                root,
                cache,
              },
            }),
          );
        }
      }
    }
    default: {
      throw new AranTypeError(root.sourceType);
    }
  }
};

/**
 * @type {(
 *   site: import("../site").Site<estree.Program>,
 *   scoping: "reify" | "alien",
 *   sort: import("../../sort").RootSort,
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../scope").Scope
 * >}
 */
const setupRootScope = ({ node, path, meta }, scoping, sort) => {
  const hoisting = {
    closure: flatMap(node.body, (node) => hoistClosure(sort.mode, node)),
    block: flatMap(node.body, (node) => hoistBlock(sort.mode, node)),
  };
  if (isModuleSort(sort)) {
    return mapTwoSequence(
      mapSequence(
        setupRootFrame({ path, meta }, { scoping, sort, hoisting: [] }),
        makeRootScope,
      ),
      setupModuleFrame({ path }, [
        ...hoisting.closure,
        ...hoisting.block,
        ...flatMap(node.body, hoistImport),
        ...flatMap(node.body, hoistExport),
      ]),
      extendScope,
    );
  } else if (isScriptSort(sort)) {
    return mapSequence(
      setupRootFrame(
        { path, meta },
        { scoping, sort, hoisting: [...hoisting.closure, ...hoisting.block] },
      ),
      makeRootScope,
    );
  } else if (isGlobalEvalSort(sort) || isExternalLocalEvalSort(sort)) {
    if (sort.mode === "strict") {
      return mapTwoSequence(
        mapSequence(
          setupRootFrame({ path, meta }, { scoping, sort, hoisting: [] }),
          makeRootScope,
        ),
        setupRegularFrame({ path }, [...hoisting.closure, ...hoisting.block]),
        extendScope,
      );
    } else if (sort.mode === "sloppy") {
      return mapTwoSequence(
        mapSequence(
          setupRootFrame(
            { path, meta },
            { scoping, sort, hoisting: hoisting.closure },
          ),
          makeRootScope,
        ),
        setupRegularFrame({ path }, hoisting.block),
        extendScope,
      );
    } else {
      throw new AranTypeError(sort.mode);
    }
  } else {
    throw new AranTypeError(sort);
  }
};

/**
 * @type {(
 *   site: import("../site").Site<estree.Program>,
 *   scope: import("../scope").Scope,
 *   sort: null,
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../scope").Scope
 * >}
 */
const setupNodeScope = ({ node, path, meta }, scope, _sort) => {
  const mode = getMode(scope);
  const hoisting = {
    closure: flatMap(node.body, (node) => hoistClosure(mode, node)),
    block: flatMap(node.body, (node) => hoistBlock(mode, node)),
  };
  if (mode === "strict") {
    return mapTwoSequence(
      zeroSequence(scope),
      setupRegularFrame({ path }, [...hoisting.closure, ...hoisting.block]),
      extendScope,
    );
  } else if (mode === "sloppy") {
    return bindSequence(
      mapTwoSequence(
        zeroSequence(scope),
        setupRegularFrame({ path }, hoisting.block),
        extendScope,
      ),
      (scope) =>
        bindSequence(
          concatEffect(
            map(hoisting.closure, (hoist) =>
              listScopeSaveEffect(
                {
                  path,
                  meta: forkMeta((meta = nextMeta(meta))),
                },
                scope,
                {
                  type: "declare",
                  mode,
                  kind: "eval",
                  variable: hoist.variable,
                  configurable: true,
                },
              ),
            ),
          ),
          (nodes) => initSequence(map(nodes, makeEffectPrelude), scope),
        ),
    );
  } else {
    throw new AranTypeError(mode);
  }
};

/**
 * @type {(
 *   site: import("../site").VoidSite,
 *   scope: import("../scope").Scope,
 *   completion: import("../completion").Completion,
 * ) => import("../sequence").ExpressionSequence}
 */
export const unbuildCompletion = ({ path }, scope, completion) => {
  switch (completion.type) {
    case "void": {
      return makePrimitiveExpression({ undefined: null }, path);
    }
    case "indirect": {
      return makeReadCacheExpression(completion.cache, path);
    }
    case "direct": {
      return unbuildExpression(completion.site, scope, null);
    }
    default: {
      throw new AranTypeError(completion);
    }
  }
};

/**
 * @type {(
 *   site: import("../site").Site<estree.Program>,
 *   scope: import("../sequence").Sequence<
 *     import("../prelude").BodyPrelude,
 *     import("../scope").Scope
 *   >,
 *   sort: import("../../sort").Sort,
 * ) => import("../sequence").ProgramSequence}
 */
const unbuildProgram = ({ node, path, meta }, scope, sort) =>
  makeProgram(
    sort,
    makeClosureBlock(
      setupTemplate(
        bindSequence(scope, (scope) =>
          bindSequence(
            extractCompletion({ node, path, meta }),
            ({ body, completion }) =>
              makeClosureBody(
                unbuildBody(body, scope, {
                  parent: "program",
                  labels: [],
                  completion:
                    completion.type === "direct" ? VOID_COMPLETION : completion,
                  loop: {
                    break: null,
                    continue: null,
                  },
                }),
                unbuildCompletion({ path }, scope, completion),
              ),
          ),
        ),
      ),
      path,
    ),
    path,
  );

/**
 * @type {(
 *   site: import("../site").Site<estree.Program>,
 *   scoping: "reify" | "alien",
 *   sort: import("../../sort").RootSort,
 * ) => import("../sequence").ProgramSequence}
 */
export const unbuildRootProgram = ({ node, path, meta }, scoping, sort) =>
  unbuildProgram(
    { node, path, meta: forkMeta((meta = nextMeta(meta))) },
    setupRootScope(
      { node, path, meta: forkMeta((meta = nextMeta(meta))) },
      scoping,
      sort,
    ),
    sort,
  );

/**
 * @type {(
 *   site: import("../site").Site<estree.Program>,
 *   scope: import("../scope").Scope,
 *   sort: null,
 * ) => import("../sequence").ProgramSequence}
 */
export const unbuildNodeProgram = ({ node, path, meta }, scope, _options) =>
  unbuildProgram(
    { node, path, meta },
    setupNodeScope(
      { node, path, meta: forkMeta((meta = nextMeta(meta))) },
      extendScope(scope, { type: "closure-eval" }),
      null,
    ),
    {
      kind: "eval",
      mode: getMode(scope),
      situ: "local",
    },
  );
