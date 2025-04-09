/* eslint-disable local/no-impure */
/**
 * @type {<X, Y extends X>(
 *   list: import("./list.d.ts").List<X>,
 *   predicate: (item: X) => item is Y,
 * ) => Y | null}
 */
export const findListNarrow = (list, predicate) => {
  while (list !== null) {
    if (predicate(list[0])) {
      return list[0];
    }
    list = list[1];
  }
  return null;
};
/* eslint-enable local/no-impure */

/* eslint-disable local/no-impure */
/**
 * @type {<X>(
 *   list: import("./list.d.ts").List<X>,
 *   predicate: (item: X) => boolean,
 * ) => null | X}
 */
export const findList = (list, predicate) => {
  while (list !== null) {
    if (predicate(list[0])) {
      return list[0];
    }
    list = list[1];
  }
  return null;
};
/* eslint-enable local/no-impure */

/**
 * @type {<X>(
 *   head: X,
 *   tail: import("./list.d.ts").List<X>,
 * ) => import("./list.d.ts").List<X>}
 */
export const cons = (head, tail) => [head, tail];

/**
 * @type {<X>(
 *   head: X | null,
 *   tail: import("./list.d.ts").List<X>,
 * ) => import("./list.d.ts").List<X>}
 */
export const consMaybe = (head, tail) => (head === null ? tail : [head, tail]);

/**
 * @type {<X>(
 *  list: import("./list.d.ts").List<X>,
 * ) => X}
 */
// @ts-ignore
export const car = ({ 0: head }) => head;

/**
 * @type {<X>(
 *  list: import("./list.d.ts").List<X>,
 * ) => import("./list.d.ts").List<X>}
 */
// @ts-ignore
export const cdr = ({ 1: tail }) => tail;

/* eslint-disable local/no-impure */
/**
 * @type {<X>(
 *   array: X[],
 *   list: import("./list.d.ts").List<X>,
 * ) => import("./list.d.ts").List<X>}
 */
export const appendArray = (array, list) => {
  for (let index = array.length - 1; index >= 0; index--) {
    list = [array[index], list];
  }
  return list;
};
/* eslint-enable local/no-impure */
