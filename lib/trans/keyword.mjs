import {
  KEYWORD_RECORD,
  STRICT_KEYWORD_RECORD,
  STRICT_READONLY_KEYWORD_RECORD,
} from "estree-sentry";
import { map, hasNarrowKey, initSequence } from "../util/index.mjs";

/**
 * @type {(
 *  variable: import("estree-sentry").VariableName,
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
 *  node: import("estree-sentry").VariableIdentifier<import("./hash.d.ts").HashProp>,
 *  options: {
 *    mode: "strict" | "sloppy",
 *    operation: "read" | "write" | "initialize" | "discard" | "typeof",
 *  },
 * ) => import("../util/sequence.d.ts").Sequence<
 *   import("./prelude/index.d.ts").SyntaxErrorPrelude,
 *   import("estree-sentry").VariableName
 * >}
 */
export const extractVariable = (node, options) =>
  initSequence(
    map(listSyntaxErrorMessage(node.name, options), (message) => ({
      type: "syntax-error",
      data: {
        message,
        origin: node._hash,
      },
    })),
    node.name,
  );
