import { concat_, map } from "../../../util/index.mjs";
import {
  makeExportEffect,
  makeExpressionEffect,
  makeConditionalExpression,
  makeConditionalEffect,
  makePrimitiveExpression,
  makeReadExpression,
  makeWriteEffect,
  makeIntrinsicExpression,
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
import {
  liftSequenceX,
  liftSequenceX_,
  mapSequence,
  zeroSequence,
} from "../../sequence.mjs";
import { makeBaseDeclarationPrelude } from "../../prelude.mjs";
import {
  makeEarlyErrorExpression,
  makeRegularEarlyError,
} from "../../early-error.mjs";
import { incorporatePrefixEffect } from "../../prefix.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   entry: [
 *     variable: estree.Variable,
 *     kind: import(".").DeadzoneBinding,
 *   ],
 * ) => import("../../prelude").BaseDeclarationPrelude[]}
 */
export const setupDeadzoneBinding = (_site, [variable, _binding]) => [
  makeBaseDeclarationPrelude([
    mangleBaseVariable(variable),
    {
      type: "intrinsic",
      intrinsic: "aran.deadzone",
    },
  ]),
];

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   binding: import(".").DeadzoneBinding,
 *   operation: import("../operation").VariableSaveOperation,
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *   ),
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
export const listDeadzoneSaveEffect = ({ path, meta }, binding, operation) => {
  if (operation.type === "initialize") {
    if (operation.kind === "let" || operation.kind === "const") {
      if (operation.right === null) {
        return zeroSequence([
          makeWriteEffect(
            mangleBaseVariable(operation.variable),
            makePrimitiveExpression({ undefined: null }, path),
            path,
          ),
        ]);
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
    } else if (operation.kind === "val" || operation.kind === "var") {
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
      return zeroSequence([
        makeExpressionEffect(operation.right, path),
        makeConditionalEffect(
          makeBinaryExpression(
            "===",
            makeReadExpression(mangleBaseVariable(operation.variable), path),
            makeIntrinsicExpression("aran.deadzone", path),
            path,
          ),
          [
            makeExpressionEffect(
              makeThrowDeadzoneExpression(operation.variable, path),
              path,
            ),
          ],
          [
            makeExpressionEffect(
              makeThrowConstantExpression(operation.variable, path),
              path,
            ),
          ],
          path,
        ),
      ]);
    } else if (binding.writable === true) {
      return incorporatePrefixEffect(
        mapSequence(cacheConstant(meta, operation.right, path), (right) => [
          makeConditionalEffect(
            makeBinaryExpression(
              "===",
              makeReadExpression(mangleBaseVariable(operation.variable), path),
              makeIntrinsicExpression("aran.deadzone", path),
              path,
            ),
            [
              makeExpressionEffect(
                makeThrowDeadzoneExpression(operation.variable, path),
                path,
              ),
            ],
            [
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
            ],
            path,
          ),
        ]),
        path,
      );
    } else {
      throw new AranTypeError(binding.writable);
    }
  } else if (operation.type === "declare") {
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
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").DeadzoneBinding,
 *   operation: import("../operation").VariableLoadOperation,
 * ) => import("../../sequence").Sequence<
 *   never,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const makeDeadzoneLoadExpression = ({ path }, _binding, operation) => {
  switch (operation.type) {
    case "read": {
      return zeroSequence(
        makeConditionalExpression(
          makeBinaryExpression(
            "===",
            makeReadExpression(mangleBaseVariable(operation.variable), path),
            makeIntrinsicExpression("aran.deadzone", path),
            path,
          ),
          makeThrowDeadzoneExpression(operation.variable, path),
          makeReadExpression(mangleBaseVariable(operation.variable), path),
          path,
        ),
      );
    }
    case "typeof": {
      return zeroSequence(
        makeConditionalExpression(
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
