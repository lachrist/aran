import { instrument, setupAranBasic } from "../aran/index.mjs";
import bare from "./bare.mjs";

/**
 * @type {import("../aran/config").Config}
 */
const config = {
  selection: ["main", "local"],
  global_declarative_record: "builtin",
  initial_state: null,
  standard_pointcut: false,
  flexible_pointcut: null,
};

/**
 * @type {import("../stage").Stage}
 */
export default {
  ...bare,
  listLateNegative: (_target, _metadata, _error) => [],
  setup: (context) => {
    setupAranBasic(context);
  },
  instrument: (source) => instrument(source, config),
};
