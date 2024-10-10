import { AranExecError, AranTypeError } from "../../../report.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";
import { bindSequence, mapSequence, zeroSequence } from "../../../sequence.mjs";
import {
  listEvalLateDeclareEffect,
  listEvalWriteEffect,
  makeEvalDiscardExpression,
  makeEvalReadAmbientThisExpression,
  makeEvalReadExpression,
  makeEvalTypeofExpression,
} from "./eval/index.mjs";
import {
  listIllegalSaveEffect,
  makeIllegalLoadExpression,
} from "./illegal/index.mjs";
import {
  listProxyLateDeclareEffect,
  listProxyWriteEffect,
  makeProxyDiscardExpression,
  makeProxyReadAmbientThisExpression,
  makeProxyReadExpression,
  makeProxyTypeofExpression,
} from "./proxy/index.mjs";
import {
  listRegularLateDeclareEffect,
  listRegularWriteEffect,
  makeRegularDiscardExpression,
  makeRegularReadAmbientThisExpression,
  makeRegularReadExpression,
  makeRegularTypeofExpression,
} from "./regular/index.mjs";
import {
  listRootLateDeclareEffect,
  listRootWriteEffect,
  makeRootDiscardExpression,
  makeRootReadAmbientThisExpression,
  makeRootReadExpression,
  makeRootTypeofExpression,
} from "./root/index.mjs";
import {
  listWithLateDeclareEffect,
  listWithWriteEffect,
  makeWithDiscardExpression,
  makeWithReadAmbientThisExpression,
  makeWithReadExpression,
  makeWithTypeofExpression,
} from "./with/index.mjs";
import { cacheConstant } from "../../cache.mjs";

/**
 * @type {<O>(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   operation: O,
 * ) => import("../../../sequence").Sequence<never, [O, O]>}
 */
const duplicate = (_hash, _meta, operation) =>
  zeroSequence([operation, operation]);

/**
 * @type {<O extends { right: import("../../atom").Expression }>(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   operation: O,
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   [O, O],
 * >}
 */
const duplicateRight = (hash, meta, operation) =>
  mapSequence(cacheConstant(meta, operation.right, hash), (right) => [
    { ...operation, right },
    { ...operation, right },
  ]);

/**
 * @type {<O extends { closure: import(".").Closure }>(
 *   operation: O,
 * ) => O}
 */
const escapeOperation = (operation) => {
  switch (operation.closure) {
    case "internal": {
      return { ...operation, closure: "external" };
    }
    case "external": {
      return operation;
    }
    default: {
      throw new AranTypeError(operation.closure);
    }
  }
};

/**
 * @type {<O extends { closure: import(".").Closure }, W0, W1, W2, W3, W4, W5, W6, X>(
 *   duplicate: import(".").DuplicateOperation<W0, O>,
 *   perform: import(".").NormalPerform<O, W1, W2, W3, W4, W5, W6, X>,
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   mode: import("../../mode").Mode,
 *   root: import("../../sort").RootSort,
 *   frames: import("../../../util/list").List<import(".").VariableFrame>,
 *   operation: O,
 * ) => import("../../../sequence").Sequence<W0 | W1 | W2 | W3 | W4 | W5 | W6, X>}
 */
export const loop = (
  duplicate,
  perform,
  hash,
  meta,
  mode,
  root,
  frames,
  operation,
) => {
  if (frames === null) {
    throw new AranExecError("missing binding frame", { hash, operation });
  } else {
    const { 0: head, 1: tail } = frames;
    switch (head.type) {
      case "eval": {
        const { performEval } = perform;
        return bindSequence(
          duplicate(hash, forkMeta((meta = nextMeta(meta))), operation),
          ({ 0: operation1, 1: operation2 }) =>
            bindSequence(
              loop(
                duplicate,
                perform,
                hash,
                forkMeta((meta = nextMeta(meta))),
                mode,
                root,
                tail,
                operation1,
              ),
              (alternate) =>
                performEval(hash, meta, head, operation2, alternate),
            ),
        );
      }
      case "illegal": {
        const { performIllegal } = perform;
        const result = performIllegal(hash, meta, head, operation);
        return result === null
          ? loop(duplicate, perform, hash, meta, mode, root, tail, operation)
          : result;
      }
      case "proxy": {
        const { performProxy } = perform;
        const result = performProxy(hash, meta, head, operation);
        return result === null
          ? loop(duplicate, perform, hash, meta, mode, root, tail, operation)
          : result;
      }
      case "regular": {
        const { performRegular } = perform;
        const result = performRegular(hash, meta, head, operation);
        return result === null
          ? loop(duplicate, perform, hash, meta, mode, root, tail, operation)
          : result;
      }
      case "root": {
        const { performRoot } = perform;
        return performRoot(hash, meta, { mode, root, ...head }, operation);
      }
      case "with": {
        const { performWith } = perform;
        return bindSequence(
          duplicate(hash, forkMeta((meta = nextMeta(meta))), operation),
          ({ 0: operation1, 1: operation2 }) =>
            bindSequence(
              loop(
                duplicate,
                perform,
                hash,
                forkMeta((meta = nextMeta(meta))),
                mode,
                root,
                tail,
                operation1,
              ),
              (alternate) =>
                performWith(
                  hash,
                  meta,
                  { mode, ...head },
                  operation2,
                  alternate,
                ),
            ),
        );
      }
      case "closure": {
        return loop(
          duplicate,
          perform,
          hash,
          meta,
          mode,
          root,
          tail,
          escapeOperation(operation),
        );
      }
      default: {
        throw new AranTypeError(head);
      }
    }
  }
};

