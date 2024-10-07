import { AranExecError, AranTypeError } from "../../../report.mjs";
import { EMPTY, concatXX, concat_, concat_XXX } from "../../../util/index.mjs";
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
  makeNativeExternalPrelude,
  makeWarningPrelude,
} from "../../prelude/index.mjs";
import {
  EMPTY_SEQUENCE,
  initSequence,
  liftSequenceX,
  liftSequence__X_,
  zeroSequence,
} from "../../../sequence.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "../error.mjs";
import { mangleConstantMetaVariable } from "../../mangle.mjs";

/**
 * @type {(
 *   baseline: import("../../annotation/hoisting").Baseline,
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
    case "none": {
      return null;
    }
    default: {
      throw new AranTypeError(baseline);
    }
  }
};

/**
 * @type {(
 *   baseline: import("../../annotation/hoisting").Baseline,
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
    case "none": {
      return "var";
    }
    default: {
      throw new AranTypeError(baseline);
    }
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   binding: import("../../annotation/hoisting").Binding,
 *   mode: "strict" | "sloppy",
 * ) => null | import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").HeaderPrelude
 *     | import("../../prelude").PrefixPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").WarningPrelude
 *   ),
 *   [
 *     import("estree-sentry").VariableName,
 *     import(".").AlienBinding,
 *   ],
 * >}
 */
export const setupAlienEntry = (hash, meta, binding, mode) => {
  if (binding.write === "ignore") {
    throw new AranExecError("silent constants should not occur in root frame", {
      hash,
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
          kind: getDeclareKind(binding.baseline),
          variable: binding.variable,
        }),
        deadzone === null
          ? EMPTY
          : [
              makeMetaDeclarationPrelude([deadzone, "aran.deadzone"]),
              makeWarningPrelude({
                name: "ExternalDeadzone",
                hash,
              }),
            ],
        binding.write === "report"
          ? [makeWarningPrelude({ name: "ExternalConstant", hash })]
          : EMPTY,
        binding.sloppy_function !== null
          ? [makeWarningPrelude({ name: "ExternalSloppyFunction", hash })]
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
 *   hash: import("../../../hash").Hash,
 * ) => null | import("../../atom").Expression}
 */
const makeRightExpression = (operation, hash) => {
  switch (operation.type) {
    case "write": {
      return operation.right;
    }
    case "write-sloppy-function": {
      if (operation.right === null) {
        return null;
      } else {
        return makeReadExpression(operation.right, hash);
      }
    }
    default: {
      throw new AranTypeError(operation);
    }
  }
};

/**
 * @type {{
 *   sloppy: "Sloppy",
 *   strict: "Strict",
 * }}
 */
const MODE = {
  sloppy: "Sloppy",
  strict: "Strict",
};

/**
 * @type {(
 *   operation: "write" | "discard" | "read" | "typeof",
 *   mode: "strict" | "sloppy",
 *   sort: import(".").Sort,
 *   hash: import("../../../hash").Hash,
 * ) => import("../../atom").Expression}
 */
const resolveArrowExpression = (operation, mode, sort, hash) => {
  if (sort === "script" || sort === "module" || sort === "eval.global") {
    if (operation === "write") {
      return makeIntrinsicExpression(`aran.writeGlobal${MODE[mode]}`, hash);
    } else if (
      operation === "read" ||
      operation === "typeof" ||
      operation === "discard"
    ) {
      return makeIntrinsicExpression(`aran.${operation}Global`, hash);
    } else {
      throw new AranTypeError(operation);
    }
  } else if (sort === "eval.local.root") {
    if (operation === "write") {
      return makeReadExpression(`scope.write${MODE[mode]}`, hash);
    } else if (
      operation === "read" ||
      operation === "typeof" ||
      operation === "discard"
    ) {
      return makeReadExpression(`scope.${operation}`, hash);
    } else {
      throw new AranTypeError(operation);
    }
  } else {
    throw new AranTypeError(sort);
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   sort: import(".").Sort,
 *   write: "perform" | "report",
 *   operation: (
 *     | import("../operation").WriteOperation
 *     | import("../operation").WriteSloppyFunctionOperation
 *   ),
 * ) => import("../../../sequence").Sequence<
 *   never,
 *   import("../../atom").Effect[],
 * >}
 */
