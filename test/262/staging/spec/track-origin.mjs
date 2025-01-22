/* eslint-disable local/no-deep-import */

import {
  DUMMY_BASIC_MEMBRANE,
  instrument,
  setupAranBasic,
  setupStandardAdvice,
} from "../aran/index.mjs";
import {
  pointcut,
  createTrackOriginAdvice,
} from "../../../aspects/track-origin.mjs";

const {
  Object: { hasOwn },
} = globalThis;

const ADVICE_VARIABLE = "__aran_advice__";

/**
 * @type {import("../../../../lib").StandardWeaveConfig}
 */
const config = {
  advice_global_variable,
  selection: ["main", "local"],
  global_declarative_record: "builtin",
  initial_state: {
    parent: null,
    frame: { __proto__: null },
    stack: [],
  },
  standard_pointcut: (kind) => hasOwn(DUMMY_ADVICE, kind),
  flexible_pointcut: null,
};

/** @type {import("../stage").Stage} */
export default {
  precursor: ["bare-basic-standard"],
  negative: [],
  exclude: [],
  listLateNegative: (_target, _metadata, _error) => [],
  setup: (context) => {
    setupStandardAdvice(
      context,
      createTrackOriginAdvice(setupAranBasic(context)),
    );
  },
  instrument: (source) => instrument(source, config),
};
