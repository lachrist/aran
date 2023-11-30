import {
  makeExpressionEffect,
  makeConditionalExpression,
  makePrimitiveExpression,
  makeIntrinsicExpression,
  makeSequenceExpression,
} from "../../../node.mjs";
import {
  makeUnaryExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
} from "../../../intrinsic.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
  makeThrowMissingExpression,
} from "../error.mjs";
import {
  listImpureEffect,
  makeInitCacheExpression,
  makeReadCacheExpression,
} from "../../../cache.mjs";
import { splitMeta } from "../../../mangle.mjs";
import { guard } from "../../../../util/index.mjs";
import {
  makeDeleteGlobalObjectExpression,
  makeGetGlobalObjectExpression,
  makeHasGlobalObjectExpression,
} from "../global-object.mjs";

/**
 * @typedef {import("../../../program.js").RootProgram} RootProgram
 */

/**
 * @typedef {import("../../../program.js").ReifyProgram} ReifyProgram
 */

/**
 * @typedef {import("../../../program.js").GlobalProgram} GlobalProgram
 */

/**
 * @type {(
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeReadHiddenExpression = (variable, path) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable, path),
      makeIntrinsicExpression("aran.record.values", path),
      path,
    ),
    makeGetExpression(
      makeIntrinsicExpression("aran.record.values", path),
      makePrimitiveExpression(variable, path),
      path,
    ),
    makeThrowDeadzoneExpression(variable, path),
    path,
  );

/**
 * @type {(
 *   writable: true | false | null,
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeWriteHiddenExpression = (writable, variable, right, path, meta) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable, path),
      makeIntrinsicExpression("aran.record.values", path),
      path,
    ),
    writable === null
      ? makeInitCacheExpression("constant", right, { path, meta }, (right) =>
          makeConditionalExpression(
            makeGetExpression(
              makeIntrinsicExpression("aran.record.variables", path),
              makePrimitiveExpression(variable, path),
              path,
            ),
            makeSetExpression(
              "strict",
              makeIntrinsicExpression("aran.record.values", path),
              makePrimitiveExpression(variable, path),
              makeReadCacheExpression(right, path),
              path,
            ),
            makeThrowConstantExpression(variable, path),
            path,
          ),
        )
      : writable
      ? makeSetExpression(
          "strict",
          makeIntrinsicExpression("aran.record.values", path),
          makePrimitiveExpression(variable, path),
          right,
          path,
        )
      : makeSequenceExpression(
          listImpureEffect(right, path),
          makeThrowConstantExpression(variable, path),
          path,
        ),
    makeThrowDeadzoneExpression(variable, path),
    path,
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     situ: "global",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReifyReadExpression = ({ path }, context, { variable }) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable, path),
      makeIntrinsicExpression("aran.record.variables", path),
      path,
    ),
    makeReadHiddenExpression(variable, path),
    makeConditionalExpression(
      makeHasGlobalObjectExpression({ path }, context, { variable }),
      makeGetGlobalObjectExpression({ path }, context, { variable }),
      makeThrowMissingExpression(variable, path),
      path,
    ),
    path,
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     situ: "global",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReifyTypeofExpression = ({ path }, context, { variable }) =>
  makeUnaryExpression(
    "typeof",
    makeConditionalExpression(
      makeBinaryExpression(
        "in",
        makePrimitiveExpression(variable, path),
        makeIntrinsicExpression("aran.record.variables", path),
        path,
      ),
      makeReadHiddenExpression(variable, path),
      makeGetGlobalObjectExpression({ path }, context, { variable }),
      path,
    ),
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
 *     situ: "global",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReifyDiscardExpression = ({ path }, context, { variable }) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable, path),
      makeIntrinsicExpression("aran.record.variables", path),
      path,
    ),
    makePrimitiveExpression(false, path),
    makeDeleteGlobalObjectExpression({ path }, context, { variable }),
    path,
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     situ: "global",
 *     variable: estree.Variable,
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listReifyWriteEffect = (
  { path, meta },
  context,
  { variable, right },
) => {
  const metas = splitMeta(meta, ["right", "write"]);
  return [
    makeExpressionEffect(
      makeInitCacheExpression(
        "constant",
        right,
        { path, meta: metas.right },
        (right) =>
          makeConditionalExpression(
            makeBinaryExpression(
              "in",
              makePrimitiveExpression(variable, path),
              makeIntrinsicExpression("aran.record.variables", path),
              path,
            ),
            makeWriteHiddenExpression(
              null,
              variable,
              makeReadCacheExpression(right, path),
              path,
              metas.write,
            ),
            guard(
              context.mode === "strict",
              (write) =>
                makeConditionalExpression(
                  makeHasGlobalObjectExpression({ path }, context, {
                    variable,
                  }),
                  write,
                  makeThrowMissingExpression(variable, path),
                  path,
                ),
              makeSetExpression(
                "strict",
                makeIntrinsicExpression("aran.record.values", path),
                makePrimitiveExpression(variable, path),
                makeReadCacheExpression(right, path),
                path,
              ),
            ),
            path,
          ),
      ),
      path,
    ),
  ];
};