const listAlienWriteEffect = (hash, sort, write, operation) => {
  switch (write) {
    case "perform": {
      const right = makeRightExpression(operation, hash);
      if (right === null) {
        return EMPTY_SEQUENCE;
      } else {
        return zeroSequence([
          makeExpressionEffect(
            makeApplyExpression(
              resolveArrowExpression("write", operation.mode, sort, hash),
              makeIntrinsicExpression("undefined", hash),
              [makePrimitiveExpression(operation.variable, hash), right],
              hash,
            ),
            hash,
          ),
        ]);
      }
    }
    // Global const are turned into global let.
    // Alhough other programs will be able able to write it,
    // we can at least prevent this program from writting it.
    case "report": {
      return zeroSequence([
        makeExpressionEffect(
          makeThrowConstantExpression(operation.variable, hash),
          hash,
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
 *   hash: import("../../../hash").Hash,
 *   sort: import(".").Sort,
 *   binding: null | import(".").AlienBinding,
 *   operation: import("../operation").VariableSaveOperation,
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").WarningPrelude
 *     | import("../../prelude").NativeExternalPrelude
 *   ),
 *   import("../../atom").Effect[],
 * >}
 */
export const makeAlienSaveEffect = (hash, sort, binding, operation) => {
  if (operation.type === "late-declare") {
    switch (operation.mode) {
      case "sloppy": {
        if (sort === "eval.local.root") {
          return initSequence(
            [
              makeWarningPrelude({
                name: "ExternalLateDeclaration",
                hash,
              }),
            ],
            EMPTY,
          );
        } else if (
          sort === "eval.global" ||
          sort === "script" ||
          sort === "module"
        ) {
          return initSequence(
            [makeNativeExternalPrelude(operation.variable)],
            EMPTY,
          );
        } else {
          throw new AranTypeError(sort);
        }
      }
      default: {
        throw new AranTypeError(operation);
      }
    }
  } else if (operation.type === "initialize") {
    return zeroSequence(
      concatXX(
        operation.right !== null
          ? [
              makeExpressionEffect(
                makeApplyExpression(
                  resolveArrowExpression("write", operation.mode, sort, hash),
                  makeIntrinsicExpression("undefined", hash),
                  [
                    makePrimitiveExpression(operation.variable, hash),
                    operation.right,
                  ],
                  hash,
                ),
                hash,
              ),
            ]
          : EMPTY,
        binding !== null && binding.deadzone !== null
          ? [
              makeWriteEffect(
                binding.deadzone,
                makeIntrinsicExpression("undefined", hash),
                hash,
              ),
            ]
          : EMPTY,
      ),
    );
  } else if (
    operation.type === "write" ||
    operation.type === "write-sloppy-function"
  ) {
    if (binding !== null && binding.deadzone !== null) {
      return liftSequenceX(
        concat_,
        liftSequence__X_(
          makeConditionalEffect,
          makeBinaryExpression(
            "===",
            makeReadExpression(binding.deadzone, hash),
            makeIntrinsicExpression("aran.deadzone", hash),
            hash,
          ),
          [
            makeExpressionEffect(
              makeThrowDeadzoneExpression(operation.variable, hash),
              hash,
            ),
          ],
          listAlienWriteEffect(hash, sort, binding.write, operation),
          hash,
        ),
      );
    } else {
      return listAlienWriteEffect(
        hash,
        sort,
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
 *   hash: import("../../../hash").Hash,
 *   sort: import(".").Sort,
 *   binding: null | import(".").AlienBinding,
 *   operation: Exclude<
 *     import("../operation").VariableLoadOperation,
 *     import("../operation").ReadAmbientThisOperation
 *   >,
 * ) => import("../../../sequence").Sequence<
 *   never,
 *   import("../../atom").Expression,
 * >}
 */
export const makeAlienLoadExpression = (hash, sort, binding, operation) => {
  const live = makeApplyExpression(
    resolveArrowExpression(operation.type, operation.mode, sort, hash),
    makeIntrinsicExpression("undefined", hash),
    [makePrimitiveExpression(operation.variable, hash)],
    hash,
  );
  if (
    (operation.type === "read" || operation.type === "typeof") &&
    binding !== null &&
    binding.deadzone !== null
  ) {
    return zeroSequence(
      makeConditionalExpression(
        makeBinaryExpression(
          "===",
          makeReadExpression(binding.deadzone, hash),
          makeIntrinsicExpression("aran.deadzone", hash),
          hash,
        ),
        makeThrowDeadzoneExpression(operation.variable, hash),
        live,
        hash,
      ),
    );
  } else {
    return zeroSequence(live);
  }
};
