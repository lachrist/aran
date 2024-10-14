import { INITIAL_CATCH } from "./catch/index.mjs";
import { INITIAL_PROGRAM } from "./program/index.mjs";
import { INITIAL_PRIVATE } from "./private/index.mjs";
import { INITIAL_ROUTINE } from "./routine/index.mjs";
import { INITIAL_VARIABLE } from "./variable/index.mjs";
import { AranTypeError } from "../../error.mjs";

export * from "./catch/index.mjs";
export * from "./private/index.mjs";
export * from "./program/index.mjs";
export * from "./routine/index.mjs";
export * from "./variable/index.mjs";

/**
 * @type {(
 *   options: {
 *     root: import("../sort").RootSort,
 *     mode: import("../mode").Mode,
 *     annotation: import("../annotation").Annotation,
 *   },
 * ) => import(".").Scope}
 */
export const makeRootScope = ({ root, mode, annotation }) => ({
  annotation,
  mode,
  root,
  routine: INITIAL_ROUTINE,
  catch: INITIAL_CATCH,
  program: INITIAL_PROGRAM,
  private: INITIAL_PRIVATE,
  variable: INITIAL_VARIABLE,
});

/**
 * @type {(
 *   scope: import(".").Scope,
 * ) => import(".").Scope}
 */
export const extendStrict = (scope) => {
  switch (scope.mode) {
    case "strict": {
      return scope;
    }
    case "sloppy": {
      return { ...scope, mode: "strict" };
    }
    default: {
      throw new AranTypeError(scope.mode);
    }
  }
};
