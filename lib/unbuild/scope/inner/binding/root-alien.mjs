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
 * ) => unbuild.Variable[]}
 */
export const listAlienBindingVariable = (_context, _binding) => [];

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: (
 *       & import("../../../program.js").RootProgram
 *       & import("../../../program.js").GlobalProgram
 *       & import("../../../program.js").AlienProgram
 *     ),
 *   },
 *   binding: import("./binding.js").RootBinding & {
 *     kind: "let" | "const" | "var",
 *   },
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listAlienBindingDeclareStatement = (
  context,
  { kind, variable },
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
 *     root: (
 *       & import("../../../program.js").RootProgram
 *       & import("../../../program.js").GlobalProgram
 *       & import("../../../program.js").AlienProgram
 *     ),
 *   },
 *   binding: import("./binding.js").RootBinding & {
 *     kind: "let" | "const" | "var",
 *   },
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listAlienBindingInitializeStatement = (
  context,
  { kind, variable },
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
 *     mode: "strict" | "sloppy",
 *     root: (
 *       & import("../../../program.js").RootProgram
 *       & import("../../../program.js").AlienProgram
 *     ),
 *   },
 *   binding: import("./binding.js").RootBinding,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeAlienBindingReadExpression = (context, { variable }, path) =>
  makeReadAlienExpression(context, variable, { path });

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: (
 *       & import("../../../program.js").RootProgram
 *       & import("../../../program.js").AlienProgram
 *     ),
 *   },
 *   binding: import("./binding.js").RootBinding,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeAlienBindingTypeofExpression = (context, { variable }, path) =>
  makeTypeofAlienExpression(context, variable, { path });

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: (
 *       & import("../../../program.js").RootProgram
 *       & import("../../../program.js").AlienProgram
 *     ),
 *   },
 *   binding: import("./binding.js").RootBinding,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeAlienBindingDiscardExpression = (
  context,
  { variable },
  path,
) => makeDiscardAlienExpression(context, variable, { path });

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: (
 *       & import("../../../program.js").RootProgram
 *       & import("../../../program.js").AlienProgram
 *     ),
 *   },
 *   binding: import("./binding.js").RootBinding,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listAlienBindingWriteEffect = (
  context,
  { variable },
  right,
  path,
) => listWriteAlienEffect(context, variable, right, { path });
