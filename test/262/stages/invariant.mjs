/* eslint-disable local/no-deep-import */

import {
  DUMMY_BASIC_MEMBRANE,
  instrument,
  setupAranBasic,
  setupStandardAdvice,
} from "../aran/index.mjs";
import { makeInvariantAdvice } from "../../aspects/invariant.mjs";

const {
  Object: { hasOwn },
  console: { log, dir },
} = globalThis;

/* eslint-disable */
/**
 * @type {(
 *   report: import("../report").Report,
 * ) => new (context: object) => Error}
 */
const compileAssertionError = (report) => {
  let logged = false;
  return /** @type {any} */ (
    function (/** @type {unknown} */ context) {
      if (!logged) {
        logged = true;
        log("AranAssertionError");
        dir(context);
      }
      return report("AranAssertionError", "assertion failure");
    }
  );
};
/* eslint-enable */

/* eslint-disable */
/**
 * @type {(
 *   report: import("../report").Report,
 * ) => new (data: never) => Error}
 */
const compileUnreachableError = (report) =>
  /** @type {any} */ (
    function (/** @type {unknown} */ data) {
      log("AranUnreachableError");
      dir(data, { depth: 3, showHidden: true });
      return report("AranUnreachableError", "this should never happen");
    }
  );
/* eslint-enable */

/* eslint-disable local/no-function */
const DUMMY_ADVICE = makeInvariantAdvice(
  /** @type {any} */ ({
    AssertionError() {},
    UnreachableError() {},
  }),
  DUMMY_BASIC_MEMBRANE,
);
/* eslint-enable local/no-function */

/**
 * @type {import("../aran/config").Config}
 */
const config = {
  selection: ["main", "local"],
  global_declarative_record: "builtin",
  initial_state: null,
  standard_pointcut: (kind) => hasOwn(DUMMY_ADVICE, kind),
  flexible_pointcut: null,
};

/** @type {import("../stage").Stage} */
export default {
  precursor: ["identity", "parsing", "bare-basic-standard"],
  negative: [],
  exclude: ["slow"],
  listLateNegative: (_target, _metadata, _error) => [],
  setup: (context) => {
    setupStandardAdvice(
      context,
      makeInvariantAdvice(
        {
          AssertionError: compileAssertionError(context.report),
          UnreachableError: compileUnreachableError(context.report),
        },
        setupAranBasic(context),
      ),
    );
  },
  instrument: (source) => instrument(source, config),
};
