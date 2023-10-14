const { JSON } = globalThis;

/**
 * @type {(result: test262.Result) => string}
 */
export const stringifyResult = (result) =>
  JSON.stringify([result.relative, result.features, result.errors]);

/**
 * @type {(line: string) => test262.Result}
 */
export const parseResult = (line) => {
  const [relative, features, errors] = JSON.parse(line);
  return { relative, features, errors };
};

/**
 * @type {(result: test262.Result) => string}
 */
export const getRelative = ({ relative }) => relative;

/**
 * @type {(result: test262.Result) => string[]}
 */
export const listFeature = ({ features }) => features;

/** @type {(result: test262.Result) => result is test262.Failure} */
export const isFailure = (result) => result.errors.length > 0;

/** @type {(line: string) => boolean} */
const isNotEmpty = (line) => line !== "";

/** @type {(dump: string) => test262.Result[]} */
export const parseResultDump = (dump) =>
  dump.split("\n").filter(isNotEmpty).map(parseResult);
