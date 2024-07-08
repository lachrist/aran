import { makeWarningPrelude } from "./unbuild/prelude.mjs";
import { prependSequence } from "./sequence.mjs";

/**
 * @type {<P, X>(
 *   warning: import("./warning").Warning,
 *   sequence: import("./sequence").Sequence<P, X>,
 * ) => import("./sequence").Sequence<
 *   P | import("./unbuild/prelude").WarningPrelude,
 *   X,
 * >}
 */
export const warn = (warning, sequence) =>
  prependSequence([makeWarningPrelude(warning)], sequence);

/**
 * @type {<P, X>(
 *   guard: boolean,
 *   warning: import("./warning").Warning,
 *   sequence: import("./sequence").Sequence<P, X>,
 * ) => import("./sequence").Sequence<
 *   P | import("./unbuild/prelude").WarningPrelude,
 *   X,
 * >}
 */
export const warnGuard = (guard, warning, sequence) =>
  guard ? warn(warning, sequence) : sequence;

/**
 * @type {{
 *   [key in import("./warning").WarningName]: string
 * }}
 */
export const WARNING_MESSAGE = {
  ExternalConstant: "External constant",
  ExternalDeadzone: "External deadzone",
  ExternalSloppyFunction: "External sloppy function",
  SloppyBlockFunctionDeclaration: "Sloppy block function declaration",
  StrictKeywordExternalVariable: "Strict keyword external variable",
  StrictReadonlyExternalVariableWrite:
    "Strict readonly external variable write",
  ExternalVariableClash: "External variable clash",
  DirectEvalExternalVariableDeclaration:
    "Direct eval external variable declaration",
  KeywordLocalExternalRead: "Keyword local external read",
  KeywordLocalExternalTypeof: "Keyword local external typeof",
  SloppyLocalExternalDiscard: "Sloppy local external discard",
  SloppyLocalExternalWrite: "Sloppy local external write",
  KeywordLocalExternalWrite: "Keyword local external write",
};
