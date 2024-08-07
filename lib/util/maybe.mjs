const { Error } = globalThis;

/**
 * @type {<X, Y>(
 *   maybe: X | null,
 *   transform: (x: X) => Y,
 * ) => Y | null}
 */
export const mapMaybe = (maybe, transform) => (maybe ? transform(maybe) : null);

/**
 * @type {<X>(maybe: X | null, message: string) => X}
 */
export const fromJust = (maybe, message) => {
  if (maybe === null) {
    throw new Error(message);
  } else {
    return maybe;
  }
};

/**
 * @type {<X, Y1, Y2>(
 *   maybe: X | null,
 *   nothing: Y1,
 *   recover: (
 *     x: X,
 *   ) => Y2,
 * ) => Y1 | Y2}
 */
export const fromMaybe = (maybe, nothing, recover) =>
  maybe === null ? nothing : recover(maybe);

/**
 * @type {<X>(maybe: X | null) => maybe is X}
 */
export const isJust = (maybe) => maybe !== null;

/**
 * @type {<X>(maybe: X | null) => maybe is null}
 */
export const isNothing = (maybe) => maybe === null;
