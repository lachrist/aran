/**
 * @type {(
 *   value: unknown,
 * ) => value is import("linvail").StandardPrimitive}
 */
export const isStandardPrimitive = (value) =>
  value == null ||
  typeof value === "boolean" ||
  typeof value === "number" ||
  typeof value === "bigint" ||
  typeof value === "string";

/**
 * @type {(
 *   value: unknown,
 * ) => value is import("linvail").Primitive}
 */
export const isPrimitive = (value) =>
  value == null ||
  typeof value === "boolean" ||
  typeof value === "number" ||
  typeof value === "bigint" ||
  typeof value === "string" ||
  typeof value === "symbol";
