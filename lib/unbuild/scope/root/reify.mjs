import {
  makeExpressionEffect,
  makeConditionalExpression,
  makePrimitiveExpression,
  makeConditionalEffect,
} from "../../node.mjs";
import { makeUnaryExpression } from "../../intrinsic.mjs";
import { makeThrowMissingExpression } from "../error.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../cache.mjs";
import { splitMeta } from "../../mangle.mjs";
import { guard } from "../../../util/index.mjs";
import {
  makeExistGlobalObjectExpression,
  makeReadGlobalObjectExpression,
  makeDiscardGlobalObjectExpression,
  listWriteGlobalObjectEffect,
} from "../global-object.mjs";
import {
  makeExistGlobalRecordExpression,
  makeReadGlobalRecordExpression,
  listWriteGlobalRecordEffect,
} from "../global-record.mjs";
import { bindSequence, listenSequence, tellSequence } from "../../sequence.mjs";

/**
 * @typedef {import("../../program.js").RootProgram} RootProgram
 */

/**
 * @typedef {import("../../program.js").ReifyProgram} ReifyProgram
 */

/**
 * @typedef {import("../../program.js").GlobalProgram} GlobalProgram
 */

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
    makeExistGlobalRecordExpression({ path }, context, { variable }),
    makeReadGlobalRecordExpression({ path }, context, { variable }),
    makeConditionalExpression(
      makeExistGlobalObjectExpression({ path }, context, { variable }),
      makeReadGlobalObjectExpression({ path }, context, { variable }),
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
      makeExistGlobalRecordExpression({ path }, context, { variable }),
      makeReadGlobalRecordExpression({ path }, context, { variable }),
      makeReadGlobalObjectExpression({ path }, context, { variable }),
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
    makeExistGlobalRecordExpression({ path }, context, { variable }),
    makePrimitiveExpression(false, path),
    makeDiscardGlobalObjectExpression({ path }, context, { variable }),
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
  return listenSequence(
    bindSequence(cacheConstant(metas.right, right, path), (right) =>
      tellSequence([
        makeConditionalEffect(
          makeExistGlobalRecordExpression({ path }, context, { variable }),
          listWriteGlobalRecordEffect({ path, meta: metas.write }, context, {
            writable: null,
            variable,
            right: makeReadCacheExpression(right, path),
          }),
          guard(
            context.mode === "strict",
            (nodes) => [
              makeConditionalEffect(
                makeExistGlobalObjectExpression({ path }, context, {
                  variable,
                }),
                nodes,
                [
                  makeExpressionEffect(
                    makeThrowMissingExpression(variable, path),
                    path,
                  ),
                ],
                path,
              ),
            ],
            listWriteGlobalObjectEffect({ path }, context, {
              variable,
              right: makeReadCacheExpression(right, path),
            }),
          ),
          path,
        ),
      ]),
    ),
  );
};
