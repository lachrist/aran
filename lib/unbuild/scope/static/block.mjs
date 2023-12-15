import { map } from "../../../util/index.mjs";
import {
  makeExportEffect,
  makeExpressionEffect,
  makeConditionalExpression,
  makeConditionalEffect,
  makePrimitiveExpression,
  makeReadBaseExpression,
  makeWriteBaseEffect,
  makeIntrinsicExpression,
} from "../../node.mjs";
import { makeBinaryExpression, makeUnaryExpression } from "../../intrinsic.mjs";
import {
  makeThrowDeadzoneExpression,
  makeThrowConstantExpression,
} from "../error.mjs";
import { mangleBaseVariable } from "../../mangle.mjs";
import { makeReadCacheExpression } from "../../cache.mjs";
import { AranTypeError } from "../../../error.mjs";

/**
 * @type {(
 *   site: {},
 *   context: {},
 *   options: {
 *     binding: import("./block.d.ts").BlockBinding,
 *     variable: estree.Variable,
 *   },
 * ) => unbuild.Variable[]}
 */
export const listBlockVariable = (_site, _context, { variable }) => [
  mangleBaseVariable(variable),
];

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     kind: "var" | "let" | "const" | "callee",
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeInitialExpression = ({ path }, _context, { kind }) => {
  if (kind === "var" || kind === "callee") {
    return makePrimitiveExpression({ undefined: null }, path);
  } else if (kind === "let" || kind === "const") {
    return makeIntrinsicExpression("aran.deadzone", path);
  } else {
    throw new AranTypeError(`invalid binding kind: ${kind}`);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     binding: import("./block.d.ts").BlockBinding,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listBlockDeclarationEffect = (
  { path },
  context,
  { binding, variable },
) => [
  makeWriteBaseEffect(
    mangleBaseVariable(variable),
    makeInitialExpression({ path }, context, { kind: binding.kind }),
    path,
  ),
];

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     operation: "initialize" | "write",
 *     binding: import("./block.d.ts").BlockBinding,
 *     variable: estree.Variable,
 *     right: import("../../cache.js").Cache | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listBlockSaveEffect = (
  { path },
  context,
  { operation, binding: { kind, export: specifiers }, variable, right },
) => {
  switch (operation) {
    case "initialize": {
      return [
        ...((kind === "var" || kind === "callee") && right === null
          ? []
          : [
              makeWriteBaseEffect(
                mangleBaseVariable(variable),
                right === null
                  ? makePrimitiveExpression({ undefined: null }, path)
                  : makeReadCacheExpression(right, path),
                path,
              ),
            ]),
        ...(right === null
          ? []
          : map(specifiers, (specifier) =>
              makeExportEffect(
                specifier,
                makeReadBaseExpression(mangleBaseVariable(variable), path),
                path,
              ),
            )),
      ];
    }
    case "write": {
      if (right === null) {
        return [];
      } else {
        switch (kind) {
          case "var": {
            return [
              makeWriteBaseEffect(
                mangleBaseVariable(variable),
                makeReadCacheExpression(right, path),
                path,
              ),
              ...map(specifiers, (specifier) =>
                makeExportEffect(
                  specifier,
                  makeReadBaseExpression(mangleBaseVariable(variable), path),
                  path,
                ),
              ),
            ];
          }
          case "callee": {
            return [
              ...(context.mode === "sloppy"
                ? []
                : [
                    makeExpressionEffect(
                      makeThrowConstantExpression(variable, path),
                      path,
                    ),
                  ]),
            ];
          }
          case "const": {
            return [
              makeConditionalEffect(
                makeBinaryExpression(
                  "===",
                  makeReadBaseExpression(mangleBaseVariable(variable), path),
                  makeIntrinsicExpression("aran.deadzone", path),
                  path,
                ),
                [
                  makeExpressionEffect(
                    makeThrowDeadzoneExpression(variable, path),
                    path,
                  ),
                ],
                [
                  makeExpressionEffect(
                    makeThrowConstantExpression(variable, path),
                    path,
                  ),
                ],
                path,
              ),
            ];
          }
          case "let": {
            return [
              makeConditionalEffect(
                makeBinaryExpression(
                  "===",
                  makeReadBaseExpression(mangleBaseVariable(variable), path),
                  makeIntrinsicExpression("aran.deadzone", path),
                  path,
                ),
                [
                  makeExpressionEffect(
                    makeThrowDeadzoneExpression(variable, path),
                    path,
                  ),
                ],
                [
                  makeWriteBaseEffect(
                    mangleBaseVariable(variable),
                    makeReadCacheExpression(right, path),
                    path,
                  ),
                  ...map(specifiers, (specifier) =>
                    makeExportEffect(
                      specifier,
                      makeReadBaseExpression(
                        mangleBaseVariable(variable),
                        path,
                      ),
                      path,
                    ),
                  ),
                ],
                path,
              ),
            ];
          }
          default: {
            throw new AranTypeError(`invalid binding kind: ${kind}`);
          }
        }
      }
    }
    default: {
      throw new AranTypeError("invalid save operation", operation);
    }
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     operation: "read" | "typeof" | "discard",
 *     binding: import("./block.d.ts").BlockBinding,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBlockLoadExpression = (
  { path },
  _context,
  { operation, binding: { kind }, variable },
) => {
  switch (operation) {
    case "read": {
      if (kind === "var" || kind === "callee") {
        return makeReadBaseExpression(mangleBaseVariable(variable), path);
      } else if (kind === "let" || kind === "const") {
        return makeConditionalExpression(
          makeBinaryExpression(
            "===",
            makeReadBaseExpression(mangleBaseVariable(variable), path),
            makeIntrinsicExpression("aran.deadzone", path),
            path,
          ),
          makeThrowDeadzoneExpression(variable, path),
          makeReadBaseExpression(mangleBaseVariable(variable), path),
          path,
        );
      } else {
        throw new AranTypeError(`invalid binding kind: ${kind}`);
      }
    }
    case "typeof": {
      if (kind === "var" || kind === "callee") {
        return makeUnaryExpression(
          "typeof",
          makeReadBaseExpression(mangleBaseVariable(variable), path),
          path,
        );
      } else if (kind === "let" || kind === "const") {
        return makeConditionalExpression(
          makeBinaryExpression(
            "===",
            makeReadBaseExpression(mangleBaseVariable(variable), path),
            makeIntrinsicExpression("aran.deadzone", path),
            path,
          ),
          makeThrowDeadzoneExpression(variable, path),
          makeUnaryExpression(
            "typeof",
            makeReadBaseExpression(mangleBaseVariable(variable), path),
            path,
          ),
          path,
        );
      } else {
        throw new AranTypeError(`invalid binding kind: ${kind}`);
      }
    }
    case "discard": {
      return makePrimitiveExpression(false, path);
    }
    default: {
      throw new AranTypeError("invalid load operation", operation);
    }
  }
};
