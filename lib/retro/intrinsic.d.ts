export type AmbientIntrinsic =
  | "Array.from"
  | "Symbol"
  | "Reflect.apply"
  | "SyntaxError"
  | "aran.deadzone_symbol"
  | "aran.readGlobalVariable"
  | "aran.writeGlobalVariableStrict"
  | "aran.writeGlobalVariableSloppy"
  | "aran.typeofGlobalVariable"
  | "aran.discardGlobalVariable"
  | "aran.retropileEvalCode";
