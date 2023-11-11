import { hasOwn, map } from "../../../util/index.mjs";

const {
  Object: { entries: listEntry },
} = globalThis;

/**
 * @typedef {import("./binding/index.mjs").Binding} Binding
 * @typedef {import("./binding/index.mjs").PresentBinding} PresentBinding
 * @typedef {import("./binding/index.mjs").MissingBinding} MissingBinding
 */

/**
 * @typedef {{
 *   root: true,
 *   link: null,
 *   kinds: Record<estree.Variable, estree.VariableKind>,
 * }} RootFrame
 */

/**
 * @typedef {{
 *   root: false,
 *   link: null | {
 *     import: Record<estree.Variable, {
 *       source: estree.Source;
 *       specifier: estree.Specifier | null;
 *     }>,
 *     export: Record<estree.Variable, estree.Specifier[]>,
 *   },
 *   kinds: Record<estree.Variable, estree.VariableKind>,
 * }} NodeFrame
 */

/** @typedef {RootFrame | NodeFrame} Frame */

/**
 * @type {(variable: estree.Variable) => MissingBinding}
 */
export const makeMissingBinding = (variable) => ({
  type: "root",
  kind: "missing",
  variable,
});

/**
 * @type {{[k in estree.VariableKind]: "var" | "let" | "const"}}
 */
const KINDS = {
  import: "const",
  var: "var",
  function: "var",
  let: "let",
  class: "let",
  const: "const",
};

/**
 * @type {(
 *   kind: estree.VariableKind,
 *   variable: estree.Variable,
 *   frame: Frame,
 * ) => PresentBinding}
 */
const makeActuallyPresentBinding = (kind, variable, frame) => {
  if (frame.root) {
    return { type: "root", kind: KINDS[kind], variable };
  } else {
    if (frame.link !== null && hasOwn(frame.link.import, variable)) {
      return {
        type: "import",
        variable,
        ...frame.link.import[variable],
      };
    } else {
      return {
        type: "regular",
        exports:
          frame.link !== null && hasOwn(frame.link.export, variable)
            ? frame.link.export[variable]
            : [],
        kind: KINDS[kind],
        variable,
      };
    }
  }
};

/**
 * @type {(
 *   context: {},
 *   frame: Frame,
 * ) => PresentBinding[]}
 */
export const listFrameBinding = (_context, frame) =>
  map(
    /** @type {[estree.Variable, estree.VariableKind][]} */ (
      listEntry(frame.kinds)
    ),
    ([variable, kind]) => makeActuallyPresentBinding(kind, variable, frame),
  );

/**
 * @type {(
 *   context: {},
 *   frame: Frame,
 *   variable: estree.Variable,
 * ) => PresentBinding | null}
 */
export const makePresentBinding = (_context, frame, variable) => {
  if (hasOwn(frame.kinds, variable)) {
    return makeActuallyPresentBinding(frame.kinds[variable], variable, frame);
  } else {
    return null;
  }
};

//   switch (frame.type) {
//     case "program": {
//       switch (context.root.kind) {
//         case "script": {
//           return { type: "root", kind };
//         }
//         case "module": {
//           if (hasOwn(frame.import, variable)) {
//             return {
//               type: "import",
//               ...frame.import[variable],
//             };
//           } else {
//             return {
//               type: "regular",
//               kind,
//               internalized: false,
//               exports: hasOwn(frame.export, variable)
//                 ? frame.export[variable]
//                 : [],
//             };
//           }
//         }
//         case "eval": {
//           if (context.mode === "strict" || kind !== "var") {
//             return {
//               type: "regular",
//               kind,
//               internalized: false,
//               exports: [],
//             };
//           } else if (
//             context.root.situ === "global" &&
//             context.root.plug === "reify"
//           ) {
//             return { type: "root", kind };
//           } else {
//             return {
//               type: "regular",
//               kind,
//               internalized: true,
//               exports: [],
//             };
//           }
//         }
//         default: {
//           throw new AranTypeError("invalid context.root", context.root);
//         }
//       }
//     }
//     case "closure": {
//       return {
//         type: "regular",
//         kind,
//         internalized: false,
//         exports: [],
//       };
//     }
//     case "block": {
//       return {
//         type: "regular",
//         kind,
//         internalized: false,
//         exports: [],
//       };
//     }
//     default: {
//       throw new AranTypeError("invalid frame", frame);
//     }
//   }
// };
