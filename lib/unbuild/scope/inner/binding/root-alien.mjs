import { map } from "../../../../util/index.mjs";
import {
  makeEffectStatement,
  makePrimitiveExpression,
} from "../../../node.mjs";
import {
  listDeclareAlienStatement,
  listWriteAlienEffect,
  makeDiscardAlienExpression,
  makeReadAlienExpression,
  makeTypeofAlienExpression,
} from "../../../param/index.mjs";

/**
 * @type {(
 *   context: {},
 *   binding: import("./binding.js").RootBinding & {
 *     kind: "let" | "const" | "var",
 *   },
 *   variable: estree.Variable,
 * ) => unbuild.Variable[]}
 */
export const listAlienBindingVariable = (_context, _binding, _variable) => [];

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../../../context.js").AlienGlobalRoot,
 *   },
 *   binding: import("./binding.js").RootBinding & {
 *     kind: "let" | "const" | "var",
 *   },
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listAlienBindingDeclareStatement = (
  context,
  { kind },
  variable,
  path,
) =>
  kind === "var"
    ? listDeclareAlienStatement(
        context,
        "var",
        variable,
        makePrimitiveExpression({ undefined: null }, path),
        { path },
      )
    : [];

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../../../context.js").AlienGlobalRoot,
 *   },
 *   binding: import("./binding.js").RootBinding & {
 *     kind: "let" | "const" | "var",
 *   },
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listAlienBindingInitializeStatement = (
  context,
  { kind },
  variable,
  right,
  path,
) =>
  kind === "var"
    ? map(listWriteAlienEffect(context, variable, right, { path }), (node) =>
        makeEffectStatement(node, path),
      )
    : listDeclareAlienStatement(context, kind, variable, right, { path });

/**
 * @type {(
 *   context: {
 *     root: import("../../../context.js").AlienRoot,
 *   },
 *   binding: import("./binding.js").RootBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeAlienBindingReadExpression = (
  context,
  _binding,
  variable,
  path,
) => makeReadAlienExpression(context, variable, { path });

/**
 * @type {(
 *   context: {
 *     root: import("../../../context.js").AlienRoot,
 *   },
 *   binding: import("./binding.js").RootBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeAlienBindingTypeofExpression = (
  context,
  _binding,
  variable,
  path,
) => makeTypeofAlienExpression(context, variable, { path });

/**
 * @type {(
 *   context: {
 *     root: import("../../../context.js").AlienRoot,
 *   },
 *   binding: import("./binding.js").RootBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeAlienBindingDiscardExpression = (
  context,
  _binding,
  variable,
  path,
) => makeDiscardAlienExpression(context, variable, { path });

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../../../context.js").AlienRoot,
 *   },
 *   binding: import("./binding.js").RootBinding,
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listAlienBindingWriteEffect = (
  context,
  _binding,
  variable,
  right,
  path,
) => listWriteAlienEffect(context, variable, right, { path });
