/* eslint-disable local/no-impure */
/**
 * @type {<X, Y extends X>(
 *   list: import("./list").List<X>,
 *   predicate: (item: X) => item is Y,
 * ) => Y | null}
 */
export const findListNarrow = (list, predicate) => {
  while (list !== null) {
    if (predicate(list.head)) {
      return list.head;
    }
    list = list.tail;
  }
  return null;
};
/* eslint-enable local/no-impure */

/* eslint-disable local/no-impure */
/**
 * @type {<X>(
 *   list: import("./list").List<X>,
 *   predicate: (item: X) => boolean,
 * ) => null | X}
 */
export const findList = (list, predicate) => {
  while (list !== null) {
    if (predicate(list.head)) {
      return list.head;
    }
    list = list.tail;
  }
  return null;
};
/* eslint-enable local/no-impure */

/**
 * @type {<X>(
 *   head: X,
 *   tail: import("./list").List<X>,
 * ) => import("./list").List<X>}
 */
export const cons = (head, tail) => ({
  head,
  tail,
});

/**
 * @type {<X>(
 *   head: X | null,
 *   tail: import("./list").List<X>,
 * ) => import("./list").List<X>}
 */
export const consMaybe = (head, tail) =>
  head === null
    ? tail
    : {
        head,
        tail,
      };

/**
 * @type {<X>(
 *  list: import("./list").List<X>,
 * ) => X}
 */
// @ts-ignore
export const car = ({ head }) => head;

/**
 * @type {<X>(
 *  list: import("./list").List<X>,
 * ) => import("./list").List<X>}
 */
// @ts-ignore
export const cdr = ({ tail }) => tail;
