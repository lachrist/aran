import type { Source, Specifier, Variable } from "../../estree";
import type { Path } from "../../path";

///////////
// Inner //
///////////

export type Scoping = {
  [key in Kind]?: boolean;
};

export type Kind =
  | "import"
  | "var"
  | "let"
  | "const"
  | "function-strict"
  | "function-sloppy"
  | "class"
  | "param"
  | "param-legacy";

export type UnboundStatus = {
  type: "unbound";
  backup: null | Path;
};

export type BoundStatus = {
  type: "bound";
  path: Path;
};

export type ReportStatus = {
  type: "report";
};

export type Status = UnboundStatus | BoundStatus | ReportStatus;

export type Mode = "strict" | "sloppy";

export type Hoist = {
  kind: Kind;
  variable: Variable;
  origin: Path;
  status: Status;
};

export type UnboundHoist = Hoist & {
  status: UnboundStatus;
};

export type BoundHoist = Hoist & { status: BoundStatus };

export type ReportHoist = Hoist & { status: ReportStatus };

///////////
// Outer //
///////////

export type Write = "perform" | "report" | "ignore";

export type Baseline = "deadzone" | "undefined";

export type InternalBinding = {
  type: "internal";
  variable: Variable;
  baseline: Baseline;
  write: Write;
};

export type ExternalBinding = {
  type: "external";
  variable: Variable;
  source: Source;
  specifier: Specifier | null;
};

export type Binding = InternalBinding | ExternalBinding;

export type Duplicate = {
  variable: Variable;
  origin: Path;
};

export type Registery = { [key in Path]?: Binding[] };

export type Result = {
  unbound: Binding[];
  bound: Registery;
  report: Duplicate[];
};
