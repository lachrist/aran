import { listEntry } from "../../util/index.mjs";
import { aspect_kind_enumeration } from "./aspect.mjs";

const {
  Reflect: { defineProperty },
} = globalThis;

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   pointcut: import("./aspect-internal").Pointcut,
 * ) => import("./aspect-internal").OptimalPointcut}
 */
export const optimizePointcut = (pointcut) => {
  /** @type {import("./aspect-internal").OptimalPointcut} */
  const record = /** @type {any} */ ({ __proto__: null });
  {
    const { length } = aspect_kind_enumeration;
    for (let index = 0; index < length; index++) {
      const kind = aspect_kind_enumeration[index];
      if (!(kind in record)) {
        record[kind] = [];
      }
    }
  }
  {
    const entries = listEntry(pointcut);
    const descriptor = {
      __proto__: null,
      value: /** @type {any} */ (null),
      configurable: true,
      enumerable: true,
      writable: true,
    };
    const { length } = entries;
    for (let index = 0; index < length; index++) {
      const {
        0: name,
        1: { kind, pointcut },
      } = entries[index];
      const predicates = record[kind];
      descriptor.value = { name, pointcut };
      defineProperty(predicates, predicates.length, descriptor);
    }
  }
  return record;
};
/* eslint-enable local/no-impure */
