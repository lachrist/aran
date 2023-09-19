import { reduceReverse } from "../util/array.mjs";
import { makeSequenceExpression } from "./node.mjs";

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
