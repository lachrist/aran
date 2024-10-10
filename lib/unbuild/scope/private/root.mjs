import { AranExecError, AranTypeError } from "../../../report.mjs";
import {
  initSequence,
  liftSequenceX,
  liftSequenceX_,
} from "../../../sequence.mjs";
import { concat_ } from "../../../util/index.mjs";
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
 * @type {{
 *   "get-private": "private.get",
 *   "has-private": "private.has",
 *   "set-private": "private.set",
 * }}
 */
const PARAMETER_MAPPING = {
  "get-private": "private.get",
  "has-private": "private.has",
  "set-private": "private.set",
};

/**
 * @type {import("../perform").PerformExpression<
 *   Omit<import(".").PrivateScope, "private">,
 *   (
 *     | import(".").HasPrivateOperation
 *     | import(".").GetPrivateOperation
 *   ),
 *   (
 *     | import("../../prelude").SyntaxErrorPrelude
 *     | import("../../prelude").UnboundPrivatePrelude
 *   ),
 * >}
 */
const makeRootGenericPrivateExpression = (
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
          makeApplyExpression(
            makeReadExpression(PARAMETER_MAPPING[operation.type], hash),
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
    return initSyntaxErrorExpression("Illegal global private operation", hash);
  }
};

/**
 * @type {import("../perform").PerformExpression<
 *   Omit<import(".").PrivateScope, "private">,
 *   import(".").HasPrivateOperation,
 *   (
 *     | import("../../prelude").SyntaxErrorPrelude
 *     | import("../../prelude").UnboundPrivatePrelude
 *   ),
 * >}
 */
export const makeRootHasPrivateExpression = makeRootGenericPrivateExpression;

/**
 * @type {import("../perform").PerformExpression<
 *   Omit<import(".").PrivateScope, "private">,
 *   import(".").GetPrivateOperation,
 *   (
 *     | import("../../prelude").SyntaxErrorPrelude
 *     | import("../../prelude").UnboundPrivatePrelude
 *   ),
 * >}
 */
export const makeRootGetPrivateExpression = makeRootGenericPrivateExpression;

/**
 * @type {import("../perform").PerformEffect<
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
          [
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
          ],
        );
      }
      case "sloppy": {
        return liftSequenceX(
          concat_,
          liftSequenceX_(
            makeExpressionEffect,
            initSyntaxErrorExpression("Illegal sloppy private operation", hash),
            hash,
          ),
        );
      }
      default: {
        throw new AranTypeError(mode);
      }
    }
  } else {
    return liftSequenceX(
      concat_,
      liftSequenceX_(
        makeExpressionEffect,
        initSyntaxErrorExpression("Illegal global private operation", hash),
        hash,
      ),
    );
  }
};

/**
 * @type {import("../perform").PerformEffect<
 *   {},
 *   import(".").RegisterPrivateCollectionOperation,
 *   never,
 * >}
 */
export const listRootPrivateRegisterCollectionEffect = (
  hash,
  meta,
  target,
  operation,
) => {
  throw new AranExecError("Illegal private register operation on root", {
    hash,
    meta,
    target,
    operation,
  });
};

/**
 * @type {import("../perform").PerformEffect<
 *   {},
 *   import(".").RegisterPrivateSingletonOperation,
 *   never,
 * >}
 */
export const listRootPrivateRegisterSingletonEffect = (
  hash,
  meta,
  target,
  operation,
) => {
  throw new AranExecError("Illegal private register operation on root", {
    hash,
    meta,
    target,
    operation,
  });
};
