import { AranTypeError } from "../../../error.mjs";
import { guard } from "../../../util/index.mjs";
import { listWriteCacheEffect, makeReadCacheExpression } from "../../cache.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeReadParameterExpression,
} from "../../node.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "../error.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     binding: import("./external").ExternalBinding,
 *     variable: estree.Variable,
 *   },
 * ) => import("../../../../type/unbuild").Log[]}
 */
export const listExternalLog = ({ path }, _context, { binding, variable }) => {
  switch (binding.kind) {
    case "var": {
      return [];
    }
    case "let": {
      return [
        {
          name: "ExternalLet",
          message: `Outside sources will not honor the deadzone of external 'let ${variable}'`,
          path,
        },
      ];
    }
    case "const": {
      return [
        {
          name: "ExternalConst",
          message: `Outside sources will not honor the deadzone and immutability of external 'const ${variable}'`,
          path,
        },
      ];
    }
    default: {
      throw new AranTypeError("invalid binding", binding);
    }
  }
};

/**
 * @type {(
 *   site: {},
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     binding: import("./external").ExternalBinding,
 *     variable: estree.Variable,
 *   },
 * ) => import("../../../header").Header[]}
 */
export const listExternalHeader = ({}, context, { binding, variable }) => [
  {
    type: "declaration",
    mode: context.mode,
    kind: binding.kind === "const" ? "let" : binding.kind,
    variable,
  },
  {
    type: "lookup",
    mode: context.mode,
    variable,
  },
  ...(context.mode === "sloppy"
    ? [
        {
          type: /** @type {"lookup"} */ ("lookup"),
          mode: /** @type {"strict"} */ ("strict"),
          variable,
        },
      ]
    : []),
];

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     binding: import("./external").ExternalBinding,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listExternalDeclareEffect = ({ path }, _context, { binding }) =>
  binding.kind === "var"
    ? []
    : listWriteCacheEffect(
        binding.deadzone,
        makePrimitiveExpression(true, path),
        path,
      );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     operation: "read" | "typeof" | "discard",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeLoadExpression = ({ path }, context, { operation, variable }) =>
  makeApplyExpression(
    makeReadParameterExpression(`${operation}.${context.mode}`, path),
    makePrimitiveExpression({ undefined: null }, path),
    [makePrimitiveExpression(variable, path)],
    path,
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     operation: "read" | "typeof" | "discard",
 *     binding: import("./external").ExternalBinding,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeExternalLoadExpression = (
  { path },
  context,
  { operation, binding, variable },
) => {
  if (binding.kind === "var") {
    return makeLoadExpression({ path }, context, { operation, variable });
  } else if (binding.kind === "let" || binding.kind === "const") {
    return guard(
      operation === "read" || operation === "typeof",
      (node) =>
        makeConditionalExpression(
          makeReadCacheExpression(binding.deadzone, path),
          makeThrowDeadzoneExpression(variable, path),
          node,
          path,
        ),
      makeLoadExpression({ path }, context, { operation, variable }),
    );
  } else {
    throw new AranTypeError("invalid binding", binding);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     operation: "write",
 *     variable: estree.Variable,
 *     right: import("../../cache").Cache | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listSaveEffect = ({ path }, context, { operation, variable, right }) =>
  right === null
    ? []
    : [
        makeExpressionEffect(
          makeApplyExpression(
            makeReadParameterExpression(`${operation}.${context.mode}`, path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makePrimitiveExpression(variable, path),
              makeReadCacheExpression(right, path),
            ],
            path,
          ),
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
 *     binding: import("./external").ExternalBinding,
 *     variable: estree.Variable,
 *     right: import("../../cache").Cache | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listExternalSaveEffect = (
  { path },
  context,
  { operation, binding, variable, right },
) => {
  switch (operation) {
    case "initialize": {
      return [
        ...listSaveEffect({ path }, context, {
          operation: "write",
          variable,
          right,
        }),
        ...(binding.kind === "let" || binding.kind === "const"
          ? listWriteCacheEffect(
              binding.deadzone,
              makePrimitiveExpression(true, path),
              path,
            )
          : []),
      ];
    }
    case "write": {
      switch (binding.kind) {
        case "var": {
          return listSaveEffect({ path }, context, {
            operation,
            variable,
            right,
          });
        }
        case "let": {
          return [
            makeConditionalEffect(
              makeReadCacheExpression(binding.deadzone, path),
              [
                makeExpressionEffect(
                  makeThrowDeadzoneExpression(variable, path),
                  path,
                ),
              ],
              listSaveEffect({ path }, context, {
                operation,
                variable,
                right,
              }),
              path,
            ),
          ];
        }
        case "const": {
          return [
            makeConditionalEffect(
              makeReadCacheExpression(binding.deadzone, path),
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
        default: {
          throw new AranTypeError("invalid binding", binding);
        }
      }
    }
    default: {
      throw new AranTypeError("invalid save operation", operation);
    }
  }
};
