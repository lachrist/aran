import type { Variable } from "../../estree";
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
  | "class"
  | "function-strict"
  | "function-sloppy"
  | "error"
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

export type Binding = {
  kind: Kind;
  variable: Variable;
  origin: Path;
  status: Status;
};

export type UnboundBinding = Binding & {
  status: UnboundStatus;
};

export type BoundBinding = Binding & { status: BoundStatus };

export type ReportBinding = Binding & { status: ReportStatus };
