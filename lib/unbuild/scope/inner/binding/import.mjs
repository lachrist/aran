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
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const listImportBindingDeclareStatement = (
  _strict,
  _binding,
  _variable,
  _serial,
) => [];

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const listImportBindingInitializeStatement = (
  _strict,
  _binding,
  _variable,
  _expression,
  _serial,
) => {
  throw new Error("import variable cannot be initialized");
};

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeImportBindingReadExpression = (
  _strict,
  { source, specifier },
  _variable,
  serial,
) => makeImportExpression(source, specifier, serial);

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeImportBindingTypeofExpression = (
  _strict,
  { source, specifier },
  _variable,
  serial,
) =>
  makeUnaryExpression(
    "typeof",
    makeImportExpression(source, specifier, serial),
    serial,
  );

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeImportBindingDiscardExpression = (
  _strict,
  _binding,
  _variable,
  serial,
) => makePrimitiveExpression(false, serial);

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   serial: S,
 * ) => aran.Effect<unbuild.Atom<S>>[]}
 */
export const listImportBindingWriteEffect = (
  _strict,
  _binding,
  variable,
  _right,
  serial,
) => [
  makeExpressionEffect(makeThrowConstantExpression(variable, serial), serial),
];
