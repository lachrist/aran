/**
 * @type {(result: test262.Result) => result is test262.Failure}
 */
export const isFailure = (result) => result.error !== null;

// const { JSON, Map, Array } = globalThis;

// /** @type {(error: test262.ErrorSerial) => test262.ErrorSerial} */
// export const removeStack = ({ name, message }) => ({ name, message });

// /**
//  * @type {(result: test262.Result) => string}
//  */
// export const stringifyResult = ({ target, features, trace, error }) =>
//   JSON.stringify([
//     target,
//     features,
//     trace,
//     error === null ? null : removeStack(error),
//   ]);

// /**
//  * @type {(line: string) => test262.Result}
//  */
// export const parseResult = (line) => {
//   const [target, features, trace, error] = JSON.parse(line);
//   return { target, features, trace, error };
// };

// /**
//  * @type {(result: test262.Result) => string}
//  */
// export const getTarget = ({ target }) => target;

// /**
//  * @type {(result: test262.Result) => string[]}
//  */
// export const listFeature = ({ features }) => features;

// /** @type {(result: test262.Result) => result is test262.Failure} */
// export const isFailure = (result) => result.error !== null;

// /** @type {(line: string) => boolean} */
// const isNotEmpty = (line) => line !== "";

// /** @type {(result: test262.Result) => [string, test262.Result]} */
// const toResultEntry = (result) => [result.target, result];

// /** @type {(dump: string) => test262.Result[]} */
// export const parseResultDump = (dump) => {
//   const results = dump.split("\n").filter(isNotEmpty).map(parseResult);
//   return Array.from(new Map(results.map(toResultEntry)).values());
// };

// /** @type {(dump: string) => string[]} */
// export const listDumpFailure = (dump) =>
//   parseResultDump(dump).filter(isFailure).map(getTarget);

// /** @type {(data: { name: string, message: string}) => string} */
// const printNameMessage = ({ name, message }) => `  ${name} >> ${message}`;

// /** @type {(result: test262.Result) => string} */
// export const printResult = ({ target, features, trace, error }) =>
//   [
//     `test262/${target}`,
//     ...(features.length === 0 ? [] : [`  ${features.join(", ")}}`]),
//     ...trace.map(printNameMessage),
//     ...(error === null ? [] : [printNameMessage(error)]),
//   ].join("\n");
