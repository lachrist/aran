import { stderr } from "node:process";
import { inspectErrorMessage, inspectErrorName } from "../util/index.mjs";

/**
 * @type {(
 *   error: unknown,
 * ) => void}
 */
export const onUncaughtException = (error) => {
  stderr.write(
    `uncaught >> ${inspectErrorName(error)} >> ${inspectErrorMessage(error)}\n`,
  );
};
