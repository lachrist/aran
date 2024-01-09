import { makeWarningPrelude } from "./prelude.mjs";
import { prependSequence } from "./sequence.mjs";

/**
 * @type {<P, X>(
 *   log: import("./warning").Warning,
 *   sequence: import("./sequence").Sequence<P, X>,
 * ) => import("./sequence").Sequence<
 *   P | import("./prelude").WarningPrelude,
 *   X,
 * >}
 */
export const warn = (warning, sequence) =>
  prependSequence([makeWarningPrelude(warning)], sequence);

/**
 * @type {<P, X>(
 *   guard: boolean,
 *   log: import("./warning").Warning,
 *   sequence: import("./sequence").Sequence<P, X>,
 * ) => import("./sequence").Sequence<
 *   P | import("./prelude").WarningPrelude,
 *   X,
 * >}
 */
export const warnGuard = (guard, log, sequence) =>
  guard ? warn(log, sequence) : sequence;
