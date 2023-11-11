import { hasOwn, AranTypeError } from "../../../util/index.mjs";

/**
 * @typedef {import("./binding/index.mjs").Binding} Binding
 * @typedef {import("./binding/index.mjs").PresentBinding} PresentBinding
 * @typedef {import("./binding/index.mjs").MissingBinding} MissingBinding
 */

/**
 * @typedef {{
 *   type: "program",
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

/** @type {MissingBinding} */
export const MISSING_BINDING = { type: "root", kind: "missing" };

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../../context.d.ts").Root,
 *   },
 *   kind: "let" | "const" | "var",
 *   variable: estree.Variable,
 *   frame: Frame,
 * ) => PresentBinding}
 */
export const makePresentBinding = (context, kind, variable, frame) => {
  switch (frame.type) {
    case "program": {
      switch (context.root.kind) {
        case "script": {
          return { type: "root", kind };
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
          if (context.mode === "strict" || kind !== "var") {
            return {
              type: "regular",
              kind,
              internalized: false,
              exports: [],
            };
          } else if (
            context.root.situ === "global" &&
            context.root.plug === "reify"
          ) {
            return { type: "root", kind };
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
          throw new AranTypeError("invalid context.root", context.root);
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
