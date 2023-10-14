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
  try {
    name = /** @type {Error} */ (error).constructor.name;
    message = /** @type {Error} */ (error).message;
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
    return {
      type: "inspect",
      message: `invalid error.message type: ${typeof message}`,
    };
  }
  return { type, name, message };
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
