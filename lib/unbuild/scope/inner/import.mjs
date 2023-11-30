import { AranError } from "../../../../../error.mjs";
import { makeUnaryExpression } from "../../../../intrinsic.mjs";
import {
  makeExpressionEffect,
  makeImportExpression,
  makePrimitiveExpression,
} from "../../../../node.mjs";
import { makeThrowConstantExpression } from "../../error.mjs";

/**
 * @typedef {(
 */

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     frame: ImportFrame
 *   binding: import("./binding.js").ImportBinding,
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeImportBindingReadExpression = (
  _context,
  { source, specifier },
  path,
) => makeImportExpression(source, specifier, path);

/**
 * @type {(
 *   context: {},
 *   binding: import("./binding.js").ImportBinding,
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
 *   binding: import("./binding.js").ImportBinding,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeImportBindingDiscardExpression = (_context, _binding, path) =>
  makePrimitiveExpression(false, path);

/**
 * @type {(
 *   context: {},
 *   binding: import("./binding.js").ImportBinding,
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
