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
 *   link: null | {
 *     import: Record<estree.Variable, {
 *       source: estree.Source;
 *       specifier: estree.Specifier | null;
 *     }>,
 *     export: Record<estree.Variable, estree.Specifier[]>,
 *   },
 *   kinds: Record<estree.Variable, estree.VariableKind>,
 * }} Frame
 */

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
 *   root: boolean,
 *   frame: Frame,
 * ) => PresentBinding}
 */
const makeActuallyPresentBinding = (kind, variable, root, frame) => {
  if (root) {
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
 *   root: boolean,
 *   frame: Frame,
 * ) => PresentBinding[]}
 */
export const listFrameBinding = (_context, root, frame) =>
  map(
    /** @type {[estree.Variable, estree.VariableKind][]} */ (
      listEntry(frame.kinds)
    ),
    ([variable, kind]) =>
      makeActuallyPresentBinding(kind, variable, root, frame),
  );

/**
 * @type {(
 *   context: {},
 *   root: boolean,
 *   frame: Frame,
 *   variable: estree.Variable,
 * ) => PresentBinding | null}
 */
export const makePresentBinding = (_context, root, frame, variable) => {
  if (hasOwn(frame.kinds, variable)) {
    return makeActuallyPresentBinding(
      frame.kinds[variable],
      variable,
      root,
      frame,
    );
  } else {
    return null;
  }
};
