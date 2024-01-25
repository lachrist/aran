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
import { unbuildExpression } from "./expression.mjs";
import { listBodyStatement } from "./statement.mjs";
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

/**
 * @type {(
 *   sites: import("../site").Site<(
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *   )[]>,
 * ) => {
 *   body: import("../site").Site<(
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *   )[]>,
 *   tail: null | import("../site").Site<estree.Expression>,
 * }}
 */
const extractCompletion = ({ node: nodes, path, meta }) => {
  if (nodes.length === 0) {
    return {
      body: { node: nodes, path, meta },
      tail: null,
    };
  } else {
    const meta0 = meta;
    const meta1 = nextMeta(meta0);
    const meta2 = nextMeta(meta1);
    const last = drillSite(nodes, path, forkMeta(meta1), nodes.length - 1);
    if (last.node.type === "ExpressionStatement") {
      return {
        body: {
          node: slice(nodes, 0, nodes.length - 1),
          path,
          meta: forkMeta(meta2),
        },
        tail: drillSite(last.node, last.path, last.meta, "expression"),
      };
    } else {
      return {
        body: { node: nodes, path, meta },
        tail: null,
      };
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
                  kind: "var",
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
 *   site: import("../site").Site<estree.Program>,
 *   scope: import("../sequence").Sequence<
 *     import("../prelude").BodyPrelude,
 *     import("../scope").Scope
 *   >,
 *   sort: import("../../sort").Sort,
 * ) => import("../sequence").ProgramSequence}
 */
const unbuildProgram = ({ node, path, meta }, scope, sort) => {
  const { body, tail } = extractCompletion(
    drillSite(node, path, forkMeta((meta = nextMeta(meta))), "body"),
  );
  return makeProgram(
    sort,
    makeClosureBlock(
      setupTemplate(
        bindSequence(scope, (scope) =>
          bindSequence(
            sort.kind === "module" || tail !== null
              ? cacheWritable(
                  forkMeta((meta = nextMeta(meta))),
                  makePrimitiveExpression({ undefined: null }, path),
                  path,
                )
              : zeroSequence(null),
            (completion) =>
              makeClosureBody(
                listBodyStatement(drillSiteArray(body), scope, {
                  parent: "program",
                  labels: [],
                  completion:
                    completion === null
                      ? null
                      : {
                          cache: completion,
                          root: node,
                        },
                  loop: {
                    break: null,
                    continue: null,
                  },
                }),
                tail !== null
                  ? unbuildExpression(tail, scope, null)
                  : completion !== null
                  ? makeReadCacheExpression(completion, path)
                  : makePrimitiveExpression({ undefined: null }, path),
              ),
          ),
        ),
      ),
      path,
    ),
    path,
  );
};

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
