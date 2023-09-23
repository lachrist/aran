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
 * @type {<B extends Binding, T>(
 *   binding: B,
 * ) => import("./bindings/module.js").BindingModule<B, T>}
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
 * @type {<T>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   tag: T,
 * ) => aran.Statement<unbuild.Atom<T>>[]}
 */
export const listBindingDeclareStatement = (strict, binding, variable, tag) =>
  getBindingModule(binding).listBindingDeclareStatement(
    strict,
    binding,
    variable,
    tag,
  );

/**
 * @type {<T>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   expression: aran.Expression<unbuild.Atom<T>>,
 *   tag: T,
 * ) => aran.Statement<unbuild.Atom<T>>[]}
 */
export const listBindingInitializeStatement = (
  strict,
  binding,
  variable,
  expression,
  tag,
) =>
  getBindingModule(binding).listBindingInitializeStatement(
    strict,
    binding,
    variable,
    expression,
    tag,
  );

/**
 * @type {<T>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   tag: T,
 * ) => aran.Expression<unbuild.Atom<T>>}
 */
export const makeBindingReadExpression = (strict, binding, variable, tag) =>
  getBindingModule(binding).makeBindingReadExpression(
    strict,
    binding,
    variable,
    tag,
  );

/**
 * @type {<T>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   tag: T,
 * ) => aran.Expression<unbuild.Atom<T>>}
 */
export const makeBindingTypeofExpression = (strict, binding, variable, tag) =>
  getBindingModule(binding).makeBindingTypeofExpression(
    strict,
    binding,
    variable,
    tag,
  );

/**
 * @type {<T>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   tag: T,
 * ) => aran.Expression<unbuild.Atom<T>>}
 */
export const makeBindingDiscardExpression = (strict, binding, variable, tag) =>
  getBindingModule(binding).makeBindingDiscardExpression(
    strict,
    binding,
    variable,
    tag,
  );

/**
 * @type {<T>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   tag: T,
 * ) => aran.Effect<unbuild.Atom<T>>[]}
 */
export const listBindingWriteEffect = (strict, binding, variable, right, tag) =>
  getBindingModule(binding).listBindingWriteEffect(
    strict,
    binding,
    variable,
    right,
    tag,
  );