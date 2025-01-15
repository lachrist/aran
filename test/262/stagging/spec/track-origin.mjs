/* eslint-disable local/no-deep-import */

import {
  DUMMY_BASIC_MEMBRANE,
  instrument,
  setupAranBasic,
  setupStandardAdvice,
} from "../aran/index.mjs";
import { makeTrackOriginAdvice } from "../../../aspects/track-origin.mjs";

const {
  Object: { hasOwn },
} = globalThis;

const DUMMY_ADVICE = makeTrackOriginAdvice(DUMMY_BASIC_MEMBRANE);

/**
 * @type {import("../aran/config").Config}
 */
const config = {
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
      makeTrackOriginAdvice(setupAranBasic(context)),
    );
  },
  instrument: (source) => instrument(source, config),
};
