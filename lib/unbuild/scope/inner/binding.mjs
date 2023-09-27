/* eslint-disable no-restricted-syntax */

import ExternalBinding from "./bindings/external.mjs";
import GlobalBinding from "./bindings/global.mjs";
import HiddenBinding from "./bindings/hidden.mjs";
import ImportBinding from "./bindings/import.mjs";
import MissingBinding from "./bindings/missing.mjs";
import RegularBinding from "./bindings/regular.mjs";

/** @typedef {import("./bindings/binding.js").Binding} Binding */

const Bindings = {
  external: ExternalBinding,
  global: GlobalBinding,
  hidden: HiddenBinding,
  import: ImportBinding,
  missing: MissingBinding,
  regular: RegularBinding,
};

/**
 * @type {<B extends Binding, S>(
 *   binding: B,
 * ) => import("./bindings/module.js").BindingModule<B, S>}
 */
const getBindingModule = (binding) =>
  /** @type {any} */ (Bindings[binding.type]);

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 * ) => unbuild.Variable[]}
 */
export const listBindingVariable = (strict, binding, variable) =>
  getBindingModule(binding).listBindingVariable(strict, binding, variable);

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const listBindingDeclareStatement = (
  strict,
  binding,
  variable,
  serial,
) =>
  getBindingModule(binding).listBindingDeclareStatement(
    strict,
    binding,
    variable,
    serial,
  );

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   expression: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const listBindingInitializeStatement = (
  strict,
  binding,
  variable,
  expression,
  serial,
) =>
  getBindingModule(binding).listBindingInitializeStatement(
    strict,
    binding,
    variable,
    expression,
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
export const makeBindingReadExpression = (strict, binding, variable, serial) =>
  getBindingModule(binding).makeBindingReadExpression(
    strict,
    binding,
    variable,
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
export const makeBindingTypeofExpression = (
  strict,
  binding,
  variable,
  serial,
) =>
  getBindingModule(binding).makeBindingTypeofExpression(
    strict,
    binding,
    variable,
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
export const makeBindingDiscardExpression = (
  strict,
  binding,
  variable,
  serial,
) =>
  getBindingModule(binding).makeBindingDiscardExpression(
    strict,
    binding,
    variable,
    serial,
  );

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   serial: S,
 * ) => aran.Effect<unbuild.Atom<S>>[]}
 */
export const listBindingWriteEffect = (
  strict,
  binding,
  variable,
  right,
  serial,
) =>
  getBindingModule(binding).listBindingWriteEffect(
    strict,
    binding,
    variable,
    right,
    serial,
  );
