const { undefined } = globalThis;

/**
 * @type {(
 *   type: "harness" | "parse" | "resolution" | "runtime",
 *   error: unknown,
 * ) => test262.Error}
 */
export const inspectError = (type, error) => {
  if (typeof error !== "object" || error === null) {
    return {
      type: "inspect",
      message: `invalid error type: ${typeof error}`,
    };
  }
  /** @type {unknown} */
  let name = undefined;
  /** @type {unknown} */
  let message = undefined;
  /** @type {unknown} */
  let stack = undefined;
  try {
    name = /** @type {Error} */ (error).constructor.name;
    message = /** @type {Error} */ (error).message;
    stack = /** @type {Error} */ (error).stack;
  } catch {
    return {
      type: "inspect",
      message: "failed to read error.name or error.message",
    };
  }
  if (typeof name !== "string") {
    return {
      type: "inspect",
      message: `invalid error.name type: ${typeof name}`,
    };
  }
  if (typeof message !== "string") {
    console.dir(new Error("YOO"));
    console.dir(error);
    return {
      type: "inspect",
      message: `invalid error.message type: ${typeof message}`,
    };
  }
  if (typeof stack !== "string") {
    return { type, name, message };
  } else {
    return { type, name, message, stack };
  }
};

/**
 * @type {(
 *   message: unknown,
 * ) => test262.Outcome<string, test262.Error>}
 */
export const inspectMessage = (message) => {
  if (typeof message === "string") {
    return {
      type: "success",
      value: message,
    };
  } else {
    return {
      type: "failure",
      error: {
        type: "inspect",
        message: `invalid message type: ${typeof message}`,
      },
    };
  }
};
