import { AranTypeError } from "../error.mjs";
import { hasEvalCall, hasParameter } from "../lang/index.mjs";
import { map } from "../util/index.mjs";
import { makeRegularParameterDeclaration } from "./parameter-regular.mjs";
import { listUnsafeParameterDeclaration } from "./parameter-unsafe.mjs";
import { makePrivateParameterDeclaration } from "./parameter-private.mjs";
import { makeScopeParameterDeclaration } from "./parameter-scope.mjs";

/**
 * @type {(
 *   root: import("./atom.d.ts").Program,
 * ) => import("./program-parameter.d.ts").ProgramParameter[]}
 */
const listProgramParameter = (root) => {
  switch (root.kind) {
    case "module": {
      return ["this", "import", "import.meta@regular"];
    }
    case "script": {
      return ["this", "import"];
    }
    case "eval": {
      switch (root.situ) {
        case "global": {
          return ["this", "import"];
        }
        case "local.root": {
          return [
            "this",
            "import",
            "import.meta@unsafe",
            "new.target",
            "super.get",
            "super.set",
            "super.call",
            "private",
            "scope.read",
            "scope.writeStrict",
            "scope.writeSloppy",
            "scope.typeof",
            "scope.discard",
          ];
        }
        case "local.deep": {
          return [];
        }
        default: {
          throw new AranTypeError(root);
        }
      }
    }
    default: {
      throw new AranTypeError(root);
    }
  }
};

/**
 * @type {(
 *   parameter: import("./program-parameter.d.ts").ProgramParameter,
 *   config: import("./config-internal.d.ts").InternalConfig,
 * ) => import("../util/tree.d.ts").Tree<
 *   import("estree-sentry").Statement<{}>,
 * >}
 */
const listParameterDeclaration = (parameter, config) => {
  if (parameter === "this" || parameter === "import") {
    return makeRegularParameterDeclaration(parameter, config);
  } else if (parameter === "import.meta@regular") {
    return makeRegularParameterDeclaration("import.meta", config);
  } else if (parameter === "import.meta@unsafe") {
    return listUnsafeParameterDeclaration("import.meta", config);
  } else if (
    parameter === "new.target" ||
    parameter === "super.get" ||
    parameter === "super.set" ||
    parameter === "super.call"
  ) {
    return listUnsafeParameterDeclaration(parameter, config);
  } else if (parameter === "private") {
    return makePrivateParameterDeclaration(config);
  } else if (
    parameter === "scope.discard" ||
    parameter === "scope.typeof" ||
    parameter === "scope.read" ||
    parameter === "scope.writeStrict" ||
    parameter === "scope.writeSloppy"
  ) {
    return makeScopeParameterDeclaration(parameter, config);
  } else {
    throw new AranTypeError(parameter);
  }
};

/**
 * @type {(
 *   root: import("./atom.d.ts").Program,
 *   parameter: import("./program-parameter.d.ts").ProgramParameter,
 * ) => boolean}
 */
const hasProgramParameter = (root, parameter) => {
  if (
    parameter === "import.meta@regular" ||
    parameter === "import.meta@unsafe"
  ) {
    return hasParameter(root, "import.meta");
  } else if (parameter === "private") {
    return (
      hasParameter(root, "private.check") ||
      hasParameter(root, "private.get") ||
      hasParameter(root, "private.set") ||
      hasParameter(root, "private.has")
    );
  } else if (
    parameter === "this" ||
    parameter === "import" ||
    parameter === "scope.discard" ||
    parameter === "scope.typeof" ||
    parameter === "scope.read" ||
    parameter === "scope.writeStrict" ||
    parameter === "scope.writeSloppy" ||
    parameter === "super.get" ||
    parameter === "super.set" ||
    parameter === "super.call" ||
    parameter === "new.target"
  ) {
    return hasParameter(root, parameter);
  } else {
    throw new AranTypeError(parameter);
  }
};

/**
 * @type {(
 *   root: import("./atom.d.ts").Program,
 *   config: import("./config-internal.d.ts").InternalConfig,
 * ) => import("../util/tree.d.ts").Tree<import("estree-sentry").Statement<{}>>}
 */
export const listProgramParameterDeclaration = (root, config) => {
  const dynamic = hasEvalCall(root);
  return map(listProgramParameter(root), (parameter) =>
    dynamic || hasProgramParameter(root, parameter)
      ? listParameterDeclaration(parameter, config)
      : null,
  );
};
