import type { Source, Specifier, Variable } from "../../../estree";

export type Baseline = "deadzone" | "undefined";

export type Write = "perform" | "report" | "ignore";

export type ExternalBinding = {
  type: "external";
  source: Source;
  specifier: Specifier | null;
};

export type InternalBinding = {
  type: "internal";
  baseline: Baseline;
  write: Write;
  export: Specifier[];
};

export type RegularBinding = ExternalBinding | InternalBinding;

export type RegularFrame = {
  type: "regular";
  record: { [k in Variable]?: RegularBinding };
};
