import { AranTypeError } from "../../../../error.mjs";
import { flatMap, hasOwn, listEntry, map } from "../../../../util/index.mjs";
import {
  listBindingVariable,
  listBindingDeclareStatement,
  listBindingInitializeEffect,
  makeBindingReadExpression,
  makeBindingTypeofExpression,
  makeBindingDiscardExpression,
  listBindingWriteEffect,
} from "./binding/index.mjs";

/**
 * @typedef {import("./index.d.ts").StaticFrame} StaticFrame
 */

/**
 * @typedef {import("./binding/index.mjs").Binding} Binding
 */

/**
 * @typedef {import("../../../program.js").RootProgram} RootProgram
 */

/**
 * @type {{[
 *   k in estree.VariableKind
 * ]: "var" | "let" | "const" | "callee"}}
 */
const KINDS = {
  import: "const",
  var: "var",
  function: "var",
  let: "let",
  class: "let",
  const: "const",
  callee: "callee",
};

/**
 * @type {(
 *   kind: estree.VariableKind,
 *   variable: estree.Variable,
 *   frame: StaticFrame,
 * ) => Binding}
 */
const makeBinding = (kind, variable, frame) => {
  switch (frame.situ) {
    case "local": {
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
    case "global": {
      const root_kind = KINDS[kind];
      return {
        type: "global",
        kind: root_kind === "callee" ? "const" : root_kind,
        variable,
      };
    }
    default: {
      throw new AranTypeError("invalid static frame", frame);
    }
  }
};

/**
 * @type {(
 *   frame: StaticFrame,
 * ) => Binding[]}
 */
export const listBinding = (frame) =>
  map(listEntry(frame.kinds), ([variable, kind]) =>
    makeBinding(kind, variable, frame),
  );

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: RootProgram,
 *   },
 *   frame: StaticFrame,
 * ) => unbuild.Variable[]}
 */
export const listStaticVariable = (context, frame) =>
  flatMap(listBinding(frame), (binding) =>
    listBindingVariable(context, binding),
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: RootProgram,
 *   },
 *   options: {
 *     frame: StaticFrame,
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listStaticDeclareStatement = ({ path }, context, { frame }) =>
  flatMap(listBinding(frame), (binding) =>
    listBindingDeclareStatement(context, binding, path),
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: RootProgram,
 *   },
 *   options: {
 *     frame: StaticFrame,
 *     variable: estree.Variable,
 *     right: aran.Expression<unbuild.Atom> | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[] | null}
 */
export const listStaticInitializeEffect = (
  { path },
  context,
  { frame, variable, right },
) => {
  if (hasOwn(frame.kinds, variable)) {
    const binding = makeBinding(frame.kinds[variable], variable, frame);
    return listBindingInitializeEffect(context, binding, right, path);
  } else {
    return null;
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: RootProgram,
 *   },
 *   options: {
 *     frame: StaticFrame,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeStaticReadExpression = (
  { path, meta },
  context,
  { frame, variable },
) => {
  if (hasOwn(frame.kinds, variable)) {
    const binding = makeBinding(frame.kinds[variable], variable, frame);
    return makeBindingReadExpression(context, binding, { path, meta });
  } else {
    return null;
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: RootProgram,
 *   },
 *   options: {
 *     frame: StaticFrame,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeStaticTypeofExpression = (
  { path },
  context,
  { frame, variable },
) => {
  if (hasOwn(frame.kinds, variable)) {
    const binding = makeBinding(frame.kinds[variable], variable, frame);
    return makeBindingTypeofExpression(context, binding, { path });
  } else {
    return null;
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: RootProgram,
 *   },
 *   options: {
 *     frame: StaticFrame,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeStaticDiscardExpression = (
  { path },
  context,
  { frame, variable },
) => {
  if (hasOwn(frame.kinds, variable)) {
    const binding = makeBinding(frame.kinds[variable], variable, frame);
    return makeBindingDiscardExpression(context, binding, { path });
  } else {
    return null;
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: RootProgram,
 *   },
 *   options: {
 *     frame: StaticFrame,
 *     variable: estree.Variable,
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Effect<unbuild.Atom>[] | null}
 */
export const listStaticWriteEffect = (
  { path, meta },
  context,
  { frame, variable, right },
) => {
  if (hasOwn(frame.kinds, variable)) {
    const binding = makeBinding(frame.kinds[variable], variable, frame);
    return listBindingWriteEffect(context, binding, right, { path, meta });
  } else {
    return null;
  }
};
