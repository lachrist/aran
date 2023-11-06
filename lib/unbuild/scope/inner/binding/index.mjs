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
 *   strict: boolean,
 *   binding: PresentBinding,
 *   variable: estree.Variable,
 * ) => unbuild.Variable[]}
 */
export const listBindingVariable = (strict, binding, variable) => {
  switch (binding.type) {
    case "import": {
      return listImportBindingVariable(strict, binding, variable);
    }
    case "regular": {
      return listRegularBindingVariable(strict, binding, variable);
    }
    case "global": {
      return listGlobalBindingVariable(strict, binding, variable);
    }
    case "enclave": {
      return listEnclaveBindingVariable(strict, binding, variable);
    }
    default: {
      throw new AranTypeError("invalid binding", binding);
    }
  }
};

/**
 * @type {(
 *   strict: boolean,
 *   binding: PresentBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listBindingDeclareStatement = (
  strict,
  binding,
  variable,
  path,
) => {
  switch (binding.type) {
    case "import": {
      return listImportBindingDeclareStatement(strict, binding, variable, path);
    }
    case "regular": {
      return listRegularBindingDeclareStatement(
        strict,
        binding,
        variable,
        path,
      );
    }
    case "global": {
      return listGlobalBindingDeclareStatement(strict, binding, variable, path);
    }
    case "enclave": {
      return listEnclaveBindingDeclareStatement(
        strict,
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
 *   strict: boolean,
 *   binding: PresentBinding,
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listBindingInitializeStatement = (
  strict,
  binding,
  variable,
  right,
  path,
) => {
  switch (binding.type) {
    case "import": {
      return listImportBindingInitializeStatement(
        strict,
        binding,
        variable,
        right,
        path,
      );
    }
    case "regular": {
      return listRegularBindingInitializeStatement(
        strict,
        binding,
        variable,
        right,
        path,
      );
    }
    case "global": {
      return listGlobalBindingInitializeStatement(
        strict,
        binding,
        variable,
        right,
        path,
      );
    }
    case "enclave": {
      return listEnclaveBindingInitializeStatement(
        strict,
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
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBindingReadExpression = (strict, binding, variable, path) => {
  switch (binding.type) {
    case "import": {
      return makeImportBindingReadExpression(strict, binding, variable, path);
    }
    case "regular": {
      return makeRegularBindingReadExpression(strict, binding, variable, path);
    }
    case "global": {
      return makeGlobalBindingReadExpression(strict, binding, variable, path);
    }
    case "enclave": {
      return makeEnclaveBindingReadExpression(strict, binding, variable, path);
    }
    default: {
      throw new AranTypeError("invalid binding", binding);
    }
  }
};

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBindingTypeofExpression = (
  strict,
  binding,
  variable,
  path,
) => {
  switch (binding.type) {
    case "import": {
      return makeImportBindingTypeofExpression(strict, binding, variable, path);
    }
    case "regular": {
      return makeRegularBindingTypeofExpression(
        strict,
        binding,
        variable,
        path,
      );
    }
    case "global": {
      return makeGlobalBindingTypeofExpression(strict, binding, variable, path);
    }
    case "enclave": {
      return makeEnclaveBindingTypeofExpression(
        strict,
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
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBindingDiscardExpression = (
  strict,
  binding,
  variable,
  path,
) => {
  switch (binding.type) {
    case "import": {
      return makeImportBindingDiscardExpression(
        strict,
        binding,
        variable,
        path,
      );
    }
    case "regular": {
      return makeRegularBindingDiscardExpression(
        strict,
        binding,
        variable,
        path,
      );
    }
    case "global": {
      return makeGlobalBindingDiscardExpression(
        strict,
        binding,
        variable,
        path,
      );
    }
    case "enclave": {
      return makeEnclaveBindingDiscardExpression(
        strict,
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
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listBindingWriteEffect = (
  strict,
  binding,
  variable,
  right,
  path,
  meta,
) => {
  switch (binding.type) {
    case "import": {
      return listImportBindingWriteEffect(
        strict,
        binding,
        variable,
        right,
        path,
      );
    }
    case "regular": {
      return listRegularBindingWriteEffect(
        strict,
        binding,
        variable,
        right,
        path,
      );
    }
    case "global": {
      return listGlobalBindingWriteEffect(
        strict,
        binding,
        variable,
        right,
        path,
        meta,
      );
    }
    case "enclave": {
      return listEnclaveBindingWriteEffect(
        strict,
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
