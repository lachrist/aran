import { StaticError } from "../../../../util/error.mjs";
import {
  listEnclaveBindingDeclareStatement,
  listEnclaveBindingVariable,
  listEnclaveBindingWriteEffect,
  makeEnclaveBindingDiscardExpression,
  makeEnclaveBindingReadExpression,
  makeEnclaveBindingTypeofExpression,
} from "./enclave.mjs";
import {
  listGlobalBindingDeclareStatement,
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
    case "import":
      return listImportBindingVariable(strict, binding, variable);
    case "regular":
      return listRegularBindingVariable(strict, binding, variable);
    case "global":
      return listGlobalBindingVariable(strict, binding, variable);
    case "enclave":
      return listEnclaveBindingVariable(strict, binding, variable);
    default:
      throw new StaticError("invalid binding", binding);
  }
};

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: PresentBinding,
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const listBindingDeclareStatement = (
  strict,
  binding,
  variable,
  serial,
) => {
  switch (binding.type) {
    case "import":
      return listImportBindingDeclareStatement(
        strict,
        binding,
        variable,
        serial,
      );
    case "regular":
      return listRegularBindingDeclareStatement(
        strict,
        binding,
        variable,
        serial,
      );
    case "global":
      return listGlobalBindingDeclareStatement(
        strict,
        binding,
        variable,
        serial,
      );
    case "enclave":
      return listEnclaveBindingDeclareStatement(
        strict,
        binding,
        variable,
        serial,
      );
    default:
      throw new StaticError("invalid binding", binding);
  }
};

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: PresentBinding,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const listBindingInitializeStatement = (
  strict,
  binding,
  variable,
  right,
  serial,
) => {
  switch (binding.type) {
    case "import":
      return listImportBindingInitializeStatement(
        strict,
        binding,
        variable,
        right,
        serial,
      );
    case "regular":
      return listRegularBindingInitializeStatement(
        strict,
        binding,
        variable,
        right,
        serial,
      );
    case "global":
      return listGlobalBindingDeclareStatement(
        strict,
        binding,
        variable,
        serial,
      );
    case "enclave":
      return listEnclaveBindingDeclareStatement(
        strict,
        binding,
        variable,
        serial,
      );
    default:
      throw new StaticError("invalid binding", binding);
  }
};

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeBindingReadExpression = (
  strict,
  binding,
  variable,
  serial,
) => {
  switch (binding.type) {
    case "import":
      return makeImportBindingReadExpression(strict, binding, variable, serial);
    case "regular":
      return makeRegularBindingReadExpression(
        strict,
        binding,
        variable,
        serial,
      );
    case "global":
      return makeGlobalBindingReadExpression(strict, binding, variable, serial);
    case "enclave":
      return makeEnclaveBindingReadExpression(
        strict,
        binding,
        variable,
        serial,
      );
    default:
      throw new StaticError("invalid binding", binding);
  }
};

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeBindingTypeofExpression = (
  strict,
  binding,
  variable,
  serial,
) => {
  switch (binding.type) {
    case "import":
      return makeImportBindingTypeofExpression(
        strict,
        binding,
        variable,
        serial,
      );
    case "regular":
      return makeRegularBindingTypeofExpression(
        strict,
        binding,
        variable,
        serial,
      );
    case "global":
      return makeGlobalBindingTypeofExpression(
        strict,
        binding,
        variable,
        serial,
      );
    case "enclave":
      return makeEnclaveBindingTypeofExpression(
        strict,
        binding,
        variable,
        serial,
      );
    default:
      throw new StaticError("invalid binding", binding);
  }
};

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeBindingDiscardExpression = (
  strict,
  binding,
  variable,
  serial,
) => {
  switch (binding.type) {
    case "import":
      return makeImportBindingDiscardExpression(
        strict,
        binding,
        variable,
        serial,
      );
    case "regular":
      return makeRegularBindingDiscardExpression(
        strict,
        binding,
        variable,
        serial,
      );
    case "global":
      return makeGlobalBindingDiscardExpression(
        strict,
        binding,
        variable,
        serial,
      );
    case "enclave":
      return makeEnclaveBindingDiscardExpression(
        strict,
        binding,
        variable,
        serial,
      );
    default:
      throw new StaticError("invalid binding", binding);
  }
};

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   serial: S,
 * ) => aran.Effect<unbuild.Atom<S>>[]}
 */
export const listBindingWriteEffect = (
  strict,
  binding,
  variable,
  right,
  serial,
) => {
  switch (binding.type) {
    case "import":
      return listImportBindingWriteEffect(
        strict,
        binding,
        variable,
        right,
        serial,
      );
    case "regular":
      return listRegularBindingWriteEffect(
        strict,
        binding,
        variable,
        right,
        serial,
      );
    case "global":
      return listGlobalBindingWriteEffect(
        strict,
        binding,
        variable,
        right,
        serial,
      );
    case "enclave":
      return listEnclaveBindingWriteEffect(
        strict,
        binding,
        variable,
        right,
        serial,
      );
    default:
      throw new StaticError("invalid binding", binding);
  }
};
