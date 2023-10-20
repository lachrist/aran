const { Object, JSON, Map, Array } = globalThis;

/** @type {(error: test262.Error) => test262.Error} */
export const removeStack = (error) => {
  if (Object.hasOwn(error, "stack")) {
    const { stack: _stack, ...rest } = /** @type {any} */ (error);
    return rest;
  } else {
    return error;
  }
};

/**
 * @type {(result: test262.Result) => string}
 */
export const stringifyResult = ({ target, features, errors }) =>
  JSON.stringify([target, features, errors.map(removeStack)]);

/**
 * @type {(line: string) => test262.Result}
 */
export const parseResult = (line) => {
  const [target, features, errors] = JSON.parse(line);
  return { target, features, errors };
};

/**
 * @type {(result: test262.Result) => string}
 */
export const getTarget = ({ target }) => target;

/**
 * @type {(result: test262.Result) => string[]}
 */
export const listFeature = ({ features }) => features;

/** @type {(result: test262.Result) => result is test262.Failure} */
export const isFailure = (result) => result.errors.length > 0;

/** @type {(line: string) => boolean} */
const isNotEmpty = (line) => line !== "";

/** @type {(result: test262.Result) => [string, test262.Result]} */
const toResultEntry = (result) => [result.target, result];

/** @type {(dump: string) => test262.Result[]} */
export const parseResultDump = (dump) => {
  const results = dump.split("\n").filter(isNotEmpty).map(parseResult);
  return Array.from(new Map(results.map(toResultEntry)).values());
};

/** @type {(dump: string) => string[]} */
export const listDumpFailure = (dump) =>
  parseResultDump(dump).filter(isFailure).map(getTarget);
