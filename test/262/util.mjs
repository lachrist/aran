const { Error, String, Map, undefined } = globalThis;

/** @type {(value: unknown) => string} */
export const show = (value) => {
  if (typeof value === "object" && value !== null) {
    return "[object]";
  } else if (typeof value === "function") {
    return "[function]";
  } else {
    return String(value);
  }
};

/**
 * @type {(error: unknown) => string}
 */
export const inspectErrorName = (error) => {
  try {
    return show(/** @type {Error} */ (error).constructor.name);
  } catch {
    return "[missing]";
  }
};

/**
 * @type {(error: unknown) => string}
 */
export const inspectErrorMessage = (error) => {
  try {
    return show(/** @type {Error} */ (error).message);
  } catch {
    return "[missing]";
  }
};

/**
 * @type {(error: unknown) => { stack: string} | {}}
 */
export const inspectErrorStack = (error) => {
  try {
    const { stack } = /** @type {Error} */ (error);
    return stack == null ? {} : { stack: show(stack) };
  } catch {
    return {};
  }
};

/**
 * @type {(error: unknown) => {
 *   name: string,
 *   message: string,
 *   stack?: string,
 * }}
 */
export const inspectError = (error) => ({
  name: inspectErrorName(error),
  message: inspectErrorMessage(error),
  ...inspectErrorStack(error),
});

/**
 * @type {<X>(
 *   value: X | null
 * ) => X}
 */
export const fromNullable = (value) => {
  if (value === null) {
    throw new Error("unexpected null");
  } else {
    return value;
  }
};

/**
 * @template X
 * @template Y
 * @param {Map<X, Y[]>} map
 * @return {Map<Y, X[]>}
 */
export const inverse = (map) => {
  /** @type {Map<Y, X[]>} */
  const inverse = new Map();
  for (const [key, values] of map.entries()) {
    for (const value of values) {
      const keys = inverse.get(value);
      if (keys === undefined) {
        inverse.set(value, [key]);
      } else {
        keys.push(key);
      }
    }
  }
  return inverse;
};
