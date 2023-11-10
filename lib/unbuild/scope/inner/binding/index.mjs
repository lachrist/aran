import { AranTypeError } from "../../../../util/index.mjs";
import {
  listEnclaveBindingDeclareStatement,
  listEnclaveBindingInitializeStatement,
  listEnclaveBindingVariable,
  listEnclaveBindingWriteEffect,
  makeEnclaveBindingDiscardExpression,
  makeEnclaveBindingReadExpression,
  makeEnclaveBindingTypeofExpression,
} from "./enclave.mjs";
import {
  listGlobalBindingDeclareStatement,
  listGlobalBindingInitializeStatement,
  listGlobalBindingVariable,
  listGlobalBindingWriteEffect,
  makeGlobalBindingDiscardExpression,
  makeGlobalBindingReadExpression,
  makeGlobalBindingTypeofExpression,
} from "./global.mjs";
import {
  listImportBindingDeclareStatement,
  listImportBindingInitializeStatement,
  listImportBindingVariable,
  listImportBindingWriteEffect,
  makeImportBindingDiscardExpression,
  makeImportBindingReadExpression,
  makeImportBindingTypeofExpression,
} from "./import.mjs";
import {
  listRegularBindingDeclareStatement,
  listRegularBindingInitializeStatement,
  listRegularBindingVariable,
  listRegularBindingWriteEffect,
  makeRegularBindingDiscardExpression,
  makeRegularBindingReadExpression,
  makeRegularBindingTypeofExpression,
} from "./regular.mjs";

/**
 * @typedef {import("./binding.d.ts").Binding} Binding
 * @typedef {import("./binding.d.ts").PresentBinding} PresentBinding
 * @typedef {import("./binding.d.ts").MissingBinding} MissingBinding
 */

/**
 * @type {(
 *   context: {},
 *   binding: PresentBinding,
 *   variable: estree.Variable,
 * ) => unbuild.Variable[]}
 */
export const listBindingVariable = (context, binding, variable) => {
  switch (binding.type) {
    case "import": {
      return listImportBindingVariable(context, binding, variable);
    }
    case "regular": {
      return listRegularBindingVariable(context, binding, variable);
    }
    case "global": {
      return listGlobalBindingVariable(context, binding, variable);
    }
    case "enclave": {
      return listEnclaveBindingVariable(context, binding, variable);
    }
    default: {
      throw new AranTypeError("invalid binding", binding);
    }
  }
};

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: {
 *       situ: "global" | "local",
 *     },
 *   },
 *   binding: PresentBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listBindingDeclareStatement = (
  context,
  binding,
  variable,
  path,
) => {
  switch (binding.type) {
    case "import": {
      return listImportBindingDeclareStatement(
        context,
        binding,
        variable,
        path,
      );
    }
    case "regular": {
      return listRegularBindingDeclareStatement(
        context,
        binding,
        variable,
        path,
      );
    }
    case "global": {
      return listGlobalBindingDeclareStatement(
        context,
        binding,
        variable,
        path,
      );
    }
    case "enclave": {
      return listEnclaveBindingDeclareStatement(
        context,
        binding,
        variable,
        path,
      );
    }
    default: {
      throw new AranTypeError("invalid binding", binding);
    }
  }
};

/**
 * @type {(
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *   },
 *   binding: PresentBinding,
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listBindingInitializeStatement = (
  context,
  binding,
  variable,
  right,
  path,
) => {
  switch (binding.type) {
    case "import": {
      return listImportBindingInitializeStatement(
        context,
        binding,
        variable,
        right,
        path,
      );
    }
    case "regular": {
      return listRegularBindingInitializeStatement(
        context,
        binding,
        variable,
        right,
        path,
      );
    }
    case "global": {
      return listGlobalBindingInitializeStatement(
        context,
        binding,
        variable,
        right,
        path,
      );
    }
    case "enclave": {
      return listEnclaveBindingInitializeStatement(
        context,
        binding,
        variable,
        right,
        path,
      );
    }
    default: {
      throw new AranTypeError("invalid binding", binding);
    }
  }
};

/**
 * @type {(
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *   },
 *   binding: Binding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBindingReadExpression = (context, binding, variable, path) => {
  switch (binding.type) {
    case "import": {
      return makeImportBindingReadExpression(context, binding, variable, path);
    }
    case "regular": {
      return makeRegularBindingReadExpression(context, binding, variable, path);
    }
    case "global": {
      return makeGlobalBindingReadExpression(context, binding, variable, path);
    }
    case "enclave": {
      return makeEnclaveBindingReadExpression(context, binding, variable, path);
    }
    default: {
      throw new AranTypeError("invalid binding", binding);
    }
  }
};

/**
 * @type {(
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *   },
 *   binding: Binding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBindingTypeofExpression = (
  context,
  binding,
  variable,
  path,
) => {
  switch (binding.type) {
    case "import": {
      return makeImportBindingTypeofExpression(
        context,
        binding,
        variable,
        path,
      );
    }
    case "regular": {
      return makeRegularBindingTypeofExpression(
        context,
        binding,
        variable,
        path,
      );
    }
    case "global": {
      return makeGlobalBindingTypeofExpression(
        context,
        binding,
        variable,
        path,
      );
    }
    case "enclave": {
      return makeEnclaveBindingTypeofExpression(
        context,
        binding,
        variable,
        path,
      );
    }
    default: {
      throw new AranTypeError("invalid binding", binding);
    }
  }
};

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: {
 *       situ: "global" | "local",
 *     },
 *   },
 *   binding: Binding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBindingDiscardExpression = (
  context,
  binding,
  variable,
  path,
) => {
  switch (binding.type) {
    case "import": {
      return makeImportBindingDiscardExpression(
        context,
        binding,
        variable,
        path,
      );
    }
    case "regular": {
      return makeRegularBindingDiscardExpression(
        context,
        binding,
        variable,
        path,
      );
    }
    case "global": {
      return makeGlobalBindingDiscardExpression(
        context,
        binding,
        variable,
        path,
      );
    }
    case "enclave": {
      return makeEnclaveBindingDiscardExpression(
        context,
        binding,
        variable,
        path,
      );
    }
    default: {
      throw new AranTypeError("invalid binding", binding);
    }
  }
};

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: {
 *       situ: "global" | "local",
 *     },
 *   },
 *   binding: Binding,
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listBindingWriteEffect = (
  context,
  binding,
  variable,
  right,
  path,
  meta,
) => {
  switch (binding.type) {
    case "import": {
      return listImportBindingWriteEffect(
        context,
        binding,
        variable,
        right,
        path,
      );
    }
    case "regular": {
      return listRegularBindingWriteEffect(
        context,
        binding,
        variable,
        right,
        path,
      );
    }
    case "global": {
      return listGlobalBindingWriteEffect(
        context,
        binding,
        variable,
        right,
        path,
        meta,
      );
    }
    case "enclave": {
      return listEnclaveBindingWriteEffect(
        context,
        binding,
        variable,
        right,
        path,
      );
    }
    default: {
      throw new AranTypeError("invalid binding", binding);
    }
  }
};
