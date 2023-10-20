/* eslint-disable no-empty */

const { String } = globalThis;

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
 * @type {(error: unknown) => test262.ErrorSerial}
 */
export const inspectError = (error) => ({
  name: inspectErrorName(error),
  message: inspectErrorMessage(error),
  ...inspectErrorStack(error),
});
