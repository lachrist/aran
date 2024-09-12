import {
  KEYWORD_RECORD,
  STRICT_KEYWORD_RECORD,
  STRICT_READONLY_KEYWORD_RECORD,
} from "../estree.mjs";
import { map, hasNarrowKey } from "../util/index.mjs";
import { initSequence } from "../sequence.mjs";

/**
 * @type {(
 *  variable: import("../estree").Variable,
 *  options: {
 *    mode: "strict" | "sloppy",
 *    operation: "read" | "write" | "initialize" | "discard" | "typeof",
 *  },
 * ) => string[]}
 */
const listSyntaxErrorMessage = (variable, { mode, operation }) => {
  if (hasNarrowKey(KEYWORD_RECORD, variable)) {
    return [`Illegal keyword identifier: ${variable}`];
  }
  if (mode === "strict" && hasNarrowKey(STRICT_KEYWORD_RECORD, variable)) {
    return [`Illegal strict keyword identifier: ${variable}`];
  }
  if (
    mode === "strict" &&
    (operation === "write" || operation === "initialize") &&
    hasNarrowKey(STRICT_READONLY_KEYWORD_RECORD, variable)
  ) {
    return [`Illegal strict readonly keyword identifier: ${variable}`];
  }
  return [];
};

/**
 * @type {(
 *  site: {
 *    node: import("../estree").VariableIdentifier,
 *    path: import("../path").Path,
 *  },
 *  options: {
 *    mode: "strict" | "sloppy",
 *    operation: "read" | "write" | "initialize" | "discard" | "typeof",
 *  },
 * ) => import("../sequence").Sequence<
 *   import("./prelude").SyntaxErrorPrelude,
 *   import("../estree").Variable
 * >}
 */
export const extractVariable = ({ node, path }, options) =>
  initSequence(
    map(listSyntaxErrorMessage(node.name, options), (message) => ({
      type: "syntax-error",
      data: {
        message,
        origin: path,
      },
    })),
    node.name,
  );
