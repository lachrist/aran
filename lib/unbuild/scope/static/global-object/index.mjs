import { AranTypeError } from "../../../../error.mjs";
import { map } from "../../../../util/index.mjs";
import { cacheIntrinsic } from "../../../cache.mjs";
import { makeDataDescriptorExpression } from "../../../intrinsic.mjs";
import {
  makeConditionalEffect,
  makeExpressionEffect,
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../../node.mjs";
import { makeBodyPrelude, makeHeadPrelude } from "../../../prelude.mjs";
import { initSequence } from "../../../sequence.mjs";
import { listSaveEffect, makeLoadExpression } from "../../access.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDuplicateExpression,
} from "../../error.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   kind: import(".").GlobalObjectKind,
 *   options: {
 *     variable: estree.Variable,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listClashEffect = ({ path }, _kind, { variable }) => [
  makeConditionalEffect(
    makeApplyExpression(
      makeIntrinsicExpression("Object.hasOwn", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeIntrinsicExpression("aran.record", path),
        makePrimitiveExpression(variable, path),
      ],
      path,
    ),
    [makeExpressionEffect(makeThrowDuplicateExpression(variable, path), path)],
    [],
    path,
  ),
];

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   kind: import(".").GlobalObjectKind,
 *   options: {
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeDeclareExpression = ({ path }, _kind, { variable }) =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.defineProperty", path),
    makePrimitiveExpression({ undefined: null }, path),
    [
      makeIntrinsicExpression("aran.global", path),
      makePrimitiveExpression(variable, path),
      makeDataDescriptorExpression(
        {
          value: null,
          writable: true,
          enumerable: true,
          configurable: false,
        },
        path,
      ),
    ],
    path,
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   kind: import(".").GlobalObjectKind,
 *   options: {
 *     mode: "strict" | "sloppy",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listDeclareEffect = ({ path }, kind, { mode, variable }) => {
  switch (mode) {
    case "strict": {
      return [
        makeConditionalEffect(
          makeDeclareExpression({ path }, kind, { variable }),
          [],
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
    case "sloppy": {
      return [
        makeExpressionEffect(
          makeDeclareExpression({ path }, kind, { variable }),
          path,
        ),
      ];
    }
    default: {
      throw new AranTypeError("invalid mode", mode);
    }
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   kind: import(".").GlobalObjectKind,
 *   options: {
 *     mode: "strict" | "sloppy",
 *     variable: estree.Variable,
 *   },
 * ) => import("../../../sequence.js").PreludeSequence<
 *   import(".").GlobalObjectBinding,
 * >}
 */
export const setupGlobalObjectBinding = (site, kind, options) =>
  initSequence(
    [
      ...map(listClashEffect(site, kind, options), makeHeadPrelude),
      ...map(listDeclareEffect(site, kind, options), makeBodyPrelude),
    ],
    { kind },
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   binding: import(".").GlobalObjectBinding,
 *   operation: (
 *     | import("../..").ReadOperation
 *     | import("../..").TypeofOperation
 *     | import("../..").DiscardOperation
 *   ),
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGlobalObjectLoadExpression = (site, _binding, options) =>
  makeLoadExpression(site, cacheIntrinsic("aran.global"), options);

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   binding: import(".").GlobalObjectBinding,
 *   operation: (
 *     | import("../..").InitializeOperation
 *     | import("../..").WriteOperation
 *   ),
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listGlobalObjectSaveEffect = (site, _binding, operation) => {
  if (operation.type === "initialize") {
    if (operation.right === null) {
      return [];
    } else {
      return listSaveEffect(site, cacheIntrinsic("aran.global"), {
        type: "write",
        mode: operation.mode,
        variable: operation.variable,
        right: operation.right,
      });
    }
  } else if (operation.type === "write") {
    return listSaveEffect(site, cacheIntrinsic("aran.global"), operation);
  } else {
    throw new AranTypeError("invalid operation", operation);
  }
};
