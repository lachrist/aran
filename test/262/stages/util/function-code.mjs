const { String } = globalThis;

/**
 * @type {(
 *   args: unknown[],
 * ) => string}
 */
export const compileFunctionCode = (args) => {
  if (args.length === 0) {
    return "(function anonymous(\n) {\n\n});";
  } else {
    return `(function anonymous(\n${args
      .slice(0, -1)
      .map(String)
      .join(",")}\n) {\n${args[args.length - 1]}\n});`;
  }
};
