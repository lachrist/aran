import { AranTypeError } from "../report.mjs";

/**
 * @type {(
 *   source: import("estree-sentry").SourceValue,
 * ) => import("estree-sentry").SourceLiteral<{}>}
 */
export const makeSourceLiteral = (source) => ({
  type: "Literal",
  value: source,
  raw: null,
  bigint: null,
  regex: null,
});

/**
 * @type {(
 *   bigint: import("estree-sentry").BigIntRepresentation,
 * ) => import("estree-sentry").BigIntLiteral<{}>}
 */
export const makeBigIntLiteral = (bigint) => ({
  type: "Literal",
  value: null,
  raw: null,
  bigint,
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
 *   primitive: null | boolean | number | string,
 * ) => import("estree-sentry").SimpleLiteral<{}>}
 */
export const makeSimpleLiteral = (primitive) => {
  if (primitive === null) {
    return {
      type: "Literal",
      value: null,
      raw: null,
      bigint: null,
      regex: null,
    };
  } else if (typeof primitive === "boolean") {
    return {
      type: "Literal",
      value: primitive,
      raw: null,
      bigint: null,
      regex: null,
    };
  } else if (typeof primitive === "number") {
    return {
      type: "Literal",
      value: /** @type {import("estree-sentry").NumberValue} */ (primitive),
      raw: null,
      bigint: null,
      regex: null,
    };
  } else if (typeof primitive === "string") {
    return {
      type: "Literal",
      value: /** @type {import("estree-sentry").StringValue} */ (primitive),
      raw: null,
      bigint: null,
      regex: null,
    };
  } else {
    throw new AranTypeError(primitive);
  }
};
