const {
  Symbol: { iterator },
} = globalThis;

/** @type {(any: any) => any is Iterable<any>} */
export const isIterable = (any) =>
  any != null && typeof any[iterator] === "function";
