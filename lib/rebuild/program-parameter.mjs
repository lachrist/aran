import { AranTypeError } from "../error.mjs";
import { hasEvalCall, hasParameter } from "../query.mjs";
import { filter, flatMap } from "../util/index.mjs";
import { listRegularParameterDeclaration } from "./parameter-regular.mjs";
import { listUnsafeParameterDeclaration } from "./parameter-unsafe.mjs";
import { listPrivateParameterDeclaration } from "./parameter-private.mjs";
import { listScopeParameterDeclaration } from "./parameter-scope.mjs";

/**
 * @type {(
 *   root: import("./atom").Program,
 * ) => import("./program-parameter").ProgramParameter[]}
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
 *   parameter: import("./program-parameter").ProgramParameter,
 *   config: import("./config").Config,
 * ) => import("../estree").Statement[]}
 */
const listParameterDeclaration = (parameter, config) => {
  if (parameter === "this" || parameter === "import") {
    return listRegularParameterDeclaration(parameter, config);
  } else if (parameter === "import.meta@regular") {
    return listRegularParameterDeclaration("import.meta", config);
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
    return listPrivateParameterDeclaration(config);
  } else if (
    parameter === "scope.discard" ||
    parameter === "scope.typeof" ||
    parameter === "scope.read" ||
    parameter === "scope.writeStrict" ||
    parameter === "scope.writeSloppy"
  ) {
    return listScopeParameterDeclaration(parameter, config);
  } else {
    throw new AranTypeError(parameter);
  }
};

/**
 * @type {(
 *   root: import("./atom").Program,
 *   parameter: import("./program-parameter").ProgramParameter,
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
 *   root: import("./atom").Program,
 *   config: import("./config").Config,
 * ) => import("../estree").Statement[]}
 */
export const listProgramParameterDeclaration = (root, config) => {
  const dynamic = hasEvalCall(root);
  return flatMap(
    filter(
      listProgramParameter(root),
      (parameter) => dynamic || hasProgramParameter(root, parameter),
    ),
    (parameter) => listParameterDeclaration(parameter, config),
  );
};
