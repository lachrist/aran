import { makeWarningPrelude } from "./prelude.mjs";
import { prependSequence } from "../sequence.mjs";

/**
 * @type {<P, X>(
 *   warning: import("./warning").Warning,
 *   sequence: import("../sequence").Sequence<P, X>,
 * ) => import("../sequence").Sequence<
 *   P | import("./prelude").WarningPrelude,
 *   X,
 * >}
 */
export const warn = (warning, sequence) =>
  prependSequence([makeWarningPrelude(warning)], sequence);

/**
 * @type {<P, X>(
 *   guard: boolean,
 *   warning: import("./warning").Warning,
 *   sequence: import("../sequence").Sequence<P, X>,
 * ) => import("../sequence").Sequence<
 *   P | import("./prelude").WarningPrelude,
 *   X,
 * >}
 */
export const warnGuard = (guard, warning, sequence) =>
  guard ? warn(warning, sequence) : sequence;
