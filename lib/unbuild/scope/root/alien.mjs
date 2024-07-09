import { AranError, AranTypeError } from "../../../error.mjs";
import { EMPTY, concat, concat_, concat_XXX } from "../../../util/index.mjs";
import { makeBinaryExpression } from "../../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeWriteEffect,
} from "../../node.mjs";
import {
  makeHeaderPrelude,
  makeMetaDeclarationPrelude,
  makeWarningPrelude,
} from "../../prelude.mjs";
import {
  EMPTY_SEQUENCE,
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
import { mangleConstantMetaVariable } from "../../mangle.mjs";

const {
  Array: { of: toArray },
} = globalThis;

/**
 * @type {(
 *   baseline: "live" | "dead",
 *   meta: import("../../meta").Meta,
 * ) => null | import("../../variable").ConstantMetaVariable}
 */
const mangleDeadzoneVariable = (baseline, meta) => {
  switch (baseline) {
    case "dead": {
      return mangleConstantMetaVariable(meta);
    }
    case "live": {
      return null;
    }
    default: {
      throw new AranTypeError(baseline);
    }
  }
};

/**
 * @type {(
 *   baseline: "live" | "dead",
 * ) => "var" | "let"}
 */
const getDeclareKind = (baseline) => {
  switch (baseline) {
    case "live": {
      return "var";
    }
    case "dead": {
      return "let";
    }
    default: {
      throw new AranTypeError(baseline);
    }
  }
};

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   binding: import("../../query/hoist-public").Binding,
 *   mode: "strict" | "sloppy",
 * ) => null | import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").HeaderPrelude
 *     | import("../../prelude").PrefixPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").WarningPrelude
 *   ),
 *   [
 *     import("../../../estree").Variable,
 *     import(".").AlienBinding,
 *   ],
 * >}
 */
export const setupAlienEntry = ({ path, meta }, binding, mode) => {
  if (binding.write === "ignore") {
    throw new AranError("silent constants should not occur in root frame", {
      path,
      meta,
      binding,
      mode,
    });
  } else if (binding.write === "perform" || binding.write === "report") {
    const deadzone = mangleDeadzoneVariable(binding.baseline, meta);
    return initSequence(
      concat_XXX(
        makeHeaderPrelude({
          type: "declare",
          mode,
          kind: getDeclareKind(binding.baseline),
          variable: binding.variable,
        }),
        deadzone === null
          ? EMPTY
          : [
              makeMetaDeclarationPrelude([deadzone, "aran.deadzone"]),
              makeWarningPrelude({
                name: "ExternalDeadzone",
                path,
              }),
            ],
        binding.write === "report"
          ? [makeWarningPrelude({ name: "ExternalConstant", path })]
          : EMPTY,
        binding.sloppy_function_away_counter >
          binding.sloppy_function_near_counter
          ? [makeWarningPrelude({ name: "ExternalSloppyFunction", path })]
          : EMPTY,
      ),
      [binding.variable, { deadzone, write: binding.write }],
    );
  } else {
    throw new AranTypeError(binding.write);
  }
};

/**
 * @type {(
 *   operation: (
 *     | import("../operation").WriteOperation
 *     | import("../operation").WriteSloppyFunctionOperation
 *   ),
 *   path: import("../../../path").Path,
 * ) => null | import("../../atom").Expression}
 */
const makeRightExpression = (operation, path) => {
  switch (operation.type) {
    case "write": {
      return operation.right;
    }
    case "write-sloppy-function": {
      if (operation.right === null) {
        return null;
      } else {
        return makeReadExpression(operation.right, path);
      }
    }
    default: {
      throw new AranTypeError(operation);
    }
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   write: "perform" | "report",
 *   operation: (
 *     | import("../operation").WriteOperation
 *     | import("../operation").WriteSloppyFunctionOperation
 *   ),
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
      const right = makeRightExpression(operation, path);
      if (right === null) {
        return EMPTY_SEQUENCE;
      } else {
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
                right,
              ],
              path,
            ),
            path,
          ),
        );
      }
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
              name: "LateExternalVariable",
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
            makeWriteEffect(
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
  } else if (
    operation.type === "write" ||
    operation.type === "write-sloppy-function"
  ) {
    if (binding !== null && binding.deadzone !== null) {
      return liftSequenceX(
        toArray,
        liftSequence__X_(
          makeConditionalEffect,
          makeBinaryExpression(
            "===",
            makeReadExpression(binding.deadzone, path),
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
        makeReadExpression(binding.deadzone, path),
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
