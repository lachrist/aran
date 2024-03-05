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
  prefixClosureBody,
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
import { makePrefixPrelude } from "../prelude.mjs";
import {
  isExternalLocalEvalSort,
  isGlobalEvalSort,
  isModuleSort,
  isScriptSort,
} from "../../sort.mjs";
import { setupTemplate } from "../template.mjs";
import { VOID_COMPLETION } from "../completion.mjs";
import { unbuildExpression } from "./expression.mjs";
import { setupEarlyError } from "../early-error.mjs";

/**
 * @type {(
 *   site: import("../site").Site<estree.Program>,
 * ) => import("../sequence").Sequence<
 *   import("../prelude").CachePrelude,
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
              {
                type: "primitive",
                primitive: { undefined: null },
              },
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
 *   global_declarative_record: "native" | "emulate",
 *   sort: import("../../sort").RootSort,
 * ) => import("../sequence").Sequence<
 *   import("../prelude").FramePrelude,
 *   import("../scope").Scope
 * >}
 */
const setupRootScope = (
  { node, path, meta },
  global_declarative_record,
  sort,
) => {
  const hoisting = {
    closure: flatMap(node.body, (node) => hoistClosure(sort.mode, node)),
    block: flatMap(node.body, (node) => hoistBlock(sort.mode, node)),
  };
  if (isModuleSort(sort)) {
    return mapTwoSequence(
      mapSequence(
        setupRootFrame(
          { path, meta },
          { global_declarative_record, sort, hoisting: [] },
        ),
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
        {
          global_declarative_record,
          sort,
          hoisting: [...hoisting.closure, ...hoisting.block],
        },
      ),
      makeRootScope,
    );
  } else if (isGlobalEvalSort(sort) || isExternalLocalEvalSort(sort)) {
    if (sort.mode === "strict") {
      return mapTwoSequence(
        mapSequence(
          setupRootFrame(
            { path, meta },
            { global_declarative_record, sort, hoisting: [] },
          ),
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
            { global_declarative_record, sort, hoisting: hoisting.closure },
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
 *   import("../prelude").FramePrelude,
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
          (nodes) => initSequence(map(nodes, makePrefixPrelude), scope),
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
 *     import("../prelude").FramePrelude,
 *     import("../scope").Scope
 *   >,
 *   options: {
 *     sort: import("../../sort").Sort,
 *     early_syntax_error: "embed" | "throw",
 *   },
 * ) => import("../sequence").ProgramSequence}
 */
const unbuildProgram = (
  { node, path, meta },
  scope,
  { sort, early_syntax_error },
) =>
  makeProgram(
    sort,
    makeClosureBlock(
      setupEarlyError(
        setupTemplate(
          prefixClosureBody(
            bindSequence(scope, (scope) =>
              bindSequence(
                extractCompletion({ node, path, meta }),
                ({ body, completion }) =>
                  makeClosureBody(
                    unbuildBody(body, scope, {
                      parent: "program",
                      labels: [],
                      completion:
                        completion.type === "direct"
                          ? VOID_COMPLETION
                          : completion,
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
        ),
        early_syntax_error,
        node,
      ),
      path,
    ),
    path,
  );

/**
 * @type {(
 *   site: import("../site").Site<estree.Program>,
 *   global_declarative_record: "native" | "emulate",
 *   options: {
 *     sort: import("../../sort").RootSort,
 *     early_syntax_error: "embed" | "throw",
 *   },
 * ) => import("../sequence").ProgramSequence}
 */
export const unbuildRootProgram = (
  { node, path, meta },
  global_declarative_record,
  { sort, early_syntax_error },
) =>
  unbuildProgram(
    { node, path, meta: forkMeta((meta = nextMeta(meta))) },
    setupRootScope(
      { node, path, meta: forkMeta((meta = nextMeta(meta))) },
      global_declarative_record,
      sort,
    ),
    { sort, early_syntax_error },
  );

/**
 * @type {(
 *   site: import("../site").Site<estree.Program>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     early_syntax_error: "embed" | "throw",
 *   },
 * ) => import("../sequence").ProgramSequence}
 */
export const unbuildNodeProgram = (
  { node, path, meta },
  scope,
  { early_syntax_error },
) =>
  unbuildProgram(
    { node, path, meta },
    setupNodeScope(
      { node, path, meta: forkMeta((meta = nextMeta(meta))) },
      extendScope(scope, { type: "closure-eval" }),
      null,
    ),
    {
      sort: {
        kind: "eval",
        mode: getMode(scope),
        situ: "local",
      },
      early_syntax_error,
    },
  );
