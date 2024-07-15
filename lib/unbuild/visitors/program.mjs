import {
  recordCompletion,
  hoist,
  listBinding,
  listLink,
  toModuleHeader,
} from "../query/index.mjs";
import { EMPTY, flat, map, slice } from "../../util/index.mjs";
import { AranError, AranSyntaxError, AranTypeError } from "../../error.mjs";
import {
  makeProgram,
  makeRoutineBlock,
  makeIntrinsicExpression,
} from "../node.mjs";
import { unbuildBody } from "./statement.mjs";
import { cacheWritable, makeReadCacheExpression } from "../cache.mjs";
import {
  bindSequence,
  flatSequence,
  initSequence,
  liftSequenceX,
  liftSequenceXX,
  liftSequence_X,
  liftSequence__XX_,
  liftSequence__X__,
  liftSequence___X_,
  mapSequence,
  prependSequence,
  zeroSequence,
} from "../../sequence.mjs";
import { drillSite, drillSiteArray } from "../site.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  extendScope,
  setupRegularFrame,
  makeRootScope,
  listScopeSaveEffect,
  getMode,
  setupRootFrame,
  setupProgramFrame,
  setupRoutineFrame,
} from "../scope/index.mjs";
import { unbuildExpression } from "./expression.mjs";
import { makeThrowErrorExpression } from "../intrinsic.mjs";
import {
  incorporateProgram,
  incorporateRoutineBlock,
  makeErrorPrelude,
  makePrefixPrelude,
} from "../prelude/index.mjs";
import { getSortKind, getSortSitu } from "../sort.mjs";

/**
 * @type {(
 *   sloppy_function: import("../query/hoist-public").SloppyFunction,
 * ) => "report" | "ignore"}
 */
const getConflict = (sloppy_function) => {
  switch (sloppy_function) {
    case "nope": {
      return "report";
    }
    case "away": {
      return "ignore";
    }
    case "near": {
      return "report";
    }
    case "both": {
      return "report";
    }
    default: {
      throw new AranTypeError(sloppy_function);
    }
  }
};

/**
 * @type {(
 *   binding: import("../query/hoist-public").Binding,
 *   mode: "strict" | "sloppy",
 * ) => import("../scope/operation").LateDeclareOperation}
 */
const toLateDeclareOperation = (binding, mode) => {
  if (mode === "sloppy") {
    if (binding.baseline === "live") {
      if (binding.write === "perform") {
        return {
          type: "late-declare",
          mode,
          variable: binding.variable,
          write: binding.write,
          conflict: getConflict(binding.sloppy_function),
        };
      } else if (binding.write === "report" || binding.write === "ignore") {
        throw new AranError("Constants cannot be declared late", binding);
      } else {
        throw new AranTypeError(binding.write);
      }
    } else if (binding.baseline === "dead") {
      throw new AranError("Cannot late-declare variable with deadzone", {
        binding,
        mode,
      });
    } else {
      throw new AranTypeError(binding.baseline);
    }
  } else if (mode === "strict") {
    throw new AranError("Late declarations should not occur in strict mode", {
      binding,
      mode,
    });
  } else {
    throw new AranTypeError(mode);
  }
};

/**
 * @type {(
 *   site: import("../site").Site<
 *     import("../../estree").Program
 *   >,
 *   scope: null | import("../scope").Scope,
 *   options: {
 *     sort: import("../sort").Sort,
 *     mode: "strict" | "sloppy",
 *     global_declarative_record: "native" | "emulate",
 *     links: import("../query/link").Link[],
 *   },
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *   ),
 *   {
 *     scope: import("../scope").Scope,
 *     hoisting: import("../query/hoist-public").Hoisting,
 *   },
 * >}
 */
const setupScope = (
  { node, path, meta },
  scope,
  { sort, mode, global_declarative_record, links },
) => {
  const { unbound, hoisting, report } = hoist(
    { ...node, kind: getSortKind(sort) },
    path,
    mode,
  );
  if (scope === null) {
    if (sort === "eval.local.deep") {
      throw new AranError("program sort and scope mismatch", sort);
    } else if (
      sort === "module" ||
      sort === "script" ||
      sort === "eval.global" ||
      sort === "eval.local.root"
    ) {
      return mapSequence(
        prependSequence(
          map(report, makeErrorPrelude),
          liftSequenceXX(
            extendScope,
            mapSequence(
              setupRootFrame(
                { path, meta },
                { global_declarative_record, sort, mode, bindings: unbound },
              ),
              makeRootScope,
            ),
            setupProgramFrame(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              listBinding(hoisting, path),
              links,
            ),
          ),
        ),
        (scope) => ({ scope, hoisting }),
      );
    } else {
      throw new AranTypeError(sort);
    }
  } else {
    if (sort === "eval.local.deep") {
      const mode = getMode(scope);
      return mapSequence(
        prependSequence(
          map(report, makeErrorPrelude),
          bindSequence(
            liftSequence_X(
              extendScope,
              scope,
              setupRegularFrame(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                listBinding(hoisting, path),
              ),
            ),
            (scope) =>
              bindSequence(
                liftSequenceX(
                  flat,
                  flatSequence(
                    map(unbound, (binding) =>
                      listScopeSaveEffect(
                        {
                          path,
                          meta: forkMeta((meta = nextMeta(meta))),
                        },
                        scope,
                        toLateDeclareOperation(binding, mode),
                      ),
                    ),
                  ),
                ),
                (nodes) => initSequence(map(nodes, makePrefixPrelude), scope),
              ),
          ),
        ),
        (scope) => ({ scope, hoisting }),
      );
    } else if (
      sort === "module" ||
      sort === "script" ||
      sort === "eval.global" ||
      sort === "eval.local.root"
    ) {
      throw new AranError("program sort and scope mismatch", sort);
    } else {
      throw new AranTypeError(sort);
    }
  }
};

