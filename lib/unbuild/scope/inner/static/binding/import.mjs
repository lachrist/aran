import { AranError } from "../../../../../error.mjs";
import { makeUnaryExpression } from "../../../../intrinsic.mjs";
import {
  makeExpressionEffect,
  makeImportExpression,
  makePrimitiveExpression,
} from "../../../../node.mjs";
import { makeThrowConstantExpression } from "../../error.mjs";

/**
 * @typedef {import("./binding.d.ts").ImportBinding} ImportBinding
 */

/**
 * @type {(
 *   context: {},
 *   binding: ImportBinding,
 * ) => unbuild.Variable[]}
 */
export const listImportBindingVariable = (_context, _binding) => [];

/**
 * @type {(
 *   context: {},
 *   binding: ImportBinding,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listImportBindingDeclareStatement = (
  _context,
  _binding,
  _path,
) => [];

/**
 * @type {(
 *   context: {},
 *   binding: ImportBinding,
 *   right: aran.Expression<unbuild.Atom> | null,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listImportBindingInitializeEffect = (
  _context,
  binding,
  _expression,
  _path,
) => {
  throw new AranError("import variable should not be initialized", binding);
};

/**
 * @type {(
 *   context: {},
 *   binding: ImportBinding,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeImportBindingReadExpression = (
  _context,
  { source, specifier },
  path,
) => makeImportExpression(source, specifier, path);

/**
 * @type {(
 *   context: {},
 *   binding: ImportBinding,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeImportBindingTypeofExpression = (
  _context,
  { source, specifier },
  path,
) =>
  makeUnaryExpression(
    "typeof",
    makeImportExpression(source, specifier, path),
    path,
  );

/**
 * @type {(
 *   context: {},
 *   binding: ImportBinding,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeImportBindingDiscardExpression = (_context, _binding, path) =>
  makePrimitiveExpression(false, path);

/**
 * @type {(
 *   context: {},
 *   binding: ImportBinding,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listImportBindingWriteEffect = (
  _context,
  { variable },
  right,
  path,
) => [
  makeExpressionEffect(right, path),
  makeExpressionEffect(makeThrowConstantExpression(variable, path), path),
];
