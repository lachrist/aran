import { map } from "../../../util/index.mjs";
import {
  EMPTY_EFFECT,
  concatEffect,
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
import { listEarlyErrorEffect } from "../../early-error.mjs";
import { makeThrowConstantExpression, reportDuplicate } from "../error.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   entry: [
 *     estree.Variable,
 *     import(".").LifespanBinding,
 *   ],
 * ) => import("../../prelude").FramePrelude[]}
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
 * ) => import("../../sequence").EffectSequence}
 */
export const listLifespanSaveEffect = ({ path }, binding, operation) => {
  if (operation.type === "initialize") {
    if (operation.kind === "var" || operation.kind === "val") {
      if (operation.right === null) {
        return EMPTY_EFFECT;
      } else {
        return concatEffect([
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
      return listEarlyErrorEffect(reportDuplicate(operation.variable), path);
    } else {
      throw new AranTypeError(operation.kind);
    }
  } else if (operation.type === "write") {
    if (binding.writable === false) {
      if (operation.mode === "sloppy") {
        return EMPTY_EFFECT;
      } else if (operation.mode === "strict") {
        return makeExpressionEffect(
          makeThrowConstantExpression(operation.variable, path),
          path,
        );
      } else {
        throw new AranTypeError(operation.mode);
      }
    } else if (binding.writable === true) {
      return concatEffect([
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
    return EMPTY_EFFECT;
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").LifespanBinding,
 *   operation: import("../operation").VariableLoadOperation,
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeLifespanLoadExpression = ({ path }, _binding, operation) => {
  switch (operation.type) {
    case "read": {
      return makeReadExpression(mangleBaseVariable(operation.variable), path);
    }
    case "typeof": {
      return makeUnaryExpression(
        "typeof",
        makeReadExpression(mangleBaseVariable(operation.variable), path),
        path,
      );
    }
    case "discard": {
      return makePrimitiveExpression(false, path);
    }
    default: {
      throw new AranTypeError(operation);
    }
  }
};
