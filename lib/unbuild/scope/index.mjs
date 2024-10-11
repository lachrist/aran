import { mapSequence } from "../../sequence.mjs";
import { INITIAL_CATCH } from "./catch/index.mjs";
import { INITIAL_PROGRAM } from "./index.mjs";
import { INITIAL_PRIVATE } from "./private/index.mjs";
import { setupInitialRoutine } from "./routine/index.mjs";
import { INITIAL_VARIABLE } from "./variable/index.mjs";

export * from "./catch/index.mjs";
export * from "./private/index.mjs";
export * from "./program/index.mjs";
export * from "./routine/index.mjs";
export * from "./variable/index.mjs";

/**
 * @type {(
 *   hash: import("../../hash").Hash,
 *   meta: import("../meta").Meta,
 *   options: {
 *     root: import("../sort").RootSort,
 *     mode: import("../mode").Mode,
 *     result: "direct" | "indirect",
 *   },
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../prelude").MetaDeclarationPrelude
 *     | import("../prelude").PrefixPrelude
 *   ),
 *   import(".").Scope,
 * >}
 */
export const setupScope = (hash, meta, { root, mode, result }) =>
  mapSequence(setupInitialRoutine(hash, meta, { result }), (routine) => ({
    mode,
    root,
    routine,
    catch: INITIAL_CATCH,
    program: INITIAL_PROGRAM,
    private: INITIAL_PRIVATE,
    variable: INITIAL_VARIABLE,
  }));
