import { hasOwn } from "../util/object.mjs";

const { Error } = globalThis;

/** @type {{[key in __location]: __unique}} */
const registery = {
  // @ts-ignore
  "__proto__": null,
  "lib/unbuild/visitors/callee.mjs": /** @type {__unique} */ ("callee"),
  "lib/unbuild/visitors/class.mjs": /** @type {__unique} */ ("class"),
  "lib/unbuild/visitors/declarator.mjs": /** @type {__unique} */ ("declarator"),
  "lib/unbuild/visitors/effect.mjs": /** @type {__unique} */ ("effect"),
  "lib/unbuild/visitors/expression.mjs": /** @type {__unique} */ ("expression"),
  "lib/unbuild/visitors/function.mjs": /** @type {__unique} */ ("function"),
  "lib/unbuild/visitors/hoisted.mjs": /** @type {__unique} */ ("hoisted"),
  "lib/unbuild/visitors/pattern.mjs": /** @type {__unique} */ ("pattern"),
  "lib/unbuild/visitors/program.mjs": /** @type {__unique} */ ("program"),
  "lib/unbuild/visitors/property.mjs": /** @type {__unique} */ ("property"),
  "lib/unbuild/visitors/statement.mjs": /** @type {__unique} */ ("statement"),
  "lib/unbuild/visitors/update.mjs": /** @type {__unique} */ ("update"),
};

/**
 * @type {(location: __location) => string}
 */
export const shortenLocation = (location) => {
  if (hasOwn(registery, location)) {
    return registery[location];
  } else {
    throw new Error("missing location");
  }
};
