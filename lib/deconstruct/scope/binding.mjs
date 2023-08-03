/* eslint-disable no-restricted-syntax */

import ExternalBinding from "./bindings/external.mjs";
import GlobalBinding from "./bindings/global.mjs";
import HiddenBinding from "./bindings/hidden.mjs";
import ImportBinding from "./bindings/import.mjs";
import MissingBinding from "./bindings/missing.mjs";
import RegularBinding from "./bindings/regular.mjs";

const Bindings = {
  external: ExternalBinding,
  global: GlobalBinding,
  hidden: HiddenBinding,
  import: ImportBinding,
  missing: MissingBinding,
  regular: RegularBinding,
};

/**
 * @param {boolean} strict
 * @param {Binding} binding
 * @param {string} variable
 * @return {string[]}
 */
export const listBindingVariable = (strict, binding, variable) =>
  Bindings[binding.type].listBindingVariable(
    strict,
    /** @type {any} */ (binding),
    variable,
  );

/**
 * @template T
 * @param {boolean} strict
 * @param {Binding} binding
 * @param {string} variable
 * @return {Statement<T>[]}
 */
export const listBindingDeclareStatement = (strict, binding, variable) =>
  /** @type {Statement<T>[]} */ (
    Bindings[binding.type].listBindingDeclareStatement(
      strict,
      /** @type {any} */ (binding),
      variable,
    )
  );

/**
 * @template T
 * @param {boolean} strict
 * @param {Binding} binding
 * @param {string} variable
 * @param {Expression<T>} expression
 * @return {Statement<T>[]}
 */
export const listBindingInitializeStatement = (
  strict,
  binding,
  variable,
  expression,
) =>
  /** @type {Statement<T>[]} */ (
    Bindings[binding.type].listBindingInitializeStatement(
      strict,
      /** @type {any} */ (binding),
      variable,
      /** @type {any} */ (expression),
    )
  );

/**
 * @template T
 * @param {boolean} strict
 * @param {Binding} binding
 * @param {string} variable
 * @return {Expression<T>}
 */
export const makeBindingReadExpression = (strict, binding, variable) =>
  /** @type {Expression<T>} */ (
    Bindings[binding.type].makeBindingReadExpression(
      strict,
      /** @type {any} */ (binding),
      variable,
    )
  );

/**
 * @template T
 * @param {boolean} strict
 * @param {Binding} binding
 * @param {string} variable
 * @return {Expression<T>}
 */
export const makeBindingTypeofExpression = (strict, binding, variable) =>
  /** @type {Expression<T>} */ (
    Bindings[binding.type].makeBindingTypeofExpression(
      strict,
      /** @type {any} */ (binding),
      variable,
    )
  );

/**
 * @template T
 * @param {boolean} strict
 * @param {Binding} binding
 * @param {string} variable
 * @return {Expression<T>}
 */
export const makeBindingDiscardExpression = (strict, binding, variable) =>
  /** @type {Expression<T>} */ (
    Bindings[binding.type].makeBindingDiscardExpression(
      strict,
      /** @type {any} */ (binding),
      variable,
    )
  );

/**
 * @template T
 * @param {boolean} strict
 * @param {Binding} binding
 * @param {string} variable
 * @param {Expression<T>} pure
 * @return {Effect<T>[]}
 */
export const listBindingWriteEffect = (strict, binding, variable, pure) =>
  /** @type {Effect<T>[]} */ (
    Bindings[binding.type].listBindingWriteEffect(
      strict,
      /** @type {any} */ (binding),
      variable,
      /** @type {any} */ (pure),
    )
  );
