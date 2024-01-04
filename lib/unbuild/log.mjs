import { makeLogPrelude } from "./prelude.mjs";
import { prependSequence } from "./sequence.mjs";

/**
 * @type {<P, X>(
 *   log: import("./log").Log,
 *   sequence: import("./sequence").Sequence<P, X>,
 * ) => import("./sequence").Sequence<
 *   P | import("./prelude").LogPrelude,
 *   X,
 * >}
 */
export const reportLog = (log, sequence) =>
  prependSequence([makeLogPrelude(log)], sequence);

/**
 * @type {<P, X>(
 *   guard: boolean,
 *   log: import("./log").Log,
 *   sequence: import("./sequence").Sequence<P, X>,
 * ) => import("./sequence").Sequence<
 *   P | import("./prelude").LogPrelude,
 *   X,
 * >}
 */
export const reportGuardLog = (guard, log, sequence) =>
  guard ? reportLog(log, sequence) : sequence;
