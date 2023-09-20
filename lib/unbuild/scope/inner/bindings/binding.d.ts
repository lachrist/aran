export type Binding =
  | import("./external.mjs").ExternalBinding
  | import("./global.mjs").GlobalBinding
  | import("./hidden.mjs").HiddenBinding
  | import("./import.mjs").ImportBinding
  | import("./missing.mjs").MissingBinding
  | import("./regular.mjs").RegularBinding;
