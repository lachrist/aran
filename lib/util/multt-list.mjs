import { AranTypeError } from "../report.mjs";

// /**
//  * @type {<X>(
//  *   head: X,
//  *   tail: import("./list").List<X>,
//  * ) => import("./list").List<X>}
//  */
// export const cons = (head, tail) => ({ head, tail });

// /**
//  * @type {<X>(
//  *   list: import("./list").List<X>,
//  * ) => X}
//  */
// export const car = (list) => /** @type {any} */ (list).head;

// /**
//  * @type {<X>(
//  *   list: import("./list").List<X>,
//  * ) => import("./list").List<X>}
//  */
// export const cdr = (list) => /** @type {any} */ (list).tail;

/* eslint-disable local/no-impure*/
/**
 * @type {<X, Y>(
 *   list: import("./multi-list").MultiList<X>,
 *   initial: Y,
 *   aggregate: (
 *     past: Y,
 *     item: X,
 *   ) => Y,
 * ) => Y}
 */
export const foldr = (list, result, aggregate) => {
  while (list !== null) {
    if (list.type === "single") {
      result = aggregate(result, list.head);
    } else if (list.type === "multiple") {
      const { head: array } = list;
      const { length } = array;
      for (let index = 0; index < length; index += 1) {
        result = aggregate(result, array[index]);
      }
    } else {
      throw new AranTypeError(list);
    }
    list = list.tail;
  }
  return result;
};
/* eslint-enable local/no-impure*/
