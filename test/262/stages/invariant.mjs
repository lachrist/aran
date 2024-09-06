/* eslint-disable local/no-deep-import */

import { setupAranBasic, setupStandardAdvice } from "../aran/index.mjs";
import { makeInvariantAdvice } from "../../aspects/invariant.mjs";

const {
  Object: { hasOwn },
  console: { log, dir },
} = globalThis;

/* eslint-disable */
/**
 * @type {(
 *   report: (error: Error) => void,
 *   logged: boolean,
 * ) => new (context: object) => Error}
 */
const compileAssertionError = (report, logged) =>
  class AssertionError extends Error {
    constructor(/** @type {object} */ context) {
      super();
      this.name = "AranAssertionError";
      if (!logged) {
        logged = true;
        log(this.name);
        dir(context);
      }
      report(this);
    }
  };
/* eslint-enable */

/* eslint-disable */
/**
 * @type {(
 *   report: (error: Error) => void,
 * ) => new (data: never) => Error}
 */
const compileUnreachableError = (report) =>
  class UnreachableError extends Error {
    constructor(/** @type {never} */ data) {
      super();
      this.name = "AranUnreachableError";
      log(this.name);
      dir(data, { depth: 3, showHidden: true });
      report(this);
    }
  };
/* eslint-enable */

/** @type {import("../stage").Stage} */
export default {
  precursor: ["identity", "parsing", "bare-basic-builtin-standard"],
  negative: [],
  exclude: ["slow"],
  listLateNegative: (_target, _metadata, _error) => [],
  compileInstrument: ({ report, record, warning, context }) => {
    const { instrumentRoot, instrumentDeep, intrinsics } = setupAranBasic({
      global_declarative_record: "builtin",
      initial_state: null,
      record,
      report,
      context,
      warning,
      // eslint-disable-next-line no-use-before-define
      standard_pointcut: (kind, _path) => hasOwn(advice, kind),
      flexible_pointcut: null,
    });
    const advice = makeInvariantAdvice(
      {
        AssertionError: compileAssertionError(report, false),
        UnreachableError: compileUnreachableError(report),
      },
      { intrinsics, instrumentDeep: (...args) => instrumentDeep(...args) },
    );
    setupStandardAdvice(context, advice);
    return instrumentRoot;
  },
};
