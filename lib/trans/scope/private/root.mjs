import { AranExecError, AranTypeError } from "../../../error.mjs";
import { initSequence, liftSequenceX_ } from "../../../util/index.mjs";
import {
  makeApplyExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
} from "../../node.mjs";
import {
  initSyntaxErrorExpression,
  makeUnboundPrivatePrelude,
} from "../../prelude/index.mjs";

/**
 * @type {(
 *   name: import("../../../lang/syntax.d.ts").Parameter,
 * ) => import("../api.d.ts").PerformExpression<
 *   {
 *     mode: import("../../mode.d.ts").Mode,
 *     root: import("../../sort.d.ts").RootSort,
 *   },
 *   {
 *     target: import("../../atom.d.ts").Expression,
 *     key: import("estree-sentry").PrivateKeyName,
 *   },
 *   (
 *     | import("../../prelude/index.d.ts").SyntaxErrorPrelude
 *     | import("../../prelude/index.d.ts").UnboundPrivatePrelude
 *   ),
 * >}
 */
const compilePrivateLookup =
  (parameter) =>
  (hash, _meta, { root, mode }, operation) => {
    if (root === "eval.local.root") {
      switch (mode) {
        case "strict": {
          return initSequence(
            [makeUnboundPrivatePrelude(operation.key)],
            makeApplyExpression(
              makeReadExpression(parameter, hash),
              makeIntrinsicExpression("undefined", hash),
              [operation.target, makePrimitiveExpression(operation.key, hash)],
              hash,
            ),
          );
        }
        case "sloppy": {
          return initSyntaxErrorExpression(
            "Illegal sloppy private operation",
            hash,
          );
        }
        default: {
          throw new AranTypeError(mode);
        }
      }
    } else {
      return initSyntaxErrorExpression(
        "Illegal global private operation",
        hash,
      );
    }
  };

export const makeRootHasPrivateExpression = compilePrivateLookup("private.has");

export const makeRootGetPrivateExpression = compilePrivateLookup("private.get");

/**
 * @type {import("../api.d.ts").PerformEffect<
 *   Omit<import("./index.d.ts").PrivateScope, "private">,
 *   import("./index.d.ts").SetPrivateOperation,
 *   (
 *     | import("../../prelude/index.d.ts").SyntaxErrorPrelude
 *     | import("../../prelude/index.d.ts").UnboundPrivatePrelude
 *   ),
 * >}
 */
export const listRootSetPrivateEffect = (
  hash,
  _meta,
  { root, mode },
  operation,
) => {
  if (root === "eval.local.root") {
    switch (mode) {
      case "strict": {
        return initSequence(
          [makeUnboundPrivatePrelude(operation.key)],
          makeExpressionEffect(
            makeApplyExpression(
              makeReadExpression("private.set", hash),
              makeIntrinsicExpression("undefined", hash),
              [
                operation.target,
                makePrimitiveExpression(operation.key, hash),
                operation.value,
              ],
              hash,
            ),
            hash,
          ),
        );
      }
      case "sloppy": {
        return liftSequenceX_(
          makeExpressionEffect,
          initSyntaxErrorExpression("Illegal sloppy private operation", hash),
          hash,
        );
      }
      default: {
        throw new AranTypeError(mode);
      }
    }
  } else {
    return liftSequenceX_(
      makeExpressionEffect,
      initSyntaxErrorExpression("Illegal global private operation", hash),
      hash,
    );
  }
};

/**
 * @type {import("../api.d.ts").PerformEffect<
 *   {},
 *   {},
 *   never,
 * >}
 */
export const listRootIllegalPrivateEffect = (hash, meta, bind, operation) => {
  throw new AranExecError("Illegal private operation on root", {
    hash,
    meta,
    bind,
    operation,
  });
};
