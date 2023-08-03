import { hasOwn } from "../../../util/index.mjs";

import * as ExternalBinding from "./external.mjs";
import * as GlobalBinding from "./global.mjs";
import * as HiddenBinding from "./hidden.mjs";
import * as ImportBinding from "./import.mjs";
import * as MissingBinding from "./missing.mjs";
import * as RegularBinding from "./regular.mjs";

const { Error } = globalThis;

const Binding = {
  external: ExternalBinding,
  global: GlobalBinding,
  hidden: HiddenBinding,
  import: ImportBinding,
  missing: MissingBinding,
  regular: RegularBinding,
};

/**
 * @template T
 * @type {listBindingVariable<Binding, T>}
 */
export const listBindingVariable = (strict, binding, variable) => {
  if (hasOwn(Binding, binding.type)) {
    // @ts-expect-error
    const { listBindingVariable: method } = Binding[binding.type];
    return method(strict, binding, variable);
  } else {
    return [];
  }
};

/**
 * @template T
 * @type {listBindingDeclareStatement<Binding, T>}
 */
export const listBindingDeclareStatement = (strict, binding, variable) => {
  if (hasOwn(Binding, binding.type)) {
    // @ts-expect-error
    const { listBindingDeclareStatement: method } = Binding[binding.type];
    return method(strict, binding, variable);
  } else {
    return [];
  }
};

/**
 * @template T
 * @type {listBindingInitializeStatement<Binding, T>}
 */
export const listBindingInitializeStatement = (
  strict,
  binding,
  variable,
  expression,
) => {
  if (hasOwn(Binding, binding.type)) {
    // @ts-expect-error
    const { listBindingInitializeStatement: method } = Binding[binding.type];
    return method(strict, binding, variable, expression);
  } else {
    return [];
  }
};

/**
 * @template T
 * @type {makeBindingLookupNode<Binding, T>}
 */
export const makeBindingLookupNode = (
  strict,
  binding,
  variable,
  escaped,
  lookup,
) => {
  if (hasOwn(Binding, binding.type)) {
    // @ts-expect-error
    const { makeBindingLookupNode: method } = Binding[binding.type];
    return method(strict, binding, variable, escaped, lookup);
  } else {
    throw new Error("missing makeBindingLookupNode implementation");
  }
};
