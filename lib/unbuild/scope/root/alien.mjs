import { AranTypeError } from "../../../error.mjs";
import { EMPTY, concat, concat_ } from "../../../util/index.mjs";
import {
  cacheWritable,
  makeWriteCacheEffect,
  makeReadCacheExpression,
} from "../../cache.mjs";
import {
  makeEarlyErrorExpression,
  makeRegularEarlyError,
} from "../../early-error.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
import { makeHeaderPrelude, makeWarningPrelude } from "../../prelude.mjs";
import { isHoistWritable } from "../../query/index.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  initSequence,
  liftSequenceX,
  liftSequenceX_,
  liftSequenceX___,
  liftSequence_X,
  liftSequence__X_,
  zeroSequence,
} from "../../sequence.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "../error.mjs";
import { makeLookupParameterExpression } from "./parameter.mjs";

const {
  Array: { of: toArray },
} = globalThis;

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   hoist: import("../../query/hoist").DeclareHoist,
 *   mode: "strict" | "sloppy",
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../../prelude").HeaderPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *   ),
 *   [
 *     estree.Variable,
 *     import(".").AlienBinding,
 *   ],
 * >}
 */
export const setupAlienEntry = ({ path, meta }, hoist, mode) => {
  const writable = isHoistWritable(hoist);
  if (hoist.kind === "var" || hoist.kind === "val") {
    return initSequence(
      [
        makeHeaderPrelude({
          type: "declare",
          mode,
          kind: "var",
          variable: hoist.variable,
        }),
      ],
      [hoist.variable, { type: "alien", deadzone: null, writable }],
    );
  } else if (hoist.kind === "let" || hoist.kind === "const") {
    return bindSequence(
      cacheWritable(meta, { type: "primitive", primitive: true }, path),
      (deadzone) =>
        initSequence(
          [
            makeHeaderPrelude({
              type: "declare",
              mode,
              kind: "let",
              variable: hoist.variable,
            }),
          ],
          [hoist.variable, { type: "alien", deadzone, writable }],
        ),
    );
  } else {
    throw new AranTypeError(hoist.kind);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: null | import(".").AlienBinding,
 *   operation: import("../operation").VariableSaveOperation,
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../../prelude").WarningPrelude
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").HeaderPrelude
 *   ),
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
export const makeAlienSaveEffect = ({ path }, binding, operation) => {
  if (operation.type === "declare") {
    switch (operation.mode) {
      case "sloppy": {
        return initSequence(
          [
            makeWarningPrelude({
              name: "DirectEvalExternalVariableDeclaration",
              message:
                "Ignoring external variable declaration in nested eval code",
              path,
            }),
          ],
          EMPTY,
        );
      }
      case "strict": {
        return liftSequenceX(
          concat_,
          liftSequenceX_(
            makeExpressionEffect,
            makeEarlyErrorExpression(
              makeRegularEarlyError(
                "Illegal external variable declaration in strict mode",
                path,
              ),
            ),
            path,
          ),
        );
      }
      default: {
        throw new AranTypeError(operation.mode);
      }
    }
  } else if (operation.type === "initialize") {
    return liftSequence_X(
      concat,
      binding !== null && binding.deadzone !== null
        ? [
            makeWriteCacheEffect(
              binding.deadzone,
              makePrimitiveExpression(false, path),
              path,
            ),
          ]
        : EMPTY,
      operation.right !== null
        ? liftSequenceX(
            toArray,
            liftSequenceX_(
              makeExpressionEffect,
              liftSequenceX___(
                makeApplyExpression,
                makeLookupParameterExpression(
                  operation.mode,
                  "write",
                  operation.variable,
                  path,
                ),
                makeIntrinsicExpression("undefined", path),
                [
                  makePrimitiveExpression(operation.variable, path),
                  operation.right,
                ],
                path,
              ),
              path,
            ),
          )
        : EMPTY_SEQUENCE,
    );
  } else if (operation.type === "write") {
    const node =
      binding !== null && !binding.writable
        ? zeroSequence(makeThrowConstantExpression(operation.variable, path))
        : liftSequenceX___(
            makeApplyExpression,
            makeLookupParameterExpression(
              operation.mode,
              "write",
              operation.variable,
              path,
            ),
            makeIntrinsicExpression("undefined", path),
            [
              makePrimitiveExpression(operation.variable, path),
              operation.right,
            ],
            path,
          );
    if (binding !== null && binding.deadzone !== null) {
      return liftSequenceX(
        toArray,
        liftSequence__X_(
          makeConditionalEffect,
          makeReadCacheExpression(binding.deadzone, path),
          [
            makeExpressionEffect(
              makeThrowDeadzoneExpression(operation.variable, path),
              path,
            ),
          ],
          liftSequenceX(
            toArray,
            liftSequenceX_(makeExpressionEffect, node, path),
          ),
          path,
        ),
      );
    } else {
      return liftSequenceX(
        toArray,
        liftSequenceX_(makeExpressionEffect, node, path),
      );
    }
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: null | import(".").AlienBinding,
 *   operation: import("../operation").VariableLoadOperation,
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").HeaderPrelude
 *   ),
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const makeAlienLoadExpression = ({ path }, binding, operation) => {
  const node = liftSequenceX___(
    makeApplyExpression,
    makeLookupParameterExpression(
      operation.mode,
      operation.type,
      operation.variable,
      path,
    ),
    makeIntrinsicExpression("undefined", path),
    [makePrimitiveExpression(operation.variable, path)],
    path,
  );
  if (
    (operation.type === "read" || operation.type === "typeof") &&
    binding !== null &&
    binding.deadzone !== null
  ) {
    return liftSequence__X_(
      makeConditionalExpression,
      makeReadCacheExpression(binding.deadzone, path),
      makeThrowDeadzoneExpression(operation.variable, path),
      node,
      path,
    );
  } else {
    return node;
  }
};
