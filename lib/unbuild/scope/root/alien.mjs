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
  liftSequence_X,
  liftSequence__X_,
  zeroSequence,
} from "../../../sequence.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "../error.mjs";
import { mangleConstantMetaVariable } from "../../mangle.mjs";
import { resolve } from "node:path";

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
        binding.sloppy_function !== null
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
 *   operation: "write" | "discard" | "read" | "typeof",
 *   sort: import(".").Sort,
 *   path: import("../../../path").Path,
 * ) => import("../../atom").Expression}
 */
const resolveArrowExpression = (operation, sort, path) => {
  if (sort === "script" || sort === "module" || sort === "eval.global") {
    return makeIntrinsicExpression(`aran.${operation}Global`, path);
  } else if (sort === "eval.local.root") {
    return makeReadExpression(`scope.${operation}`, path);
  } else {
    throw new AranTypeError(sort);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
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
const listAlienWriteEffect = ({ path }, sort, write, operation) => {
  switch (write) {
    case "perform": {
      const right = makeRightExpression(operation, path);
      if (right === null) {
        return EMPTY_SEQUENCE;
      } else {
        const conduct = makeApplyExpression(
          resolveArrowExpression("write", sort, path),
          makeIntrinsicExpression("undefined", path),
          [makePrimitiveExpression(operation.variable, path), right],
          path,
        );
        switch (operation.mode) {
          case "sloppy": {
            return zeroSequence([makeExpressionEffect(conduct, path)]);
          }
          case "strict": {
            return zeroSequence([
              makeConditionalEffect(
                conduct,
                EMPTY,
                [
                  makeExpressionEffect(
                    makeThrowConstantExpression(operation.variable, path),
                    path,
                  ),
                ],
                path,
              ),
            ]);
          }
          default: {
            throw new AranTypeError(operation);
          }
        }
      }
    }
    // Global const are turned into global let.
    // Alhough other programs will be able able to write it,
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
 *   sort: import(".").Sort,
 *   binding: null | import(".").AlienBinding,
 *   operation: import("../operation").VariableSaveOperation,
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").WarningPrelude,
 *   import("../../atom").Effect[],
 * >}
 */
export const makeAlienSaveEffect = ({ path }, sort, binding, operation) => {
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
        ? zeroSequence([
            makeExpressionEffect(
              makeApplyExpression(
                resolveArrowExpression("write", sort, path),
                makeIntrinsicExpression("undefined", path),
                [
                  makePrimitiveExpression(operation.variable, path),
                  operation.right,
                ],
                path,
              ),
              path,
            ),
          ])
        : EMPTY_SEQUENCE,
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
          listAlienWriteEffect({ path }, sort, binding.write, operation),
          path,
        ),
      );
    } else {
      return listAlienWriteEffect(
        { path },
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
 *   site: import("../../site").VoidSite,
 *   sort: import(".").Sort,
 *   binding: null | import(".").AlienBinding,
 *   operation: import("../operation").VariableLoadOperation,
 * ) => import("../../../sequence").Sequence<
 *   never,
 *   import("../../atom").Expression,
 * >}
 */
export const makeAlienLoadExpression = ({ path }, sort, binding, operation) => {
  const live = makeApplyExpression(
    resolveArrowExpression(operation.type, sort, path),
    makeIntrinsicExpression("undefined", path),
    [makePrimitiveExpression(operation.variable, path)],
    path,
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
          makeReadExpression(binding.deadzone, path),
          makeIntrinsicExpression("aran.deadzone", path),
          path,
        ),
        makeThrowDeadzoneExpression(operation.variable, path),
        live,
        path,
      ),
    );
  } else {
    return zeroSequence(live);
  }
};
