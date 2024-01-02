import { AranTypeError } from "../../../error.mjs";
import { guard } from "../../../util/index.mjs";
import {
  cacheWritable,
  listWriteCacheEffect,
  makeReadCacheExpression,
} from "../../cache.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeReadParameterExpression,
} from "../../node.mjs";
import {
  makeEffectPrelude,
  makeHeaderPrelude,
  makeLogPrelude,
} from "../../prelude.mjs";
import {
  mapSequence,
  passSequence,
  tellSequence,
  thenSequence,
} from "../../sequence.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "../error.mjs";

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   kind: import(".").DeadzoneExternalKind,
 *   options: {
 *     mode: "strict" | "sloppy",
 *     variable: estree.Variable,
 *   },
 * ) => import("../../sequence").PreludeSequence<
 *   import(".").DeadzoneExternalBinding,
 * >}
 */
export const bindDeadzoneExternal = (
  { path, meta },
  kind,
  { mode, variable },
) =>
  thenSequence(
    tellSequence([
      makeLogPrelude({
        name: "ExternalDeadzone",
        message: `Outside sources will not honor the deadzone of external variable '${variable}'`,
        path,
      }),
      ...(kind === "const"
        ? [
            makeLogPrelude({
              name: "ExternalConstant",
              message: `Outside sources will not honor the immutability of external variable '${variable}'`,
              path,
            }),
          ]
        : []),
      makeHeaderPrelude({
        type: "declaration",
        mode,
        kind: "let",
        variable,
      }),
      makeHeaderPrelude({
        type: "lookup",
        mode,
        variable,
      }),
      ...(mode === "sloppy"
        ? [
            makeHeaderPrelude({
              type: /** @type {"lookup"} */ ("lookup"),
              mode: /** @type {"strict"} */ ("strict"),
              variable,
            }),
          ]
        : []),
    ]),
    mapSequence(
      passSequence(
        cacheWritable(meta, makePrimitiveExpression(true, path), path),
        makeEffectPrelude,
      ),
      (deadzone) => ({ kind, deadzone }),
    ),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").DeadzoneExternalBinding,
 *   operation: import("..").VariableLoadOperation,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDeadzoneExternalLoadExpression = (
  { path },
  binding,
  operation,
) =>
  guard(
    operation.type === "read" || operation.type === "typeof",
    (node) =>
      makeConditionalExpression(
        makeReadCacheExpression(binding.deadzone, path),
        makeThrowDeadzoneExpression(operation.variable, path),
        node,
        path,
      ),
    makeApplyExpression(
      makeReadParameterExpression(`${operation.type}.${operation.mode}`, path),
      makePrimitiveExpression({ undefined: null }, path),
      [makePrimitiveExpression(operation.variable, path)],
      path,
    ),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").DeadzoneExternalBinding,
 *   operation: import("..").WriteOperation,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listSaveEffect = ({ path }, _binding, operation) => [
  makeExpressionEffect(
    makeApplyExpression(
      makeReadParameterExpression(`${operation.type}.${operation.mode}`, path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makePrimitiveExpression(operation.variable, path),
        makeReadCacheExpression(operation.right, path),
      ],
      path,
    ),
    path,
  ),
];

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").DeadzoneExternalBinding,
 *   operation: import("..").VariableSaveOperation,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listDeadzoneExternalSaveEffect = (
  { path },
  binding,
  operation,
) => {
  if (operation.type === "initialize") {
    return [
      ...(operation.right === null
        ? []
        : listSaveEffect({ path }, binding, {
            type: "write",
            mode: operation.mode,
            variable: operation.variable,
            right: operation.right,
          })),
      ...listWriteCacheEffect(
        binding.deadzone,
        makePrimitiveExpression(false, path),
        path,
      ),
    ];
  } else if (operation.type === "write") {
    if (binding.kind === "let") {
      return [
        makeConditionalEffect(
          makeReadCacheExpression(binding.deadzone, path),
          [
            makeExpressionEffect(
              makeThrowDeadzoneExpression(operation.variable, path),
              path,
            ),
          ],
          listSaveEffect({ path }, binding, operation),
          path,
        ),
      ];
    } else if (binding.kind === "const") {
      return [
        makeConditionalEffect(
          makeReadCacheExpression(binding.deadzone, path),
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
      ];
    } else {
      throw new AranTypeError("invalid binding kind", binding.kind);
    }
  } else {
    throw new AranTypeError("invalid save operation", operation);
  }
};
