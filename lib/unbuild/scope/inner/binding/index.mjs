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
 *     site: "global",
 *     enclave: boolean,
 *     kinds: Record<estree.Variable, estree.VariableKind>;
 *   } | {
 *     type: "module";
 *     site: "global",
 *     enclave: boolean;
 *     kinds: Record<estree.Variable, estree.VariableKind>;
 *     import: Record<estree.Variable, {
 *       source: estree.Source;
 *       specifier: estree.Specifier | null;
 *     }>;
 *     export: Record<estree.Variable, estree.Specifier[]>;
 *   } | {
 *     type: "eval";
 *     site: "global" | "local";
 *     enclave: boolean,
 *     kinds: Record<estree.Variable, estree.VariableKind>;
 *   } | {
 *     type: "block";
 *     kinds: Record<estree.Variable, estree.VariableKind>;
 *   }
 * )} Frame
 */

/**
 * @type {(
 *   options: {
 *     site: "global",
 *     enclave: boolean,
 *   } | {
 *     site: "local",
 *     enclave: true,
 *   },
 * ) => MissingBinding}
 */
export const makeMissingBinding = ({ site, enclave }) =>
  enclave
    ? { type: "enclave", kind: "missing", site }
    : { type: "global", kind: "missing" };

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
      return frame.enclave
        ? {
            type: "enclave",
            kind,
            site: "global",
          }
        : {
            type: "global",
            kind,
          };
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
      } else if (frame.site === "global" && !frame.enclave) {
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
 * @type {(
 *   strict: boolean,
 *   binding: PresentBinding,
 *   variable: estree.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listBindingDeclareStatement = (
  strict,
  binding,
  variable,
  origin,
) => {
  switch (binding.type) {
    case "import":
      return listImportBindingDeclareStatement(
        strict,
        binding,
        variable,
        origin,
      );
    case "regular":
      return listRegularBindingDeclareStatement(
        strict,
        binding,
        variable,
        origin,
      );
    case "global":
      return listGlobalBindingDeclareStatement(
        strict,
        binding,
        variable,
        origin,
      );
    case "enclave":
      return listEnclaveBindingDeclareStatement(
        strict,
        binding,
        variable,
        origin,
      );
    default:
      throw new StaticError("invalid binding", binding);
  }
};

/**
 * @type {(
 *   strict: boolean,
 *   binding: PresentBinding,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listBindingInitializeStatement = (
  strict,
  binding,
  variable,
  right,
  origin,
) => {
  switch (binding.type) {
    case "import":
      return listImportBindingInitializeStatement(
        strict,
        binding,
        variable,
        right,
        origin,
      );
    case "regular":
      return listRegularBindingInitializeStatement(
        strict,
        binding,
        variable,
        right,
        origin,
      );
    case "global":
      return listGlobalBindingDeclareStatement(
        strict,
        binding,
        variable,
        origin,
      );
    case "enclave":
      return listEnclaveBindingDeclareStatement(
        strict,
        binding,
        variable,
        origin,
      );
    default:
      throw new StaticError("invalid binding", binding);
  }
};

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBindingReadExpression = (
  strict,
  binding,
  variable,
  origin,
) => {
  switch (binding.type) {
    case "import":
      return makeImportBindingReadExpression(strict, binding, variable, origin);
    case "regular":
      return makeRegularBindingReadExpression(
        strict,
        binding,
        variable,
        origin,
      );
    case "global":
      return makeGlobalBindingReadExpression(strict, binding, variable, origin);
    case "enclave":
      return makeEnclaveBindingReadExpression(
        strict,
        binding,
        variable,
        origin,
      );
    default:
      throw new StaticError("invalid binding", binding);
  }
};

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBindingTypeofExpression = (
  strict,
  binding,
  variable,
  origin,
) => {
  switch (binding.type) {
    case "import":
      return makeImportBindingTypeofExpression(
        strict,
        binding,
        variable,
        origin,
      );
    case "regular":
      return makeRegularBindingTypeofExpression(
        strict,
        binding,
        variable,
        origin,
      );
    case "global":
      return makeGlobalBindingTypeofExpression(
        strict,
        binding,
        variable,
        origin,
      );
    case "enclave":
      return makeEnclaveBindingTypeofExpression(
        strict,
        binding,
        variable,
        origin,
      );
    default:
      throw new StaticError("invalid binding", binding);
  }
};

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBindingDiscardExpression = (
  strict,
  binding,
  variable,
  origin,
) => {
  switch (binding.type) {
    case "import":
      return makeImportBindingDiscardExpression(
        strict,
        binding,
        variable,
        origin,
      );
    case "regular":
      return makeRegularBindingDiscardExpression(
        strict,
        binding,
        variable,
        origin,
      );
    case "global":
      return makeGlobalBindingDiscardExpression(
        strict,
        binding,
        variable,
        origin,
      );
    case "enclave":
      return makeEnclaveBindingDiscardExpression(
        strict,
        binding,
        variable,
        origin,
      );
    default:
      throw new StaticError("invalid binding", binding);
  }
};

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listBindingWriteEffect = (
  strict,
  binding,
  variable,
  right,
  origin,
) => {
  switch (binding.type) {
    case "import":
      return listImportBindingWriteEffect(
        strict,
        binding,
        variable,
        right,
        origin,
      );
    case "regular":
      return listRegularBindingWriteEffect(
        strict,
        binding,
        variable,
        right,
        origin,
      );
    case "global":
      return listGlobalBindingWriteEffect(
        strict,
        binding,
        variable,
        right,
        origin,
      );
    case "enclave":
      return listEnclaveBindingWriteEffect(
        strict,
        binding,
        variable,
        right,
        origin,
      );
    default:
      throw new StaticError("invalid binding", binding);
  }
};
