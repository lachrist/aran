import { instrument, setupAranPatch } from "../aran/index.mjs";
import bare from "./bare.mjs";

/**
 * @type {import("../aran/config").Config}
 */
const config = {
  selection: "*",
  global_declarative_record: "emulate",
  initial_state: null,
  flexible_pointcut: null,
  standard_pointcut: [],
};

/**
 * @type {import("../stage").Stage}
 */
export default {
  ...bare,
  listLateNegative: (_target, _metadata, error) =>
    error.name === "AranEvalError" ? ["direct-eval-call"] : [],
  setup: (context) => {
    setupAranPatch(context);
  },
  instrument: (source) => instrument(source, config),
};
