import { AranExecError, AranTypeError } from "../../../report.mjs";
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
 *   name: import("../../../lang/syntax").Parameter,
 * ) => import("../api").PerformExpression<
 *   {
 *     mode: import("../../mode").Mode,
 *     root: import("../../sort").RootSort,
 *   },
 *   {
 *     target: import("../../atom").Expression,
 *     key: import("estree-sentry").PrivateKeyName,
 *   },
 *   (
 *     | import("../../prelude").SyntaxErrorPrelude
 *     | import("../../prelude").UnboundPrivatePrelude
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
 * @type {import("../api").PerformEffect<
 *   Omit<import(".").PrivateScope, "private">,
 *   import(".").SetPrivateOperation,
 *   (
 *     | import("../../prelude").SyntaxErrorPrelude
 *     | import("../../prelude").UnboundPrivatePrelude
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
 * @type {import("../api").PerformEffect<
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
