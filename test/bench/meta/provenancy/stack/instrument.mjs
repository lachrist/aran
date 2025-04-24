import { compileInstrument } from "../instrument.mjs";

export default compileInstrument({
  tracking: "stack",
  global_declarative_record: "emulate",
});
