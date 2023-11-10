import { makeUnaryExpression } from "../../../intrinsic.mjs";
import {
  makeExpressionEffect,
  makeImportExpression,
  makePrimitiveExpression,
} from "../../../node.mjs";
import { makeThrowConstantExpression } from "../error.mjs";

const { Error } = globalThis;

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   binding: import("./binding.d.ts").ImportBinding,
 *   variable: estree.Variable,
 * ) => unbuild.Variable[]}
 */
export const listImportBindingVariable = (_strict, _binding, _variable) => [];

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   binding: import("./binding.d.ts").ImportBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listImportBindingDeclareStatement = (
  _strict,
  _binding,
  _variable,
  _path,
) => [];

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   binding: import("./binding.d.ts").ImportBinding,
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listImportBindingInitializeStatement = (
  _strict,
  _binding,
  _variable,
  _expression,
  _path,
) => {
  throw new Error("import variable cannot be initialized");
};

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   binding: import("./binding.d.ts").ImportBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeImportBindingReadExpression = (
  _strict,
  { source, specifier },
  _variable,
  path,
) => makeImportExpression(source, specifier, path);

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   binding: import("./binding.d.ts").ImportBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeImportBindingTypeofExpression = (
  _strict,
  { source, specifier },
  _variable,
  path,
) =>
  makeUnaryExpression(
    "typeof",
    makeImportExpression(source, specifier, path),
    path,
  );

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   binding: import("./binding.d.ts").ImportBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeImportBindingDiscardExpression = (
  _strict,
  _binding,
  _variable,
  path,
) => makePrimitiveExpression(false, path);

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   binding: import("./binding.d.ts").ImportBinding,
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listImportBindingWriteEffect = (
  _strict,
  _binding,
  variable,
  right,
  path,
) => [
  makeExpressionEffect(right, path),
  makeExpressionEffect(makeThrowConstantExpression(variable, path), path),
];
