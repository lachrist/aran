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
 *   transform: (value: X, index: number) => Y,
 * ) => AsyncIterable<Y>}
 */
export const mapIterable = async function* (iterable, transform) {
  let index = 0;
  for await (const value of iterable) {
    yield transform(value, index);
    index++;
  }
};

/**
 * @type {<X>(
 *   iterable: AsyncIterable<X>,
 *   predicate: (value: X, index: number) => boolean,
 * ) => AsyncIterable<X>}
 */
export const filterIterable = async function* (iterable, predicate) {
  let index = 0;
  for await (const value of iterable) {
    if (predicate(value, index)) {
      yield value;
    }
    index++;
  }
};