/**
 * @type {(
 *   site: import("../site").Site<
 *     import("../../estree").Node
 *   >,
 * ) => site is import("../site").Site<
 *   import("../../estree").ExpressionStatement
 * >}
 */
const isExpressionStatementeSite = (site) =>
  site.node.type === "ExpressionStatement";

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | import("../../estree").Program
 *     | import("../../source").EarlySyntaxError
 *   )>,
 *   scope: null | import("../scope").Scope,
 *   options: {
 *     sort: import("../sort").Sort,
 *     mode: "strict" | "sloppy",
 *     early_syntax_error: "embed" | "throw",
 *     global_declarative_record: "native" | "emulate",
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").ProgramPrelude,
 *   import("../atom").Program,
 * >}
 */
export const unbuildProgram = (
  { node, path, meta },
  scope,
  { sort, mode, early_syntax_error, global_declarative_record },
) => {
  switch (node.type) {
    case "Program": {
      const links = listLink(node);
      return incorporateProgram(
        liftSequence___X_(
          makeProgram,
          getSortKind(sort),
          getSortSitu(sort),
          map(links, toModuleHeader),
          incorporateRoutineBlock(
            bindSequence(
              setupScope(
                { node, path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                { sort, mode, global_declarative_record, links },
              ),
              ({ scope, hoisting }) => {
                const sites = drillSiteArray(
                  drillSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "body",
                  ),
                );
                if (sites.length === 0) {
                  return zeroSequence(
                    makeRoutineBlock(
                      EMPTY,
                      null,
                      EMPTY,
                      makeIntrinsicExpression("undefined", path),
                      path,
                    ),
                  );
                } else {
                  const last = sites[sites.length - 1];
                  if (isExpressionStatementeSite(last)) {
                    return bindSequence(
                      liftSequence_X(
                        extendScope,
                        scope,
                        setupRoutineFrame(
                          { path, meta: forkMeta((meta = nextMeta(meta))) },
                          {
                            type: "routine-program",
                            result: null,
                            sort,
                            completion: {},
                          },
                          { mode },
                        ),
                      ),
                      (scope) =>
                        liftSequence__XX_(
                          makeRoutineBlock,
                          EMPTY,
                          null,
                          unbuildBody(
                            slice(sites, 0, sites.length - 1),
                            scope,
                            {
                              origin: "program",
                              hoisting,
                              labels: [],
                              loop: {
                                break: null,
                                continue: null,
                              },
                            },
                          ),
                          unbuildExpression(
                            drillSite(
                              last.node,
                              last.path,
                              last.meta,
                              "expression",
                            ),
                            scope,
                            null,
                          ),
                          path,
                        ),
                    );
                  } else {
                    return bindSequence(
                      cacheWritable(
                        forkMeta((meta = nextMeta(meta))),
                        "undefined",
                      ),
                      (result) =>
                        bindSequence(
                          liftSequence_X(
                            extendScope,
                            scope,
                            setupRoutineFrame(
                              { path, meta: forkMeta((meta = nextMeta(meta))) },
                              {
                                type: "routine-program",
                                result,
                                sort,
                                completion: recordCompletion(node, path),
                              },
                              { mode },
                            ),
                          ),
                          (scope) =>
                            liftSequence__X__(
                              makeRoutineBlock,
                              EMPTY,
                              null,
                              unbuildBody(sites, scope, {
                                origin: "program",
                                hoisting,
                                labels: [],
                                loop: {
                                  break: null,
                                  continue: null,
                                },
                              }),
                              makeReadCacheExpression(result, path),
                              path,
                            ),
                        ),
                    );
                  }
                }
              },
            ),
            path,
          ),
          path,
        ),
        { root: node, early_syntax_error, base: path },
      );
    }
    case "EarlySyntaxError": {
      switch (early_syntax_error) {
        case "embed": {
          return zeroSequence(
            makeProgram(
              getSortKind(sort),
              getSortSitu(sort),
              [],
              makeRoutineBlock(
                [],
                null,
                [],
                makeThrowErrorExpression("SyntaxError", node.message, path),
                path,
              ),
              path,
            ),
          );
        }
        case "throw": {
          throw new AranSyntaxError(node.message);
        }
        default: {
          throw new AranTypeError(early_syntax_error);
        }
      }
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
