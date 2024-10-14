import { listLink, toModuleHeader } from "../query/index.mjs";
import {
  EMPTY,
  map,
  mapTree,
  slice,
  bindSequence,
  callSequence__X_,
  callSequence___X,
  flatSequence,
  initSequence,
  liftSequence__XX_,
  liftSequence___X_,
  mapSequence,
  zeroSequence,
} from "../../util/index.mjs";
import { AranExecError, AranTypeError } from "../../report.mjs";
import { makeProgram, makeTreeRoutineBlock } from "../node.mjs";
import { unbuildStateBody } from "./statement.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { unbuildExpression } from "./expression.mjs";
import {
  incorporateProgram,
  incorporateRoutineBlock,
  makePrefixPrelude,
} from "../prelude/index.mjs";
import { getSortKind, getSortSitu } from "../sort.mjs";
import { hoist } from "../annotation/index.mjs";
import { INITIAL_STATEMENT_LABELING } from "../labeling.mjs";
import {
  extendModuleRegularVariable,
  extendResultRoutine,
  extendRootVariable,
  getProgramSort,
  listLateDeclareVariableEffect,
  makeFinalizeResultExpression,
} from "../scope/index.mjs";

/**
 * @type {(
 *   sloppy_function: import("../annotation/hoisting").SloppyFunction,
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
 *   binding: import("../annotation/hoisting").Binding,
 *   mode: "strict" | "sloppy",
 * ) => {
 *   variable: import("estree-sentry").VariableName,
 *   conflict: "report" | "ignore",
 * }}
 */
const toLateDeclareOperation = (binding, mode) => {
  if (mode !== "sloppy") {
    throw new AranExecError("invalid mode for late declaration", { mode });
  }
  if (binding.initial !== "undefined") {
    throw new AranExecError("invalid initial for late declaration", {
      binding,
    });
  }
  if (binding.write !== "perform") {
    throw new AranExecError("invalid write for late declaration", { binding });
  }
  return {
    variable: binding.variable,
    conflict: getConflict(binding.sloppy_function),
  };
};

/**
 * @type {(
 *   hash: import("../../hash").Hash,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   options: {
 *     unbound: import("../annotation/hoisting").Binding[],
 *     global_declarative_record: "builtin" | "emulate",
 *     links: import("../query/link").Link[],
 *   },
 * ) => import("../../util/sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *   ),
 *   import("../scope").Scope,
 * >}
 */
const extendProgramScope = (
  hash,
  meta,
  scope,
  { unbound, global_declarative_record, links },
) => {
  const sort = getProgramSort(scope);
  if (
    sort === "module" ||
    sort === "script" ||
    sort === "eval.global" ||
    sort === "eval.local.root"
  ) {
    return callSequence___X(
      extendModuleRegularVariable,
      hash,
      forkMeta((meta = nextMeta(meta))),
      { bindings: hoist(hash, scope.annotation), links },
      extendRootVariable(
        hash,
        forkMeta((meta = nextMeta(meta))),
        {
          global_declarative_record,
          bindings: unbound,
        },
        scope,
      ),
    );
  } else if (sort === "eval.local.deep") {
    return bindSequence(
      extendModuleRegularVariable(
        hash,
        forkMeta((meta = nextMeta(meta))),
        { bindings: hoist(hash, scope.annotation), links },
        scope,
      ),
      (scope) =>
        bindSequence(
          flatSequence(
            map(unbound, (binding) =>
              listLateDeclareVariableEffect(
                hash,
                forkMeta((meta = nextMeta(meta))),
                scope,
                toLateDeclareOperation(binding, scope.mode),
              ),
            ),
          ),
          (tree) => initSequence(mapTree(tree, makePrefixPrelude), scope),
        ),
    );
  } else {
    throw new AranTypeError(sort);
  }
};

/**
 * @type {(
 *   hash: import("../../hash").Hash,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   options: {
 *     direct_result: boolean,
 *   },
 * ) => import("../../util/sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *   ),
 *   import("../scope").Scope,
 * >}
 */
const extendResultScope = (hash, meta, scope, { direct_result }) =>
  direct_result
    ? extendResultRoutine(hash, forkMeta((meta = nextMeta(meta))), {}, scope)
    : zeroSequence(scope);

/**
 * @type {(
 *   node: import("estree-sentry").Program<unknown>,
 * ) => "direct" | "indirect"}
 */
export const getProgramResultKind = (node) => {
  if (node.body.length === 0) {
    return "direct";
  } else {
    const last = node.body[node.body.length - 1];
    if (last.type === "ExpressionStatement") {
      return "direct";
    } else {
      return "indirect";
    }
  }
};

/**
 * @type {<X>(
 *   node: import("estree-sentry").ModuleStatement<X>[],
 * ) => {
 *   body: import("estree-sentry").ModuleStatement<X>[],
 *   tail: null | import("estree-sentry").ExpressionStatement<X>,
 * }}
 */
const extractResult = (nodes) => {
  if (nodes.length === 0) {
    return {
      body: nodes,
      tail: null,
    };
  } else {
    const last = nodes[nodes.length - 1];
    if (last.type === "ExpressionStatement") {
      return {
        body: slice(nodes, 0, nodes.length - 1),
        tail: last,
      };
    } else {
      return {
        body: nodes,
        tail: null,
      };
    }
  }
};

/**
 * @type {(
 *   node: import("estree-sentry").Program<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   options: {
 *     unbound: import("../annotation/hoisting").Binding[],
 *     global_declarative_record: "builtin" | "emulate",
 *   },
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").ProgramPrelude,
 *   import("../atom").Program,
 * >}
 */
export const unbuildProgram = (
  node,
  meta,
  scope,
  { unbound, global_declarative_record },
) => {
  const { _hash: hash } = node;
  const links = listLink(node);
  const sort = getProgramSort(scope);
  const { body, tail } = extractResult(node.body);
  return incorporateProgram(
    liftSequence___X_(
      makeProgram,
      getSortKind(sort),
      getSortSitu(sort),
      map(links, toModuleHeader),
      incorporateRoutineBlock(
        bindSequence(
          callSequence__X_(
            extendResultScope,
            hash,
            forkMeta((meta = nextMeta(meta))),
            extendProgramScope(hash, forkMeta((meta = nextMeta(meta))), scope, {
              unbound,
              global_declarative_record,
              links,
            }),
            { direct_result: tail !== null },
          ),
          (scope) =>
            liftSequence__XX_(
              makeTreeRoutineBlock,
              EMPTY,
              null,
              mapSequence(
                unbuildStateBody(
                  body,
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                  INITIAL_STATEMENT_LABELING,
                ),
                (pair) => {
                  // eslint-disable-next-line local/no-impure
                  scope = pair[1];
                  return pair[0];
                },
              ),
              tail === null
                ? makeFinalizeResultExpression(
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    scope,
                    { result: null },
                  )
                : unbuildExpression(
                    tail.expression,
                    forkMeta((meta = nextMeta(meta))),
                    scope,
                  ),
              hash,
            ),
        ),
        hash,
      ),
      hash,
    ),
    hash,
  );
};
