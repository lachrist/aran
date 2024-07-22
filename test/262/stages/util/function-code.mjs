const { String } = globalThis;

/**
 * @type {(
 *   args: unknown[],
 * ) => string}
 */
export const compileFunctionCode = (args) =>
  `(function anonymous(${args.slice(0, -1).map(String).join(",")}\n) {\n${
    args[args.length - 1]
  }\n});`;
