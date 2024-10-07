/**
 * @type {<X, Y>(
 *   x: X,
 *   y: Y,
 * ) => import("./pair").Pair<X, Y>}
 */
export const cons = (fst, snd) => ({
  fst,
  snd,
});

/**
 * @type {<X, Y>(
 *  c: import("./pair").Pair<X, Y>,
 * ) => X}
 */
export const car = ({ fst }) => fst;

/**
 * @type {<X, Y>(
 *  c: import("./pair").Pair<X, Y>,
 * ) => Y}
 */
export const cdr = ({ snd }) => snd;
