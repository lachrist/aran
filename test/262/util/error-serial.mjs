import { show } from "./pure.mjs";

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

export const MISSING_ERROR_MESSAGE = "[missing]";

/**
 * @type {(error: unknown) => string}
 */
export const inspectErrorMessage = (error) => {
  try {
    return show(/** @type {Error} */ (error).message);
  } catch {
    return MISSING_ERROR_MESSAGE;
  }
};

/**
 * @type {(error: unknown) => string | null}
 */
export const inspectErrorStack = (error) => {
  try {
    const { stack } = /** @type {Error} */ (error);
    return stack == null ? null : show(stack);
  } catch {
    return null;
  }
};

/**
 * @type {(
 *   error: unknown,
 * ) => import("./error-serial").ErrorSerial}
 */
export const serializeError = (error) => ({
  name: inspectErrorName(error),
  message: inspectErrorMessage(error),
  stack: inspectErrorStack(error),
});
