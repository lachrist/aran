/**
 * @type {<X>(
 *   iterable: AsyncIterable<X>,
 *   sigint: import("../util/signal").Signal<Boolean>
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
