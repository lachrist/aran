import { guard } from "../../../../util/index.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../../cache.mjs";
import {
  makeBinaryExpression,
  makeDataDescriptorExpression,
} from "../../../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../../node.mjs";
import {
  listWriteAlienEffect,
  makeDiscardAlienExpression,
  makeReadAlienExpression,
  makeTypeofAlienExpression,
} from "../../../param/index.mjs";
import {
  bindSequence,
  listenSequence,
  mapSequence,
  sequenceExpression,
  tellSequence,
} from "../../../sequence.mjs";
import { makeThrowDeadzoneExpression } from "../error.mjs";

/**
 * @typedef {import("../../../program.js").RootProgram} RootProgram
 */

/**
 * @typedef {import("../../../program.js").AlienProgram} AlienProgram
 */

/**
 * @typedef {import("../../../program.js").GlobalProgram} GlobalProgram
 */

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
 *     situ: "local" | "global",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeAlienReadExpression = (
  { path, meta },
  context,
  { situ, variable },
) =>
  sequenceExpression(
    mapSequence(
      cacheConstant(
        meta,
        makeReadAlienExpression({ path }, context, { situ, variable }),
        path,
      ),
      (value) =>
        makeConditionalExpression(
          makeBinaryExpression(
            "===",
            makeReadCacheExpression(value, path),
            makeIntrinsicExpression("aran.deadzone", path),
            path,
          ),
          makeThrowDeadzoneExpression(variable, path),
          makeReadCacheExpression(value, path),
          path,
        ),
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
 *     situ: "local" | "global",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeAlienTypeofExpression = (
  { path },
  context,
  { situ, variable },
) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "===",
      makeTypeofAlienExpression({ path }, context, { situ, variable }),
      makePrimitiveExpression("undefined", path),
      path,
    ),
    makePrimitiveExpression("undefined", path),
    makeConditionalExpression(
      makeBinaryExpression(
        "===",
        makeReadAlienExpression({ path }, context, { situ, variable }),
        makeIntrinsicExpression("aran.deadzone", path),
        path,
      ),
      makeThrowDeadzoneExpression(variable, path),
      makeTypeofAlienExpression({ path }, context, { situ, variable }),
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
 *     situ: "local" | "global",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeAlienDiscardExpression = makeDiscardAlienExpression;

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
 *     situ: "global" | "local",
 *     variable: estree.Variable,
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listAlienWriteEffect = (
  { path, meta },
  context,
  { situ, variable, right },
) =>
  // Hard to avoid triggering global accessors multiple times here.
  listenSequence(
    bindSequence(cacheConstant(meta, right, path), (right) =>
      tellSequence(
        guard(
          context.mode === "sloppy",
          (write_strict) => [
            makeConditionalEffect(
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
                makePrimitiveExpression(false, path),
                makeBinaryExpression(
                  "===",
                  makeTypeofAlienExpression({ path }, context, {
                    situ,
                    variable,
                  }),
                  makePrimitiveExpression("undefined", path),
                  path,
                ),
                path,
              ),
              [
                makeExpressionEffect(
                  makeApplyExpression(
                    makeIntrinsicExpression("Reflect.defineProperty", path),
                    makePrimitiveExpression({ undefined: null }, path),
                    [
                      makeIntrinsicExpression("aran.global", path),
                      makePrimitiveExpression(variable, path),
                      makeDataDescriptorExpression(
                        {
                          value: makeReadCacheExpression(right, path),
                          writable: true,
                          configurable: true,
                          enumerable: true,
                        },
                        path,
                      ),
                    ],
                    path,
                  ),
                  path,
                ),
              ],
              write_strict,
              path,
            ),
          ],
          [
            makeConditionalEffect(
              makeBinaryExpression(
                "===",
                makeReadAlienExpression({ path }, context, { situ, variable }),
                makeIntrinsicExpression("aran.deadzone", path),
                path,
              ),
              [
                makeExpressionEffect(
                  makeThrowDeadzoneExpression(variable, path),
                  path,
                ),
              ],
              listWriteAlienEffect({ path }, context, {
                situ,
                variable,
                right: makeReadCacheExpression(right, path),
              }),
              path,
            ),
          ],
        ),
      ),
    ),
  );
