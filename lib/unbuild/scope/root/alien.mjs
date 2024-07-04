import { AranError, AranTypeError } from "../../../error.mjs";
import { EMPTY, concat, concat_ } from "../../../util/index.mjs";
import {
  cacheWritable,
  makeWriteCacheEffect,
  makeReadCacheExpression,
} from "../../cache.mjs";
import { makeBinaryExpression } from "../../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
import { makeHeaderPrelude, makeWarningPrelude } from "../../prelude.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  initSequence,
  liftSequenceX,
  liftSequenceX_,
  liftSequenceX___,
  liftSequence_X,
  liftSequence__X_,
  zeroSequence,
} from "../../../sequence.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "../error.mjs";
import { makeScopeParameterExpression } from "./parameter.mjs";

const {
  Array: { of: toArray },
} = globalThis;

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   binding: import("../../query/hoist-public").Binding,
 *   mode: "strict" | "sloppy",
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").HeaderPrelude
 *     | import("../../prelude").PrefixPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *   ),
 *   [
 *     import("../../../estree").Variable,
 *     import(".").AlienBinding,
 *   ],
 * >}
 */
export const setupAlienEntry = ({ meta }, binding, mode) => {
  if (binding.write === "ignore") {
    throw new AranError(
      "Silent constants are not supported in the root frame",
      { binding },
    );
  } else if (binding.write === "perform" || binding.write === "report") {
    switch (binding.baseline) {
      case "import": {
        throw new AranError("root frame does not support import binding", {
          binding,
        });
      }
      case "undefined": {
        return initSequence(
          [
            makeHeaderPrelude({
              type: "declare",
              mode,
              kind: "var",
              variable: binding.variable,
            }),
          ],
          [binding.variable, { deadzone: null, write: binding.write }],
        );
      }
      case "deadzone": {
        const ts_narrow_write = binding.write;
        return bindSequence(cacheWritable(meta, "aran.deadzone"), (deadzone) =>
          initSequence(
            [
              makeHeaderPrelude({
                type: "declare",
                mode,
                kind: "let",
                variable: binding.variable,
              }),
            ],
            [binding.variable, { deadzone, write: ts_narrow_write }],
          ),
        );
      }
      default: {
        throw new AranTypeError(binding.baseline);
      }
    }
  } else {
    throw new AranTypeError(binding.write);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   write: import("../../query/hoist-public").Write,
 *   operation: import("../operation").WriteOperation,
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").HeaderPrelude
 *     | import("../../prelude").EarlyErrorPrelude
 *   ),
 *   import("../../atom").Effect[],
 * >}
 */
const listAlienWriteEffect = ({ path }, write, operation) => {
  switch (write) {
    case "perform": {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          liftSequenceX___(
            makeApplyExpression,
            makeScopeParameterExpression(
              operation.mode,
              "scope.write",
              operation.variable,
              path,
            ),
            makeIntrinsicExpression("undefined", path),
            [
              makePrimitiveExpression(operation.mode, path),
              makePrimitiveExpression(operation.variable, path),
              operation.right,
            ],
            path,
          ),
          path,
        ),
      );
    }
    // Global const are turned into global let.
    // Alhough other programs wiull be able able to write it,
    // we can at least prevent this program from writting it.
    case "report": {
      return zeroSequence([
        makeExpressionEffect(
          makeThrowConstantExpression(operation.variable, path),
          path,
        ),
      ]);
    }
    case "ignore": {
      return EMPTY_SEQUENCE;
    }
    default: {
      throw new AranTypeError(write);
    }
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: null | import(".").AlienBinding,
 *   operation: import("../operation").VariableSaveOperation,
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").WarningPrelude
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").HeaderPrelude
 *   ),
 *   import("../../atom").Effect[],
 * >}
 */
export const makeAlienSaveEffect = ({ path }, binding, operation) => {
  if (operation.type === "late-declare") {
    switch (operation.mode) {
      case "sloppy": {
        return initSequence(
          [
            makeWarningPrelude({
              name: "DirectEvalExternalVariableDeclaration",
              message:
                "Ignoring external variable declaration in deep eval code",
              path,
            }),
          ],
          EMPTY,
        );
      }
      default: {
        throw new AranTypeError(operation);
      }
    }
  } else if (operation.type === "initialize") {
    return liftSequence_X(
      concat,
      binding !== null && binding.deadzone !== null
        ? [
            makeWriteCacheEffect(
              binding.deadzone,
              makeIntrinsicExpression("undefined", path),
              path,
            ),
          ]
        : EMPTY,
      operation.right !== null
        ? liftSequenceX(
            toArray,
            liftSequenceX_(
              makeExpressionEffect,
              liftSequenceX___(
                makeApplyExpression,
                makeScopeParameterExpression(
                  operation.mode,
                  "scope.write",
                  operation.variable,
                  path,
                ),
                makeIntrinsicExpression("undefined", path),
                [
                  makePrimitiveExpression(operation.mode, path),
                  makePrimitiveExpression(operation.variable, path),
                  operation.right,
                ],
                path,
              ),
              path,
            ),
          )
        : EMPTY_SEQUENCE,
    );
  } else if (operation.type === "write") {
    if (binding !== null && binding.deadzone !== null) {
      return liftSequenceX(
        toArray,
        liftSequence__X_(
          makeConditionalEffect,
          makeBinaryExpression(
            "===",
            makeReadCacheExpression(binding.deadzone, path),
            makeIntrinsicExpression("aran.deadzone", path),
            path,
          ),
          [
            makeExpressionEffect(
              makeThrowDeadzoneExpression(operation.variable, path),
              path,
            ),
          ],
          listAlienWriteEffect({ path }, binding.write, operation),
          path,
        ),
      );
    } else {
      return listAlienWriteEffect(
        { path },
        binding === null ? "perform" : binding.write,
        operation,
      );
    }
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: null | import(".").AlienBinding,
 *   operation: import("../operation").VariableLoadOperation,
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").HeaderPrelude
 *   ),
 *   import("../../atom").Expression,
 * >}
 */
export const makeAlienLoadExpression = ({ path }, binding, operation) => {
  const node = liftSequenceX___(
    makeApplyExpression,
    makeScopeParameterExpression(
      operation.mode,
      `scope.${operation.type}`,
      operation.variable,
      path,
    ),
    makeIntrinsicExpression("undefined", path),
    [
      makePrimitiveExpression(operation.mode, path),
      makePrimitiveExpression(operation.variable, path),
    ],
    path,
  );
  if (
    (operation.type === "read" || operation.type === "typeof") &&
    binding !== null &&
    binding.deadzone !== null
  ) {
    return liftSequence__X_(
      makeConditionalExpression,
      makeBinaryExpression(
        "===",
        makeReadCacheExpression(binding.deadzone, path),
        makeIntrinsicExpression("aran.deadzone", path),
        path,
      ),
      makeThrowDeadzoneExpression(operation.variable, path),
      node,
      path,
    );
  } else {
    return node;
  }
};
