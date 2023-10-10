import { makeUnaryExpression } from "../../../intrinsic.mjs";
import {
  makeExpressionEffect,
  makeImportExpression,
  makePrimitiveExpression,
} from "../../../node.mjs";
import { makeThrowConstantExpression } from "../error.mjs";

const { Error } = globalThis;

/**
 * @typedef {{
 *   source: estree.Source,
 *   specifier: estree.Specifier | null,
 * }} Binding
 */

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 * ) => unbuild.Variable[]}
 */
export const listImportBindingVariable = (_strict, _binding, _variable) => [];

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listImportBindingDeclareStatement = (
  _strict,
  _binding,
  _variable,
) => [];

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listImportBindingInitializeStatement = (
  _strict,
  _binding,
  _variable,
  _expression,
) => {
  throw new Error("import variable cannot be initialized");
};

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeImportBindingReadExpression = (
  _strict,
  { source, specifier },
  _variable,
) => makeImportExpression(source, specifier);

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeImportBindingTypeofExpression = (
  _strict,
  { source, specifier },
  _variable,
) => makeUnaryExpression("typeof", makeImportExpression(source, specifier));

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeImportBindingDiscardExpression = (
  _strict,
  _binding,
  _variable,
) => makePrimitiveExpression(false);

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listImportBindingWriteEffect = (
  _strict,
  _binding,
  variable,
  _right,
) => [makeExpressionEffect(makeThrowConstantExpression(variable))];
