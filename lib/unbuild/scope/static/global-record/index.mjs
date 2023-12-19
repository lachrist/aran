import { AranTypeError } from "../../../../error.mjs";
import { map } from "../../../../util/index.mjs";
import { cacheIntrinsic, cachePrimitive } from "../../../cache.mjs";
import {
  makeBinaryExpression,
  makeDataDescriptorExpression,
  makeGetExpression,
} from "../../../intrinsic.mjs";
import {
  makeConditionalExpression,
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeConditionalEffect,
  makeExpressionEffect,
  makeEffectStatement,
} from "../../../node.mjs";
import { initSequence } from "../../../sequence.mjs";
import { listSaveEffect, makeLoadExpression } from "../../access.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
  makeThrowDuplicateExpression,
} from "../../error.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   binding: import(".").GlobalRecordBinding,
 *   operation: {
 *     mode: "strict" | "sloppy",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeLiveExpression = ({ path }, _binding, { mode, variable }) =>
  makeBinaryExpression(
    "===",
    makeLoadExpression({ path }, cacheIntrinsic("aran.record"), {
      type: "read",
      mode,
      variable,
    }),
    makeIntrinsicExpression("aran.deadzone", path),
    path,
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   kind: import("./index.js").GlobalRecordKind,
 *   options: {
 *     variable: estree.Variable,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listClashEffect = ({ path }, _kind, { variable }) => [
  makeConditionalEffect(
    makeConditionalExpression(
      makeApplyExpression(
        makeIntrinsicExpression("Object.hasOwn", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeIntrinsicExpression("aran.record", path),
          makePrimitiveExpression(variable, path),
        ],
        path,
      ),
      makePrimitiveExpression(false, path),
      makeConditionalExpression(
        makeApplyExpression(
          makeIntrinsicExpression("Object.hasOwn", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeIntrinsicExpression("aran.global", path),
            makePrimitiveExpression(variable, path),
          ],
          path,
        ),
        makeGetExpression(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.getOwnPropertyDescriptor", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeIntrinsicExpression("aran.global", path),
              makePrimitiveExpression(variable, path),
            ],
            path,
          ),
          makePrimitiveExpression("configurable", path),
          path,
        ),
        makePrimitiveExpression(true, path),
        path,
      ),
      path,
    ),
    [],
    [makeExpressionEffect(makeThrowDuplicateExpression(variable, path), path)],
    path,
  ),
];

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   kind: import("./index.js").GlobalRecordKind,
 *   options: {
 *     variable: estree.Variable,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listDeclareEffect = ({ path }, kind, { variable }) => [
  makeExpressionEffect(
    makeApplyExpression(
      makeIntrinsicExpression("Reflect.defineProperty", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeIntrinsicExpression("aran.global", path),
        makePrimitiveExpression(variable, path),
        makeDataDescriptorExpression(
          {
            value: makeIntrinsicExpression("aran.deadzone", path),
            writable: kind !== "const",
            enumerable: true,
            configurable: true,
          },
          path,
        ),
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
 *   kind: import("./index.js").GlobalRecordKind,
 *   options: {
 *     mode: "strict" | "sloppy",
 *     variable: estree.Variable,
 *   },
 * ) => import("../../../sequence.js").PreludeSequence<
 *   import("./index.js").GlobalRecordBinding,
 * >}
 */
export const setupGlobalRecordBinding = ({ path }, kind, options) =>
  initSequence(
    [
      ...map(listClashEffect({ path }, kind, options), (node) => ({
        type: /** @type {"head"} */ ("head"),
        data: makeEffectStatement(node, path),
      })),
      ...map(listDeclareEffect({ path }, kind, options), (node) => ({
        type: /** @type {"body"} */ ("body"),
        data: makeEffectStatement(node, path),
      })),
    ],
    { kind },
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   binding: import("./index.js").GlobalRecordBinding,
 *   operation: (
 *     | import("../..").ReadOperation
 *     | import("../..").TypeofOperation
 *     | import("../..").DiscardOperation
 *   ),
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGlobalRecordLoadExpression = ({ path }, _binding, options) =>
  makeLoadExpression({ path }, cacheIntrinsic("aran.record"), options);

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   binding: import("./index.js").GlobalRecordBinding,
 *   operation: (
 *     | import("../..").InitializeOperation
 *     | import("../..").WriteOperation
 *   ),
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listGlobalRecordSaveEffect = ({ path }, binding, operation) => {
  switch (operation.type) {
    case "initialize": {
      return listSaveEffect({ path }, cacheIntrinsic("aran.record"), {
        type: "write",
        mode: "sloppy", // faster
        variable: operation.variable,
        right: operation.right ?? cachePrimitive({ undefined: null }),
      });
    }
    case "write": {
      if (binding.kind === "let" || binding.kind === "class") {
        return [
          makeConditionalEffect(
            makeLiveExpression({ path }, binding, operation),
            listSaveEffect({ path }, cacheIntrinsic("aran.record"), {
              ...operation,
              mode: "sloppy", // faster
            }),
            [
              makeExpressionEffect(
                makeThrowDeadzoneExpression(operation.variable, path),
                path,
              ),
            ],
            path,
          ),
        ];
      } else if (binding.kind === "const") {
        return [
          makeConditionalEffect(
            makeLiveExpression({ path }, binding, operation),
            [
              makeExpressionEffect(
                makeThrowConstantExpression(operation.variable, path),
                path,
              ),
            ],
            [
              makeExpressionEffect(
                makeThrowDeadzoneExpression(operation.variable, path),
                path,
              ),
            ],
            path,
          ),
        ];
      } else {
        throw new AranTypeError("invalid binding kind", binding.kind);
      }
    }
    default: {
      throw new AranTypeError("invalid save operation", operation);
    }
  }
};
