import {
  listDeclareEnclaveStatement,
  listInitializeEnclaveStatement,
  listWriteEnclaveEffect,
  makeDidscardEnclaveExpression,
  makeReadEnclaveExpression,
  makeTypeofEnclaveExpression,
} from "../../../param/index.mjs";

/**
 * @type {(
 *   context: {},
 *   binding: import("./binding.d.ts").EnclaveBinding & {
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
 *     root: {
 *       situ: "global" | "local",
 *     },
 *   },
 *   binding: import("./binding.d.ts").EnclaveBinding & {
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
) => listDeclareEnclaveStatement(context, kind, variable, { path });

/**
 * @type {(
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *   },
 *   binding: import("./binding.d.ts").EnclaveBinding & {
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
) => listInitializeEnclaveStatement(context, kind, variable, right, { path });

/**
 * @type {(
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *   },
 *   binding: import("./binding.d.ts").EnclaveBinding,
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
 *     root: {
 *       situ: "global" | "local",
 *     },
 *   },
 *   binding: import("./binding.d.ts").EnclaveBinding,
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
 *     root: {
 *       situ: "global" | "local",
 *     },
 *   },
 *   binding: import("./binding.d.ts").EnclaveBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEnclaveBindingDiscardExpression = (
  context,
  _binding,
  variable,
  path,
) => makeDidscardEnclaveExpression(context, variable, { path });

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: {
 *       situ: "global" | "local",
 *     },
 *   },
 *   binding: import("./binding.d.ts").EnclaveBinding,
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
