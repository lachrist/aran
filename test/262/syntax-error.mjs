import { inspectErrorMessage, inspectErrorName } from "./error-serial.mjs";
import { AranTestError } from "./error.mjs";

/**
 * @type {(
 *   name: string,
 * ) => boolean}
 */
const isSyntaxErrorName = (name) =>
  name === "SyntaxError" || name === "AranSyntaxError";

/**
 * @type {(
 *   error: unknown,
 *   SyntaxError: new (message: string) => unknown,
 * ) => unknown}
 */
export const harmonizeSyntaxError = (error, SyntaxError) =>
  isSyntaxErrorName(inspectErrorName(error))
    ? new SyntaxError(inspectErrorMessage(error))
    : new AranTestError(error);
