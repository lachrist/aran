/**
 * @type {<X>(
 *   iterable: AsyncIterable<X>,
 *   sigint: import("./signal").Signal<Boolean>
 * ) => AsyncIterable<X>}
 */
export const interruptIterable = async function* (iterable, sigint) {
  for await (const value of iterable) {
    if (sigint.get()) {
      break;
    }
    yield value;
  }
};

/**
 * @type {<X, Y>(
 *   iterable: AsyncIterable<X>,
 *   transform: (value: X) => Y,
 * ) => AsyncIterable<Y>}
 */
export const mapIterable = async function* (iterable, transform) {
  for await (const value of iterable) {
    yield transform(value);
  }
};

/**
 * @type {<X>(
 *   iterable: AsyncIterable<X>,
 *   predicate: (value: X) => boolean,
 * ) => AsyncIterable<X>}
 */
export const filterIterable = async function* (iterable, predicate) {
  for await (const value of iterable) {
    if (predicate(value)) {
      yield value;
    }
  }
};
