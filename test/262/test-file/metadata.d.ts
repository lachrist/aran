export type Flag =
  | "onlyStrict"
  | "noStrict"
  | "module"
  | "raw"
  | "async"
  | "generated"
  | "CanBlockIsFalse"
  | "CanBlockIsTrue"
  | "non-deterministic";

type Phase = "async" | "harness" | "parse" | "resolution" | "runtime";

type Negative = {
  phase: Phase;
  type: string;
};

export type Metadata = {
  negative: null | Negative;
  includes: string[];
  flags: Flag[];
  locale: string[];
  features: string[];
};
