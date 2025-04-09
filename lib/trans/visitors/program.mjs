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
  everyNarrow,
  every,
} from "../../util/index.mjs";
import { AranExecError, AranTypeError } from "../../error.mjs";
import { makeProgram, makeTreeRoutineBlock } from "../node.mjs";
import { transStateBody } from "./statement.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { transExpression } from "./expression.mjs";
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
 *   kind: import("../annotation/hoisting.d.ts").Kind,
 * ) => kind is (
 *   | "var"
 *   | "function-sloppy-away"
 *   | "function-sloppy-near"
 * )}
 */
const isLateDeclareKind = (kind) =>
  kind === "var" ||
  // Also async and generator!
  kind === "function-strict" ||
  kind === "function-sloppy-away" ||
  kind === "function-sloppy-near";

/**
 * @type {(
 *   binding: import("../annotation/hoisting.d.ts").FrameEntry,
 *   mode: "strict" | "sloppy",
 * ) => {
 *   variable: import("estree-sentry").VariableName,
 *   kinds: (
 *     | "var"
 *     | "function-sloppy-away"
 *     | "function-sloppy-near"
 *   )[],
 * }}
 */
const toLateDeclareOperation = ({ 0: variable, 1: kinds }, mode) => {
  if (mode !== "sloppy") {
    throw new AranExecError("binding can escape eval only in sloppy mode", {
      mode,
    });
  }
  if (!everyNarrow(kinds, isLateDeclareKind)) {
    throw new AranExecError("illegal kind for late declare operations", {
      variable,
      kinds,
      mode,
    });
  }
  return { variable, kinds };
};

/**
 * @type {(
 *   kind: import("../annotation/hoisting.d.ts").Kind,
 * ) => kind is import("../scope/variable/root/index.d.ts").RootKind}
 */
const isRootKind = (kind) =>
  kind === "import" ||
  kind === "var" ||
  kind === "let" ||
  kind === "const" ||
  kind === "class" ||
  kind === "function-sloppy-away" ||
  kind === "function-sloppy-near" ||
  kind === "function-strict";

/**
 * @type {(
 *   binding: import("../annotation/hoisting.d.ts").FrameEntry,
 * ) => binding is [
 *   import("estree-sentry").VariableName,
 *   [
 *     import("../scope/variable/root/index.d.ts").RootKind,
 *     ... import("../scope/variable/root/index.d.ts").RootKind[],
 *   ],
 * ]}
 */
const isRootBinding = (binding) => every(binding[1], isRootKind);

/**
 * @type {(
 *   hash: import("../hash.d.ts").Hash,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 *   options: {
 *     unbound: import("../annotation/hoisting.d.ts").FrameEntry[],
 *     global_declarative_record:
 *       import("../config.d.ts").GlobalDeclarativeRecord,
 *     links: import("../query/link.d.ts").Link[],
 *   },
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   (
 *     | import("../prelude/index.d.ts").BodyPrelude
 *     | import("../prelude/index.d.ts").PrefixPrelude
 *   ),
 *   import("../scope/index.d.ts").Scope,
 * >}
 */
const extendProgramScope = (
  hash,
  meta,
  scope,
  { unbound, global_declarative_record, links },
) => {
  const sort = getProgramSort(scope);
  if (!everyNarrow(unbound, isRootBinding)) {
    throw new AranExecError("illegal binding for program scope", { unbound });
  }
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
          sort: scope.root,
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
 *   hash: import("../hash.d.ts").Hash,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 *   options: {
 *     direct_result: boolean,
 *   },
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   (
 *     | import("../prelude/index.d.ts").BodyPrelude
 *     | import("../prelude/index.d.ts").PrefixPrelude
 *   ),
 *   import("../scope/index.d.ts").Scope,
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
 *   node: import("estree-sentry").Program<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 *   options: {
 *     unbound: import("../annotation/hoisting.d.ts").FrameEntry[],
 *     global_declarative_record:
 *       import("../config.d.ts").GlobalDeclarativeRecord,
 *   },
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").ProgramPrelude,
 *   import("../atom.d.ts").Program,
 * >}
 */
export const transProgram = (
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
            { direct_result: tail === null },
          ),
          (scope) =>
            liftSequence__XX_(
              makeTreeRoutineBlock,
              EMPTY,
              null,
              mapSequence(
                transStateBody(
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
                : transExpression(
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
