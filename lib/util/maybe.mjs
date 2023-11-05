const { Error } = globalThis;

/**
 * @type {<X, Y>(
 *   maybe: X | null,
 *   transform: (x: X) => Y,
 * ) => Y | null}
 */
export const mapMaybe = (maybe, transform) => (maybe ? transform(maybe) : null);

/**
 * @type {<X>(value: X | null, message: string) => X}
 */
export const fromJust = (value, message) => {
  if (value === null) {
    throw new Error(message);
  } else {
    return value;
  }
};
