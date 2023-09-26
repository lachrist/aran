import { reduceReverse } from "../util/array.mjs";
import { makeReadExpression, makeSequenceExpression } from "./node.mjs";

/**
 * @type {<S>(
 *   effects: aran.Effect<unbuild.Atom<S>>[],
 *   expression: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeLongSequenceExpression = (effects, expression, serial) =>
  reduceReverse(
    effects,
    (sequence, effect) => makeSequenceExpression(effect, sequence, serial),
    expression,
  );

/**
 * @type {<S>(
 *   memo: {
 *     setup: aran.Effect<unbuild.Atom<S>>[],
 *     self: unbuild.Variable,
 *   },
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeMemoExpression = ({ setup, self }, serial) =>
  makeLongSequenceExpression(setup, makeReadExpression(self, serial), serial);
