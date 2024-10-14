import { AranTypeError } from "../error.mjs";

/**
 * @type {(
 *   value: import("estree-sentry").SourceValue,
 * ) => import("estree-sentry").SourceLiteral<{}>}
 */
export const makeSourceLiteral = (value) => ({
  type: "Literal",
  value,
  raw: null,
  bigint: null,
  regex: null,
});

/**
 * @type {(
 *   specifier: import("estree-sentry").SpecifierValue,
 * ) => import("estree-sentry").SpecifierLiteral<{}>}
 */
export const makeSpecifierLiteral = (specifier) => ({
  type: "Literal",
  value: specifier,
  raw: null,
  bigint: null,
  regex: null,
});

/**
 * @type {(
 *   key: string,
 * ) => import("estree-sentry").PublicKeyLiteral<{}>}
 */
export const makePublicKeyLiteral = (value) => ({
  type: "Literal",
  // eslint-disable-next-line object-shorthand
  value: /** @type {import("estree-sentry").PublicKeyValue} */ (value),
  raw: null,
  bigint: null,
  regex: null,
});

/**
 * @type {(
 *   bigint: string,
 * ) => import("estree-sentry").Literal<{}>}
 */
export const makeBigIntLiteral = (bigint) => ({
  type: "Literal",
  value: null,
  raw: null,
  // eslint-disable-next-line object-shorthand
  bigint: /** @type {import("estree-sentry").BigIntRepresentation} */ (bigint),
  regex: null,
});

/**
 * @type {(
 *   value: null | boolean | number | string,
 * ) => import("estree-sentry").Literal<{}>}
 */
export const makeSimpleLiteral = (value) => {
  if (value === null) {
    return {
      type: "Literal",
      value: null,
      raw: null,
      bigint: null,
      regex: null,
    };
  } else if (typeof value === "boolean") {
    return {
      type: "Literal",
      value,
      raw: null,
      bigint: null,
      regex: null,
    };
  } else if (typeof value === "number") {
    return {
      type: "Literal",
      value,
      raw: null,
      bigint: null,
      regex: null,
    };
  } else if (typeof value === "string") {
    return {
      type: "Literal",
      // eslint-disable-next-line object-shorthand
      value: /** @type {import("estree-sentry").StringValue} */ (value),
      raw: null,
      bigint: null,
      regex: null,
    };
  } else {
    throw new AranTypeError(value);
  }
};
