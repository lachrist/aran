import { initSequence } from "../../sequence.mjs";
import { makePrimitiveExpression } from "../node.mjs";
import { EMPTY } from "../../util/index.mjs";
import { splitPath, walkPath } from "../../path.mjs";

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

/**
 * @type {(
 *   syntax_error: {
 *     message: string,
 *     origin: import("../../path").Path,
 *   },
 *   options: {
 *     root: import("../../estree").Program,
 *     base: import("../../path").Path,
 *   },
 * ) => import("../../report").SyntaxErrorCause}
 */
export const toSyntaxErrorCause = ({ message, origin }, options) => ({
  message,
  node: fetchOrigin(origin, options),
  path: origin,
});

/**
 * @type {(
 *   message: string,
 *   path: import("../../path").Path,
 * ) => import("../../sequence").Sequence<
 *   import(".").SyntaxErrorPrelude,
 *   import("../atom").Expression,
 * >}
 */
export const initSyntaxErrorExpression = (message, path) =>
  initSequence(
    [
      {
        type: "syntax-error",
        data: {
          message,
          origin: path,
        },
      },
    ],
    makePrimitiveExpression(`ARAN_EARLY_ERROR >> ${message} >> ${path}`, path),
  );
