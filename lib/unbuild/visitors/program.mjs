import { listLink, toModuleHeader } from "../query/index.mjs";
import { EMPTY, flat, map, slice } from "../../util/index.mjs";
import { AranExecError, AranTypeError } from "../../report.mjs";
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
  zeroSequence,
} from "../../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  extendScope,
  setupRegularFrame,
  makeRootScope,
  listScopeSaveEffect,
  setupRootFrame,
  setupProgramFrame,
  setupRoutineFrame,
} from "../scope/index.mjs";
import { unbuildExpression } from "./expression.mjs";
import {
  incorporateProgram,
  incorporateRoutineBlock,
  makePrefixPrelude,
} from "../prelude/index.mjs";
import { getSortKind, getSortSitu } from "../sort.mjs";
import { hoist } from "../annotation/index.mjs";
import { INITIAL_STATEMENT_LABELING } from "../labeling.mjs";
import { updateContextScope } from "../context.mjs";

/**
 * @type {(
 *   sloppy_function: import("../annotation/hoisting-public").SloppyFunction,
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
 *   binding: import("../annotation/hoisting-public").Binding,
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
        throw new AranExecError("Constants cannot be declared late", binding);
      } else {
        throw new AranTypeError(binding.write);
      }
    } else if (binding.baseline === "dead") {
      throw new AranExecError("Cannot late-declare variable with deadzone", {
        binding,
        mode,
      });
    } else {
      throw new AranTypeError(binding.baseline);
    }
  } else if (mode === "strict") {
    throw new AranExecError(
      "Late declarations should not occur in strict mode",
      {
        binding,
        mode,
      },
    );
  } else {
    throw new AranTypeError(mode);
  }
};

/**
 * @type {(
 *   hash: import("../../hash").Hash,
 *   meta: import("../meta").Meta,
 *   context: import("../context").RootContext,
 *   options: {
 *     unbound: import("../annotation/hoisting-public").Binding[],
 *     sort: import("../sort").Sort,
 *     global_declarative_record: "builtin" | "emulate",
 *     links: import("../query/link").Link[],
 *   },
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *   ),
 *   import("../scope").Scope,
 * >}
 */
const setupScope = (
  hash,
  meta,
  context,
  { unbound, sort, global_declarative_record, links },
) => {
  if (context.scope === null) {
    if (sort === "eval.local.deep") {
      throw new AranExecError("program sort and scope mismatch", sort);
    } else if (
      sort === "module" ||
      sort === "script" ||
      sort === "eval.global" ||
      sort === "eval.local.root"
    ) {
      return liftSequenceXX(
        extendScope,
        mapSequence(
          setupRootFrame(hash, meta, {
            global_declarative_record,
            sort,
            mode: context.mode,
            bindings: unbound,
          }),
          makeRootScope,
        ),
        setupProgramFrame(
          hash,
          forkMeta((meta = nextMeta(meta))),
          hoist(hash, context.annotation),
          links,
        ),
      );
    } else {
      throw new AranTypeError(sort);
    }
  } else {
    if (sort === "eval.local.deep") {
      return bindSequence(
        liftSequence_X(
          extendScope,
          context.scope,
          setupRegularFrame(
            hash,
            forkMeta((meta = nextMeta(meta))),
            hoist(hash, context.annotation),
          ),
        ),
        (scope) =>
          bindSequence(
            liftSequenceX(
              flat,
              flatSequence(
                map(unbound, (binding) =>
                  listScopeSaveEffect(
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    scope,
                    toLateDeclareOperation(binding, context.mode),
                  ),
                ),
              ),
            ),
            (nodes) => initSequence(map(nodes, makePrefixPrelude), scope),
          ),
      );
    } else if (
      sort === "module" ||
      sort === "script" ||
      sort === "eval.global" ||
      sort === "eval.local.root"
    ) {
      throw new AranExecError("program sort and scope mismatch", sort);
    } else {
      throw new AranTypeError(sort);
    }
  }
};

/**
 * @type {(
 *   node: import("estree-sentry").Program<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   context: import("../context").RootContext,
 *   options: {
 *     unbound: import("../annotation/hoisting-public").Binding[],
 *     sort: import("../sort").Sort,
 *     global_declarative_record: "builtin" | "emulate",
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").ProgramPrelude,
 *   import("../atom").Program,
 * >}
 */
export const unbuildProgram = (
  node,
  meta,
  context,
  { unbound, sort, global_declarative_record },
) => {
  const { _hash: hash } = node;
  const links = listLink(node);
  return incorporateProgram(
    liftSequence___X_(
      makeProgram,
      getSortKind(sort),
      getSortSitu(sort),
      map(links, toModuleHeader),
      incorporateRoutineBlock(
        bindSequence(
          liftSequence_X(
            updateContextScope,
            context,
            setupScope(hash, forkMeta((meta = nextMeta(meta))), context, {
              unbound,
              sort,
              global_declarative_record,
              links,
            }),
          ),
          (context) => {
            if (node.body.length === 0) {
              return zeroSequence(
                makeRoutineBlock(
                  EMPTY,
                  null,
                  EMPTY,
                  makeIntrinsicExpression("undefined", hash),
                  hash,
                ),
              );
            } else {
              const last = node.body[node.body.length - 1];
              if (last.type === "ExpressionStatement") {
                return bindSequence(
                  liftSequence_X(
                    updateContextScope,
                    context,
                    liftSequence_X(
                      extendScope,
                      context.scope,
                      setupRoutineFrame(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        {
                          type: "routine",
                          kind: "program",
                          result: null,
                          sort,
                        },
                        context.mode,
                      ),
                    ),
                  ),
                  (context) =>
                    liftSequence__XX_(
                      makeRoutineBlock,
                      EMPTY,
                      null,
                      unbuildBody(
                        slice(node.body, 0, node.body.length - 1),
                        forkMeta((meta = nextMeta(meta))),
                        context,
                        INITIAL_STATEMENT_LABELING,
                      ),
                      unbuildExpression(
                        last.expression,
                        forkMeta((meta = nextMeta(meta))),
                        context,
                      ),
                      hash,
                    ),
                );
              } else {
                return bindSequence(
                  cacheWritable(forkMeta((meta = nextMeta(meta))), "undefined"),
                  (result) =>
                    bindSequence(
                      liftSequence_X(
                        updateContextScope,
                        context,
                        liftSequence_X(
                          extendScope,
                          context.scope,
                          setupRoutineFrame(
                            hash,
                            forkMeta((meta = nextMeta(meta))),
                            {
                              type: "routine",
                              kind: "program",
                              result,
                              sort,
                            },
                            context.mode,
                          ),
                        ),
                      ),
                      (context) =>
                        liftSequence__X__(
                          makeRoutineBlock,
                          EMPTY,
                          null,
                          unbuildBody(
                            node.body,
                            forkMeta((meta = nextMeta(meta))),
                            context,
                            INITIAL_STATEMENT_LABELING,
                          ),
                          makeReadCacheExpression(result, hash),
                          hash,
                        ),
                    ),
                );
              }
            }
          },
        ),
        hash,
      ),
      hash,
    ),
    node,
  );
};
