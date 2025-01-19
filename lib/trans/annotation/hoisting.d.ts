import type { VariableName } from "estree-sentry";
import type { Hash } from "../hash";
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
  | "class-self"
  | "arguments"
  | "function-self-strict"
  | "function-self-sloppy"
  | "function-strict"
  | "function-sloppy-near"
  | "function-sloppy-away"
  | "error-complex"
  | "error-simple"
  | "param-complex"
  | "param-simple";

export type Clash = "ignore" | "report" | "remove";

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

export type TodoBinding = FreeBinding;

export type DoneBinding = LockBinding | FlagBinding | VoidBinding;

export type Binding = TodoBinding | DoneBinding;

export type BindingItem = {
  todo: Tree<TodoBinding>;
  done: Tree<DoneBinding>;
};

export type BindingTree = Tree<BindingItem>;

export type Frame = {
  [key in VariableName]?: Kind[];
};

export type FrameEntry = [VariableName, Kind[]];

export type Hoisting = {
  [key in Hash]?: Frame;
};

export type Error = {
  message: string;
  origin: Hash;
};
