import { hasOwnJson } from "./json.mjs";
import { show } from "./util.mjs";

const {
  Object: { hasOwn },
  Array: { isArray },
} = globalThis;

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
 *   layer: "base" | "meta",
 *   error: unknown,
 * ) => import("./error-serial").ErrorSerial}
 */
export const serializeError = (layer, error) => ({
  layer,
  name: inspectErrorName(error),
  message: inspectErrorMessage(error),
  stack: inspectErrorStack(error),
});

/**
 * @type {(
 *   data: import("./json").Json,
 * ) => data is import("./error-serial").ErrorSerial}
 */
export const isErrorSerial = (data) =>
  typeof data === "object" &&
  data !== null &&
  !isArray(data) &&
  hasOwnJson(data, "layer") &&
  typeof data.layer === "string" &&
  hasOwnJson(data, "name") &&
  typeof data.name === "string" &&
  hasOwnJson(data, "message") &&
  typeof data.message === "string" &&
  hasOwnJson(data, "stack") &&
  (data.stack === null || typeof data.stack === "string");

/** @type {(error: import("./error-serial").ErrorSerial) => string} */
export const showErrorSerial = (error) =>
  hasOwn(error, "stack")
    ? /** @type {string} */ (error.stack)
    : `${error.name}: ${error.message}`;
