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
  | "function-sloppy-near"
  | "function-sloppy-away"
  | "error"
  | "param"
  | "param-legacy";

export type Clash = "ignore" | "report" | "remove";

export type DuplicateAccumulation = {
  index: number;
  binding: Binding;
  bindings: FreeBinding[];
  current: Path;
};

export type Mode = "strict" | "sloppy";

export type FreeBinding = {
  type: "free";
  kind: Kind;
  variable: Variable;
  origin: Path;
  bind: null;
};

export type LockBinding = {
  type: "lock";
  kind: Kind;
  variable: Variable;
  origin: Path;
  bind: Path;
};

export type FlagBinding = {
  type: "flag";
  kind: Kind;
  variable: Variable;
  origin: Path;
  bind: null;
};

export type VoidBinding = {
  type: "void";
  kind: Kind;
  variable: Variable;
  origin: Path;
  bind: null;
};

export type Binding = FreeBinding | LockBinding | FlagBinding | VoidBinding;
