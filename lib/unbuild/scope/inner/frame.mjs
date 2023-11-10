import { hasOwn, AranTypeError } from "../../../util/index.mjs";

/**
 * @typedef {import("./binding/index.mjs").Binding} Binding
 * @typedef {import("./binding/index.mjs").PresentBinding} PresentBinding
 * @typedef {import("./binding/index.mjs").MissingBinding} MissingBinding
 */

/**
 * @typedef {{
 *   type: "program",
 *   kind: "script",
 *   situ: "global",
 *   enclave: boolean,
 *   import: {},
 *   export: {},
 *   kinds: Record<estree.Variable, estree.VariableKind>,
 * } | {
 *   type: "program",
 *   kind: "eval",
 *   situ: "global" | "local",
 *   enclave: boolean,
 *   import: {},
 *   export: {},
 *   kinds: Record<estree.Variable, estree.VariableKind>,
 * } | {
 *   type: "program",
 *   kind: "module",
 *   situ: "global",
 *   enclave: boolean,
 *   import: Record<estree.Variable, {
 *     source: estree.Source;
 *     specifier: estree.Specifier | null;
 *   }>,
 *   export: Record<estree.Variable, estree.Specifier[]>,
 *   kinds: Record<estree.Variable, estree.VariableKind>,
 * }} ProgramFrame
 */

/**
 * @typedef {{
 *   type: "closure",
 *   kinds: Record<estree.Variable, estree.VariableKind>,
 * }} ClosureFrame
 */

/**
 * @typedef {{
 *   type: "block",
 *   kinds: Record<estree.Variable, estree.VariableKind>,
 * }} BlockFrame
 */

/** @typedef {ProgramFrame | ClosureFrame | BlockFrame} Frame */

/**
 * @type {(
 *   options: {
 *     situ: "global",
 *     enclave: boolean,
 *   } | {
 *     situ: "local",
 *     enclave: true,
 *   },
 * ) => MissingBinding}
 */
export const makeMissingBinding = ({ situ, enclave }) =>
  enclave
    ? { type: "enclave", kind: "missing", situ }
    : { type: "global", kind: "missing" };

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   kind: "let" | "const" | "var",
 *   variable: estree.Variable,
 *   frame: Frame,
 * ) => PresentBinding}
 */
export const makePresentBinding = (strict, kind, variable, frame) => {
  switch (frame.type) {
    case "program": {
      switch (frame.kind) {
        case "script": {
          return frame.enclave
            ? {
                type: "enclave",
                kind,
                situ: "global",
              }
            : {
                type: "global",
                kind,
              };
        }
        case "module": {
          if (hasOwn(frame.import, variable)) {
            return {
              type: "import",
              ...frame.import[variable],
            };
          } else {
            return {
              type: "regular",
              kind,
              internalized: false,
              exports: hasOwn(frame.export, variable)
                ? frame.export[variable]
                : [],
            };
          }
        }
        case "eval": {
          if (strict || kind !== "var") {
            return {
              type: "regular",
              kind,
              internalized: false,
              exports: [],
            };
          } else if (frame.situ === "global" && !frame.enclave) {
            return {
              type: "global",
              kind,
            };
          } else {
            return {
              type: "regular",
              kind,
              internalized: true,
              exports: [],
            };
          }
        }
        default: {
          throw new AranTypeError("invalid program frame", frame);
        }
      }
    }
    case "closure": {
      return {
        type: "regular",
        kind,
        internalized: false,
        exports: [],
      };
    }
    case "block": {
      return {
        type: "regular",
        kind,
        internalized: false,
        exports: [],
      };
    }
    default: {
      throw new AranTypeError("invalid frame", frame);
    }
  }
};
