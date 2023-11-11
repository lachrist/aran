import { map } from "../../../../util/index.mjs";
import {
  makeEffectStatement,
  makePrimitiveExpression,
} from "../../../node.mjs";
import {
  listDeclareEnclaveStatement,
  listWriteEnclaveEffect,
  makeDiscardEnclaveExpression,
  makeReadEnclaveExpression,
  makeTypeofEnclaveExpression,
} from "../../../param/index.mjs";

/**
 * @type {(
 *   context: {},
 *   binding: import("./binding.d.ts").RootBinding & {
 *     kind: "let" | "const" | "var",
 *   },
 *   variable: estree.Variable,
 * ) => unbuild.Variable[]}
 */
export const listEnclaveBindingVariable = (_context, _binding, _variable) => [];

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../../../context.d.ts").AlienGlobalRoot,
 *   },
 *   binding: import("./binding.d.ts").RootBinding & {
 *     kind: "let" | "const" | "var",
 *   },
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listEnclaveBindingDeclareStatement = (
  context,
  { kind },
  variable,
  path,
) =>
  kind === "var"
    ? listDeclareEnclaveStatement(
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
 *     root: import("../../../context.d.ts").AlienGlobalRoot,
 *   },
 *   binding: import("./binding.d.ts").RootBinding & {
 *     kind: "let" | "const" | "var",
 *   },
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listEnclaveBindingInitializeStatement = (
  context,
  { kind },
  variable,
  right,
  path,
) =>
  kind === "var"
    ? map(listWriteEnclaveEffect(context, variable, right, { path }), (node) =>
        makeEffectStatement(node, path),
      )
    : listDeclareEnclaveStatement(context, kind, variable, right, { path });

/**
 * @type {(
 *   context: {
 *     root: import("../../../context.d.ts").AlienRoot,
 *   },
 *   binding: import("./binding.d.ts").RootBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEnclaveBindingReadExpression = (
  context,
  _binding,
  variable,
  path,
) => makeReadEnclaveExpression(context, variable, { path });

/**
 * @type {(
 *   context: {
 *     root: import("../../../context.d.ts").AlienRoot,
 *   },
 *   binding: import("./binding.d.ts").RootBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEnclaveBindingTypeofExpression = (
  context,
  _binding,
  variable,
  path,
) => makeTypeofEnclaveExpression(context, variable, { path });

/**
 * @type {(
 *   context: {
 *     root: import("../../../context.d.ts").AlienRoot,
 *   },
 *   binding: import("./binding.d.ts").RootBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEnclaveBindingDiscardExpression = (
  context,
  _binding,
  variable,
  path,
) => makeDiscardEnclaveExpression(context, variable, { path });

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../../../context.d.ts").AlienRoot,
 *   },
 *   binding: import("./binding.d.ts").RootBinding,
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listEnclaveBindingWriteEffect = (
  context,
  _binding,
  variable,
  right,
  path,
) => listWriteEnclaveEffect(context, variable, right, { path });
