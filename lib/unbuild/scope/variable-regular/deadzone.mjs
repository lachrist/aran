import { map } from "../../../util/index.mjs";
import {
  makeExportEffect,
  makeExpressionEffect,
  makeConditionalExpression,
  makeConditionalEffect,
  makePrimitiveExpression,
  makeReadExpression,
  makeWriteEffect,
  makeIntrinsicExpression,
  concatEffect,
} from "../../node.mjs";
import { makeBinaryExpression, makeUnaryExpression } from "../../intrinsic.mjs";
import {
  makeThrowDeadzoneExpression,
  makeThrowConstantExpression,
  reportDuplicate,
} from "../error.mjs";
import { mangleBaseVariable } from "../../mangle.mjs";
import { makeReadCacheExpression } from "../../cache.mjs";
import { AranTypeError } from "../../../error.mjs";
import { bindSequence, initSequence } from "../../sequence.mjs";
import {
  makeEffectPrelude,
  makeBaseDeclarationPrelude,
} from "../../prelude.mjs";
import { listEarlyErrorEffect } from "../../early-error.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   entry: [
 *     variable: estree.Variable,
 *     kind: import(".").DeadzoneBinding,
 *   ],
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").BodyPrelude,
 *   null,
 * >}
 */
export const setupDeadzoneBinding = ({ path }, [variable, _binding]) =>
  bindSequence(
    makeWriteEffect(
      mangleBaseVariable(variable),
      makeIntrinsicExpression("aran.deadzone", path),
      path,
    ),
    (setup) =>
      initSequence(
        [
          makeBaseDeclarationPrelude(mangleBaseVariable(variable)),
          ...map(setup, makeEffectPrelude),
        ],
        null,
      ),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").DeadzoneBinding,
 *   operation: import("..").VariableSaveOperation,
 * ) => import("../../sequence").EffectSequence}
 */
export const listDeadzoneSaveEffect = ({ path }, binding, operation) => {
  if (operation.type === "initialize") {
    if (binding.kind === operation.kind) {
      if (operation.right === null) {
        return makeWriteEffect(
          mangleBaseVariable(operation.variable),
          makePrimitiveExpression({ undefined: null }, path),
          path,
        );
      } else {
        return concatEffect([
          makeWriteEffect(
            mangleBaseVariable(operation.variable),
            makeReadCacheExpression(operation.right, path),
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
    } else {
      return listEarlyErrorEffect(reportDuplicate(operation.variable), path);
    }
  } else if (operation.type === "write") {
    if (binding.kind === "const") {
      return makeConditionalEffect(
        makeBinaryExpression(
          "===",
          makeReadExpression(mangleBaseVariable(operation.variable), path),
          makeIntrinsicExpression("aran.deadzone", path),
          path,
        ),
        makeExpressionEffect(
          makeThrowDeadzoneExpression(operation.variable, path),
          path,
        ),
        makeExpressionEffect(
          makeThrowConstantExpression(operation.variable, path),
          path,
        ),
        path,
      );
    } else if (binding.kind === "let" || binding.kind === "class") {
      return makeConditionalEffect(
        makeBinaryExpression(
          "===",
          makeReadExpression(mangleBaseVariable(operation.variable), path),
          makeIntrinsicExpression("aran.deadzone", path),
          path,
        ),
        makeExpressionEffect(
          makeThrowDeadzoneExpression(operation.variable, path),
          path,
        ),
        concatEffect([
          makeWriteEffect(
            mangleBaseVariable(operation.variable),
            makeReadCacheExpression(operation.right, path),
            path,
          ),
          ...map(binding.export, (specifier) =>
            makeExportEffect(
              specifier,
              makeReadExpression(mangleBaseVariable(operation.variable), path),
              path,
            ),
          ),
        ]),
        path,
      );
    } else {
      throw new AranTypeError(binding.kind);
    }
  } else if (operation.type === "declare") {
    return listEarlyErrorEffect(reportDuplicate(operation.variable), path);
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").DeadzoneBinding,
 *   operation: import("..").VariableLoadOperation,
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeDeadzoneLoadExpression = ({ path }, _binding, operation) => {
  switch (operation.type) {
    case "read": {
      return makeConditionalExpression(
        makeBinaryExpression(
          "===",
          makeReadExpression(mangleBaseVariable(operation.variable), path),
          makeIntrinsicExpression("aran.deadzone", path),
          path,
        ),
        makeThrowDeadzoneExpression(operation.variable, path),
        makeReadExpression(mangleBaseVariable(operation.variable), path),
        path,
      );
    }
    case "typeof": {
      return makeConditionalExpression(
        makeBinaryExpression(
          "===",
          makeReadExpression(mangleBaseVariable(operation.variable), path),
          makeIntrinsicExpression("aran.deadzone", path),
          path,
        ),
        makeThrowDeadzoneExpression(operation.variable, path),
        makeUnaryExpression(
          "typeof",
          makeReadExpression(mangleBaseVariable(operation.variable), path),
          path,
        ),
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
