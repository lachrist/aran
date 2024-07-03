import type { Variable } from "../../estree";
import type { Path } from "../../path";

export type Scoping = {
  [key in Kind]?: boolean;
};

export type Kind =
  | "import"
  | "var"
  | "let"
  | "const"
  | "class"
  | "function-strict"
  | "function-sloppy"
  | "error"
  | "param"
  | "param-legacy";

export type Clash = "ignore" | "report" | "backup" | "backup-from-deep";

export type DuplicateAccumulation = {
  index: number;
  binding: Binding;
  bindings: UnboundBinding[];
  current: Path;
};

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

export type BoundBinding = {
  type: "bound";
  kind: Kind;
  variable: Variable;
  origin: Path;
  bind: Path;
  backup: null;
};

export type UnboundBinding = {
  type: "unbound";
  kind: Kind;
  variable: Variable;
  origin: Path;
  bind: null;
  backup: null | Path;
};

export type ReportBinding = {
  type: "report";
  kind: Kind;
  variable: Variable;
  origin: Path;
  bind: null;
  backup: null;
};

export type Binding = BoundBinding | UnboundBinding | ReportBinding;
