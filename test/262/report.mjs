import { inspect } from "node:util";
import { getResultStatus, toTestSpecifier } from "./result.mjs";
import { AranTypeError } from "./error.mjs";

const { Infinity } = globalThis;

/**
 * @type {(
 *   report: import("./report").TestReport,
 * ) => string}
 */
export const printReport = ({ index, test, result }) => {
  if (result.type === "include") {
    return [
      "",
      getResultStatus(result).toUpperCase(),
      "",
      `${index} >> test/262/test262/test/${test.path} >> @${test.directive}`,
      "",
      toTestSpecifier(test.path, test.directive),
      "",
      inspect(test, { depth: Infinity, colors: true }),
      inspect(result, { depth: Infinity, colors: true }),
    ].join("\n");
  } else if (result.type === "exclude") {
    return [
      `EXCLUDE >> ${result.reasons.join(" ")}`,
      `${index} >> test262/test/${test.path} >> @${test.directive}`,
      inspect(test, { depth: Infinity, colors: true }),
    ].join("\n");
  } else {
    throw new AranTypeError(result);
  }
};
