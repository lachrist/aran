import { concat_, map } from "../../../util/index.mjs";
import {
  makeExportEffect,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeReadExpression,
  makeWriteEffect,
} from "../../node.mjs";
import { makeUnaryExpression } from "../../intrinsic.mjs";
import { mangleBaseVariable } from "../../mangle.mjs";
import { AranTypeError } from "../../../error.mjs";
import { makeBaseDeclarationPrelude } from "../../prelude.mjs";
import {
  makeEarlyErrorExpression,
  makeRegularEarlyError,
} from "../../early-error.mjs";
import { makeThrowConstantExpression, reportDuplicate } from "../error.mjs";
import {
  EMPTY_SEQUENCE,
  liftSequenceX,
  liftSequenceX_,
  zeroSequence,
} from "../../sequence.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   entry: [
 *     estree.Variable,
 *     import(".").LifespanBinding,
 *   ],
 * ) => import("../../prelude").BaseDeclarationPrelude[]}
 */
export const setupLifespanBinding = (_site, [variable, _binding]) => [
  makeBaseDeclarationPrelude([
    mangleBaseVariable(variable),
    {
      type: "primitive",
      primitive: { undefined: null },
    },
  ]),
];

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").LifespanBinding,
 *   operation: import("../operation").VariableSaveOperation,
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").EarlyErrorPrelude,
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
export const listLifespanSaveEffect = ({ path }, binding, operation) => {
  if (operation.type === "initialize") {
    if (operation.kind === "var" || operation.kind === "val") {
      if (operation.right === null) {
        return EMPTY_SEQUENCE;
      } else {
        return zeroSequence([
          makeWriteEffect(
            mangleBaseVariable(operation.variable),
            operation.right,
            path,
          ),
          ...map(binding.export, (specifier) =>
            makeExportEffect(
              specifier,
              makeReadExpression(mangleBaseVariable(operation.variable), path),
              path,
            ),
          ),
        ]);
      }
    } else if (operation.kind === "let" || operation.kind === "const") {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          makeEarlyErrorExpression(
            makeRegularEarlyError(reportDuplicate(operation.variable), path),
          ),
          path,
        ),
      );
    } else {
      throw new AranTypeError(operation.kind);
    }
  } else if (operation.type === "write") {
    if (binding.writable === false) {
      if (operation.mode === "sloppy") {
        return EMPTY_SEQUENCE;
      } else if (operation.mode === "strict") {
        return zeroSequence([
          makeExpressionEffect(
            makeThrowConstantExpression(operation.variable, path),
            path,
          ),
        ]);
      } else {
        throw new AranTypeError(operation.mode);
      }
    } else if (binding.writable === true) {
      return zeroSequence([
        makeWriteEffect(
          mangleBaseVariable(operation.variable),
          operation.right,
          path,
        ),
        ...map(binding.export, (specifier) =>
          makeExportEffect(
            specifier,
            makeReadExpression(mangleBaseVariable(operation.variable), path),
            path,
          ),
        ),
      ]);
    } else {
      throw new AranTypeError(binding.writable);
    }
  } else if (operation.type === "declare") {
    return EMPTY_SEQUENCE;
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").LifespanBinding,
 *   operation: import("../operation").VariableLoadOperation,
 * ) => import("../../sequence").Sequence<
 *   never,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const makeLifespanLoadExpression = ({ path }, _binding, operation) => {
  switch (operation.type) {
    case "read": {
      return zeroSequence(
        makeReadExpression(mangleBaseVariable(operation.variable), path),
      );
    }
    case "typeof": {
      return zeroSequence(
        makeUnaryExpression(
          "typeof",
          makeReadExpression(mangleBaseVariable(operation.variable), path),
          path,
        ),
      );
    }
    case "discard": {
      return zeroSequence(makePrimitiveExpression(false, path));
    }
    default: {
      throw new AranTypeError(operation);
    }
  }
};
