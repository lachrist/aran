import { AranExecError } from "./error.mjs";

const {
  Error,
  Object: { hasOwn, entries: listEntry, fromEntries: reduceEntry },
  JSON: { stringify },
} = globalThis;

/**
 * @type {(
 *   argv: string[],
 * ) => { [key in string]?: string } }
 */
export const parseArgv = (argv) => {
  const { length } = argv;
  if (length % 2 !== 0) {
    throw new Error("Expected an even number of arguments");
  } else {
    const entries = [];
    for (let index = 0; index < length; index += 2) {
      const key = argv[index];
      const val = argv[index + 1];
      if (key[0] === "-" && key[1] === "-") {
        entries.push([key.substring(2), val]);
      } else {
        throw new AranExecError(`Invalid key ${stringify(key)}`);
      }
    }
    return reduceEntry(entries);
  }
};

/**
 * @type {(
 *   entry: [string, string],
 * ) => string}
 */
const printEntry = ([key, val]) => `--${key}=${val}`;

/**
 * @type {(
 *   options: { [key in string]?: string },
 * ) => string}
 */
export const toBasename = (options) =>
  /** @type {[string, string][]} */ (listEntry(options))
    .map(printEntry)
    .join("");

/**
 * @type {<X extends string>(
 *   record: { [key in string]?: string },
 *   key: string,
 *   values: X[],
 * ) => X}
 */
export const sanitizeMember = (record, key, values) => {
  if (hasOwn(record, key)) {
    const value = record[key];
    if (values.includes(/** @type {any} */ (value))) {
      return /** @type {any} */ (value);
    } else {
      throw new AranExecError(
        `${stringify(value)} is not one of ${stringify(values)}`,
      );
    }
  } else {
    throw new AranExecError(
      `${stringify(key)} is missing from ${stringify(record)}`,
    );
  }
};