/**
 * @type {<O extends { closure: import(".").Closure }, W0, W1, W2, W3, W4, W5, W6, X>(
 *   duplicate: import(".").DuplicateOperation<W0, O>,
 *   perform: import(".").NormalPerform<O, W1, W2, W3, W4, W5, W6, X>,
 * ) => import("../perform").Perform<
 *   import(".").VariableScope,
 *   O,
 *   W0 | W1 | W2 | W3 | W4 | W5 | W6,
 *   X,
 * >}
 */
export const compileLoop =
  (duplicate, perform) =>
  (hash, meta, { mode, root, variable }, operation) =>
    loop(duplicate, perform, hash, meta, mode, root, variable, operation);

export const makeReadVariableExpression = compileLoop(duplicate, {
  performEval: makeEvalReadExpression,
  performIllegal: makeIllegalLoadExpression,
  performProxy: makeProxyReadExpression,
  performRegular: makeRegularReadExpression,
  performRoot: makeRootReadExpression,
  performWith: makeWithReadExpression,
});

export const makeTypeofVariableExpression = compileLoop(duplicate, {
  performEval: makeEvalTypeofExpression,
  performIllegal: makeIllegalLoadExpression,
  performProxy: makeProxyTypeofExpression,
  performRegular: makeRegularTypeofExpression,
  performRoot: makeRootTypeofExpression,
  performWith: makeWithTypeofExpression,
});

export const makeDiscardVariableExpression = compileLoop(duplicate, {
  performEval: makeEvalDiscardExpression,
  performIllegal: makeIllegalLoadExpression,
  performProxy: makeProxyDiscardExpression,
  performRegular: makeRegularDiscardExpression,
  performRoot: makeRootDiscardExpression,
  performWith: makeWithDiscardExpression,
});

export const makeReadAmbientThisExpression = compileLoop(duplicate, {
  performEval: makeEvalReadAmbientThisExpression,
  performIllegal: makeIllegalLoadExpression,
  performProxy: makeProxyReadAmbientThisExpression,
  performRegular: makeRegularReadAmbientThisExpression,
  performRoot: makeRootReadAmbientThisExpression,
  performWith: makeWithReadAmbientThisExpression,
});

export const listWriteVariableEffect = compileLoop(duplicateRight, {
  performEval: listEvalWriteEffect,
  performIllegal: listIllegalSaveEffect,
  performProxy: listProxyWriteEffect,
  performRegular: listRegularWriteEffect,
  performRoot: listRootWriteEffect,
  performWith: listWithWriteEffect,
});

export const listLateDeclareVariableEffect = compileLoop(duplicate, {
  performEval: listEvalLateDeclareEffect,
  performIllegal: listIllegalSaveEffect,
  performProxy: listProxyLateDeclareEffect,
  performRegular: listRegularLateDeclareEffect,
  performRoot: listRootLateDeclareEffect,
  performWith: listWithLateDeclareEffect,
});

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   scope: import(".").VariableScope,
 * ) => import("../../../sequence").Sequence<
 *   never,
 *   {
 *     value: import("../../atom").Effect[],
 *     state: import(".").VariableScope,
 *   },
 * >}
 */
export const initializeVariable = (hash, meta, scope, operation) => TODO;

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   scope: import(".").VariableScope,
 * ) => import("../../../sequence").Sequence<
 *   never,
 *   import("../../atom").Effect[],
 * >}
 */
export const listWriteSloppyFunctionVariableEffect = (
  hash,
  meta,
  scope,
  operation,
) => TODO;
