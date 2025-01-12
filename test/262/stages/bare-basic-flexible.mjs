import { instrument, setupAranWeave } from "../aran/index.mjs";
import bare from "./bare.mjs";

/**
 * @type {import("../aran/config").Config}
 */
const config = {
  selection: ["main", "local"],
  global_declarative_record: "builtin",
  initial_state: null,
  flexible_pointcut: {},
  standard_pointcut: null,
};

/**
 * @type {import("../stage").Stage}
 */
export default {
  ...bare,
  listLateNegative: (_target, _metadata, _error) => [],
  setup: (context) => {
    setupAranWeave(context);
  },
  instrument: (source) => instrument(source, config),
};
