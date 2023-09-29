import { reportLimitation } from "../../../../limitation.mjs";
import { StaticError, hasOwn } from "../../../../util/index.mjs";
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
 * @typedef {(
 *   | {
 *     type: "script";
 *     root: "global.external" | "global.internal",
 *     kinds: Record<estree.Variable, estree.VariableKind>;
 *   } | {
 *     type: "module";
 *     root: "global.external" | "global.internal",
 *     kinds: Record<estree.Variable, estree.VariableKind>;
 *     import: Record<estree.Variable, {
 *       source: estree.Source;
 *       specifier: estree.Specifier | null;
 *     }>;
 *     export: Record<estree.Variable, estree.Specifier[]>;
 *   } | {
 *     type: "eval";
 *     root:
 *       | "global.external"
 *       | "global.internal"
 *       | "local.external"
 *       | "local.internal",
 *     kinds: Record<estree.Variable, estree.VariableKind>;
 *   } | {
 *     type: "block";
 *     kinds: Record<estree.Variable, estree.VariableKind>;
 *   }
 * )} Frame
 */

/**
 * @type {(
 *   root: "global.internal" | "global.external" | "local.external",
 * ) => MissingBinding}
 */
export const makeMissingBinding = (root) => {
  switch (root) {
    case "global.internal":
      return { type: "global", kind: "missing" };
    case "global.external":
      return { type: "enclave", kind: "missing", spot: "global" };
    case "local.external":
      return { type: "enclave", kind: "missing", spot: "local" };
    default:
      throw new StaticError("invalid missing binding kind", root);
  }
};

/**
 * @type {(
 *   strict: boolean,
 *   kind: "let" | "const" | "var",
 *   variable: estree.Variable,
 *   frame: Frame,
 * ) => PresentBinding}
 */
export const makePresentBinding = (strict, kind, variable, frame) => {
  switch (frame.type) {
    case "script":
      switch (frame.root) {
        case "global.internal":
          return {
            type: "global",
            kind,
          };
        case "global.external":
          return {
            type: "enclave",
            kind,
            spot: "global",
          };
        default:
          throw new StaticError("invalid script frame root", frame);
      }
    case "module":
      if (hasOwn(frame.import, variable)) {
        return {
          type: "import",
          ...frame.import[variable],
        };
      } else {
        return {
          type: "regular",
          kind,
          exports: hasOwn(frame.export, variable) ? frame.export[variable] : [],
        };
      }
    case "eval":
      if (strict || kind !== "var") {
        return {
          type: "regular",
          kind,
          exports: [],
        };
      } else if ("global.internal") {
        return {
          type: "global",
          kind,
        };
      } else {
        reportLimitation(`internalizing external variable ${variable}`);
        return {
          type: "regular",
          kind,
          exports: [],
        };
      }
    case "block":
      return {
        type: "regular",
        kind,
        exports: [],
      };
    default:
      throw new StaticError("invalid frame", frame);
  }
};

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
