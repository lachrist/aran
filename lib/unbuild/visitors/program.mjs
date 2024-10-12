import { listLink, toModuleHeader } from "../query/index.mjs";
import { EMPTY, flat, map, slice } from "../../util/index.mjs";
import { AranExecError, AranTypeError } from "../../report.mjs";
import { makeProgram, makeRoutineBlock } from "../node.mjs";
import { unbuildStateBody } from "./statement.mjs";
import {
  bindSequence,
  callSequence__X_,
  callSequence___X,
  flatSequence,
  initSequence,
  liftSequenceX,
  liftSequence___X_,
  zeroSequence,
} from "../../sequence.mjs";
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
 * ) => import("../../sequence").Sequence<
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
          liftSequenceX(
            flat,
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
          ),
          (nodes) => initSequence(map(nodes, makePrefixPrelude), scope),
        ),
    );
  } else {
    throw new AranTypeError(sort);
  }
};

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
 *   node: import("estree-sentry").ModuleStatement<import("../../hash").HashProp>[],
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   options: { hash: import("../../hash").Hash },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").RoutineBlock,
 * >}
 */
export const unbuildProgramBody = (nodes, meta, scope, { hash }) => {
  const { body, tail } = extractResult(nodes);
  return bindSequence(
    tail === null
      ? extendResultRoutine(hash, forkMeta((meta = nextMeta(meta))), {}, scope)
      : zeroSequence(scope),
    (scope) =>
      bindSequence(
        unbuildStateBody(
          body,
          forkMeta((meta = nextMeta(meta))),
          scope,
          INITIAL_STATEMENT_LABELING,
        ),
        ({ 0: body, 1: scope }) =>
          liftSequence___X_(
            makeRoutineBlock,
            EMPTY,
            null,
            body,
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
  );
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
 * ) => import("../../sequence").Sequence<
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
  return incorporateProgram(
    liftSequence___X_(
      makeProgram,
      getSortKind(sort),
      getSortSitu(sort),
      map(links, toModuleHeader),
      incorporateRoutineBlock(
        callSequence__X_(
          unbuildProgramBody,
          node.body,
          forkMeta((meta = nextMeta(meta))),
          extendProgramScope(hash, forkMeta((meta = nextMeta(meta))), scope, {
            unbound,
            global_declarative_record,
            links,
          }),
          { hash },
        ),
        hash,
      ),
      hash,
    ),
    hash,
  );
};
