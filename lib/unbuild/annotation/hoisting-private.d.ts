import type { VariableName } from "estree-sentry";
import type { Hash } from "../../hash";
import type { Tree } from "../../util/tree";

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
  | "error-legacy"
  | "param"
  | "param-legacy";

export type Clash = "ignore" | "report" | "remove";

export type DuplicateAccumulation = {
  index: number;
  binding: Binding;
  bindings: FreeBinding[];
  current: Hash;
};

export type Mode = "strict" | "sloppy";

export type FreeBinding = {
  type: "free";
  kind: Kind;
  variable: VariableName;
  origin: Hash;
  bind: null;
};

export type LockBinding = {
  type: "lock";
  kind: Kind;
  variable: VariableName;
  origin: Hash;
  bind: Hash;
};

export type FlagBinding = {
  type: "flag";
  kind: Kind;
  variable: VariableName;
  origin: Hash;
  bind: "duplicate" | "keyword";
};

export type VoidBinding = {
  type: "void";
  kind: Kind;
  variable: VariableName;
  origin: Hash;
  bind: null;
};

export type Binding = FreeBinding | LockBinding | FlagBinding | VoidBinding;

export type Hoisting = Tree<Binding>;
