import { AranTypeError } from "../error.mjs";
import { compileMatchParameterHeader, isParameterHeader } from "../header.mjs";
import { hasEvalCall, hasParameter } from "../query.mjs";
import { concat_XX, filter, filterNarrow, map } from "../util/index.mjs";
import { makeStaticParameterDeclaration } from "./program-parameter-static.mjs";
import {
  makeRecordDeclaration,
  makeEvalDeclaration,
  makeDynamicParameterDeclaration,
  makeRecordUpdate,
} from "./program-parameter-dynamic.mjs";

/**
 * @type {(
 *   root: aran.Program<import("./atom").Atom>,
 * ) => import("../header").HeaderParameter[]}
 */
const listProgramParameter = (root) => {
  switch (root.kind) {
    case "module": {
      return [
        "this",
        "import.meta",
        "import.dynamic",
        "scope.read",
        "scope.write",
        "scope.typeof",
        "scope.discard",
      ];
    }
    case "script": {
      return [
        "this",
        "import.dynamic",
        "scope.read",
        "scope.write",
        "scope.typeof",
        "scope.discard",
      ];
    }
    case "eval": {
      switch (root.situ) {
        case "global": {
          return [
            "this",
            "import.dynamic",
            "scope.read",
            "scope.write",
            "scope.typeof",
            "scope.discard",
          ];
        }
        case "local.root": {
          return [
            "this",
            "new.target",
            "import.meta",
            "import.dynamic",
            "super.get",
            "super.set",
            "super.call",
            "private.get",
            "private.set",
            "private.has",
            "scope.read",
            "scope.write",
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
 *   root: aran.Program<import("./atom").Atom>,
 *   config: import("./config").Config,
 * ) => estree.Statement[]}
 */
export const makeProgramParameterDeclaration = (root, config) => {
  if (root.situ === "local.deep") {
    return makeRecordUpdate(filterNarrow(root.head, isParameterHeader), config);
  } else if (hasEvalCall(root)) {
    return concat_XX(
      makeEvalDeclaration(root.situ, config),
      makeRecordDeclaration(filterNarrow(root.head, isParameterHeader), config),
      map(listProgramParameter(root), (parameter) =>
        makeDynamicParameterDeclaration(parameter, config),
      ),
    );
  } else {
    return map(
      filter(listProgramParameter(root), (parameter) =>
        hasParameter(root, parameter),
      ),
      (parameter) =>
        makeStaticParameterDeclaration(
          parameter,
          filterNarrow(
            /** @type {import("../header").Header[]} */ (root.head),
            compileMatchParameterHeader(parameter),
          ),
          config,
        ),
    );
  }
};
