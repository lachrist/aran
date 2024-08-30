const {
  String,
  Array: { isArray },
  JSON: { stringify },
} = globalThis;

/**
 * @type {(anything: unknown) => string}
 */
export const print = (anything) => {
  if (typeof anything === "string") {
    return stringify(anything);
  }
  if (typeof anything === "function") {
    return "<function>";
  }
  if (typeof anything === "object" && anything !== null) {
    return isArray(anything) ? "<array>" : "<object>";
  }
  return String(anything);
};
