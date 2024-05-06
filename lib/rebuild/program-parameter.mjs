import { AranTypeError } from "../error.mjs";
import {
  isLookupEagerHeader,
  isPrivateEagerHeader,
  matchEagerHeader,
} from "../header.mjs";
import { hasEvalCall, hasParameter } from "../query.mjs";
import { concatXX, filter, filterNarrow, map } from "../util/index.mjs";
import {
  LOOKUP_PARAMETER_ENUM,
  initializeLookupParameter,
  updateLookupParameter,
} from "./program-parameter-lookup.mjs";
import { updatePrivateParameter } from "./program-parameter-private.mjs";
import { initializeSimpleParameter } from "./program-parameter-simple.mjs";
import {
  EVAL_PARAMETER_ENUM,
  initializeEvalParameter,
} from "./program-parameter-tantative.mjs";

/**
 * @type {(
 *   kind: "eval" | "module" | "script",
 * ) => ("this" | "import.meta" | "import.dynamic")[]}
 */
const enumerateSimpleGlobalParameter = (kind) => {
  if (kind === "module") {
    return ["this", "import.meta", "import.dynamic"];
  } else if (kind === "eval" || kind === "script") {
    return ["this", "import.dynamic"];
  } else {
    throw new AranTypeError(kind);
  }
};

/**
 * @type {(
 *   root: aran.Program<rebuild.Atom>,
 *   config: import("./config").Config,
 * ) => estree.Statement[]}
 */
export const initializeProgramParameter = (root, config) => {
  /**
   * @type {(
   *   parameter: aran.Parameter,
   * ) => boolean}
   */
  const shouldInitialize = hasEvalCall(root)
    ? (_parameter) => true
    : (parameter) => hasParameter(root, parameter);
  switch (root.situ) {
    case "global": {
      return [
        ...map(
          filter(enumerateSimpleGlobalParameter(root.kind), shouldInitialize),
          (parameter) => initializeSimpleParameter(parameter, config),
        ),
        ...map(filter(LOOKUP_PARAMETER_ENUM, shouldInitialize), (parameter) =>
          initializeLookupParameter(
            parameter,
            filterNarrow(root.head, (header) =>
              matchEagerHeader(header, parameter),
            ),
            config,
          ),
        ),
      ];
    }
    case "local.root": {
      return [
        ...map(filter(EVAL_PARAMETER_ENUM, shouldInitialize), (parameter) =>
          initializeEvalParameter(parameter, config),
        ),
        ...map(filter(LOOKUP_PARAMETER_ENUM, shouldInitialize), (parameter) =>
          initializeLookupParameter(
            parameter,
            filterNarrow(root.head, (header) =>
              matchEagerHeader(header, parameter),
            ),
            config,
          ),
        ),
      ];
    }
    case "local.deep": {
      return concatXX(
        map(filterNarrow(root.head, isLookupEagerHeader), (header) =>
          updateLookupParameter(header, config),
        ),
        map(filterNarrow(root.head, isPrivateEagerHeader), (header) =>
          updatePrivateParameter(header, config),
        ),
      );
    }
    default: {
      throw new AranTypeError(root);
    }
  }
};
