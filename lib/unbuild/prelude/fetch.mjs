import { splitPath, walkPath } from "../../path.mjs";
import { EMPTY } from "../../util/index.mjs";

const {
  Array: {
    isArray,
    prototype: { pop },
  },
  Reflect: { apply },
} = globalThis;

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   origin: import("../../path").Path,
 *   options: {
 *     base: import("../../path").Path,
 *     root: import("../../estree").Program,
 *   },
 * ) => import("../../estree").Node}
 */
export const fetchOrigin = (origin, { base, root }) => {
  const segments = splitPath(origin, base);
  while (segments.length > 0) {
    const node = walkPath(segments, root);
    if (!isArray(node)) {
      return node;
    }
    apply(pop, segments, EMPTY);
  }
  return root;
};
/* eslint-enable local/no-impure */
