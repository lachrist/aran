import {
  KEYWORD_RECORD,
  STRICT_KEYWORD_RECORD,
  STRICT_READONLY_RECORD,
} from "../estree.mjs";
import { map, hasNarrowKey } from "../util/index.mjs";
import { makeEarlyErrorPrelude } from "./prelude.mjs";
import { initSequence } from "./sequence.mjs";

/**
 * @type {(
 *  variable: estree.Variable,
 *  options: {
 *    mode: "strict" | "sloppy",
 *    operation: "read" | "write" | "initialize" | "discard" | "typeof",
 *  },
 * ) => string[]}
 */
const listEarlyErrorMessage = (variable, { mode, operation }) => {
  if (hasNarrowKey(KEYWORD_RECORD, variable)) {
    return [`Illegal keyword identifier: ${variable}`];
  }
  if (mode === "strict" && hasNarrowKey(STRICT_KEYWORD_RECORD, variable)) {
    return [`Illegal strict keyword identifier: ${variable}`];
  }
  if (
    mode === "strict" &&
    (operation === "write" || operation === "initialize") &&
    hasNarrowKey(STRICT_READONLY_RECORD, variable)
  ) {
    return [`Illegal strict readonly keyword identifier: ${variable}`];
  }
  return [];
};

/**
 * @type {(
 *  site: {
 *    node: estree.Identifier,
 *    path: unbuild.Path,
 *  },
 *  options: {
 *    mode: "strict" | "sloppy",
 *    operation: "read" | "write" | "initialize" | "discard" | "typeof",
 *  },
 * ) => import("./sequence").Sequence<
 *   import("./prelude").EarlyErrorPrelude,
 *   estree.Variable
 * >}
 */
export const extractVariable = ({ node, path }, options) => {
  const variable = /** @type {estree.Variable} */ (node.name);
  return initSequence(
    map(listEarlyErrorMessage(variable, options), (message) =>
      makeEarlyErrorPrelude({
        guard: null,
        message,
        path,
      }),
    ),
    variable,
  );
};
