// eslint-disable-next-line local/no-deep-import
import { makeTraceAdvice, INITIAL_INDENT } from "../../aspects/trace.mjs";
import {
  setupStandardAdvice,
  instrument,
  setupAranBasic,
} from "../aran/index.mjs";
import bare from "./bare.mjs";

/**
 * @type {import("../aran/config").Config}
 */
const config = {
  selection: ["main", "local"],
  global_declarative_record: "builtin",
  initial_state: INITIAL_INDENT,
  standard_pointcut: ["eval@before"],
  flexible_pointcut: null,
};

/**
 * @type {import("../stage").Stage}
 */
export default {
  ...bare,
  listLateNegative: (_target, _metadata, _error) => [],
  setup: (context) => {
    setupStandardAdvice(
      context,
      /** @type {any} */ (makeTraceAdvice(setupAranBasic(context))),
    );
  },
  instrument: (source) => instrument(source, config),
};
