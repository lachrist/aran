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
import { cacheConstant, makeReadCacheExpression } from "../../cache.mjs";
import { AranTypeError } from "../../../error.mjs";
import { bindSequence, initSequence, prefixEffect } from "../../sequence.mjs";
import { makeBaseDeclarationPrelude } from "../../prelude.mjs";
import { listEarlyErrorEffect } from "../../early-error.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   entry: [
 *     variable: estree.Variable,
 *     kind: import(".").DeadzoneBinding,
 *   ],
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").FramePrelude,
 *   null,
 * >}
 */
export const setupDeadzoneBinding = (_site, [variable, _binding]) =>
  initSequence(
    [
      makeBaseDeclarationPrelude([
        mangleBaseVariable(variable),
        {
          type: "intrinsic",
          intrinsic: "aran.deadzone",
        },
      ]),
    ],
    null,
  );

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   binding: import(".").DeadzoneBinding,
 *   operation: import("../operation").VariableSaveOperation,
 * ) => import("../../sequence").EffectSequence}
 */
export const listDeadzoneSaveEffect = ({ path, meta }, binding, operation) => {
  if (operation.type === "initialize") {
    if (operation.kind === "let" || operation.kind === "const") {
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
    } else if (operation.kind === "val" || operation.kind === "var") {
      return listEarlyErrorEffect(reportDuplicate(operation.variable), path);
    } else {
      throw new AranTypeError(operation.kind);
    }
  } else if (operation.type === "write") {
    if (binding.writable === false) {
      return concatEffect([
        makeExpressionEffect(operation.right, path),
        makeConditionalEffect(
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
        ),
      ]);
    } else if (binding.writable === true) {
      return prefixEffect(
        bindSequence(cacheConstant(meta, operation.right, path), (right) =>
          makeConditionalEffect(
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
                makeReadCacheExpression(right, path),
                path,
              ),
              ...map(binding.export, (specifier) =>
                makeExportEffect(
                  specifier,
                  makeReadExpression(
                    mangleBaseVariable(operation.variable),
                    path,
                  ),
                  path,
                ),
              ),
            ]),
            path,
          ),
        ),
      );
    } else {
      throw new AranTypeError(binding.writable);
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
 *   operation: import("../operation").VariableLoadOperation,
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
