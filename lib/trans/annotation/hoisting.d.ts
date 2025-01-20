import type { VariableName } from "estree-sentry";
import type { Hash } from "../hash";
import type { Tree } from "../../util/tree";

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
  // Also async and generator!
  | "function-strict"
  | "function-sloppy-near"
  | "function-sloppy-away"
  | "error-complex"
  | "error-simple"
  | "param-complex"
  | "param-simple";

export type PreciseScoping<K extends Kind> = {
  [key in Kind]: key extends K ? true : false | null;
};

export type Scoping = { [key in Kind]: boolean | null };

export type UnboundModuleKind = never;

export type UnboundScriptKind = Kind &
  (
    | "var"
    | "let"
    | "const"
    | "class"
    | "function-strict"
    | "function-sloppy-near"
    | "function-sloppy-away"
  );

export type UnboundStrictEvalKind = never;

export type UnboundSloppyEvalKind =
  | "var"
  | "sloppy-function-near"
  | "sloppy-function-away";

export type ModuleKind = Kind &
  ("import" | "var" | "let" | "const" | "class" | "function-strict");

export type ScriptKind = Kind & never;

// Capture function-strict because it also labels async and generators.
export type SloppyEvalKind = Kind &
  ("let" | "const" | "class" | "function-strict");

export type StrictEvalKind = Kind &
  ("var" | "let" | "const" | "class" | "function-strict");

export type ScriptGlobalKind = Kind &
  (
    | "var"
    | "let"
    | "const"
    | "class"
    | "function-strict"
    | "function-sloppy-near"
    | "function-sloppy-away"
  );

export type SloppyEvalGlobalKind = Kind & ("var" | "function-sloppy-away");

export type StrictEvalGlobalKind = Kind & never;

export type ProgramKind = Kind &
  (
    | "import"
    | "var"
    | "let"
    | "const"
    | "class"
    | "function-strict"
    | "function-sloppy-near"
    | "function-sloppy-away"
  );

export type ComplexClosureHeadKind = Kind &
  (
    | "function-self-strict"
    | "function-self-sloppy"
    | "arguments"
    | "param-complex"
  );

export type ComplexClosureBodyKind = Kind &
  (
    | "let"
    | "const"
    | "class"
    | "var"
    | "function-strict"
    | "function-sloppy-near"
    | "function-sloppy-away"
  );

export type SimpleClosureKind = Kind &
  (
    | "let"
    | "const"
    | "class"
    | "var"
    | "function-strict"
    | "function-sloppy-near"
    | "function-sloppy-away"
    | "function-self-strict"
    | "function-self-sloppy"
    | "arguments"
    | "param-simple"
  );

export type IfBranchKind = Kind & "function-sloppy-near";

export type BlockKind = Kind &
  ("let" | "const" | "class" | "function-strict" | "function-sloppy-near");

export type ClassKind = Kind & "class-self";

export type StaticBlockKind = Kind &
  (
    | "var"
    | "let"
    | "const"
    | "function-strict"
    | "function-sloppy-near"
    | "function-sloppy-away"
    | "class"
  );

export type CatchKind = Kind & ("error-complex" | "error-simple");

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
  [key in VariableName]?: [Kind, ...Kind[]];
};

export type FrameEntry = [VariableName, [Kind, ...Kind[]]];

export type Hoisting = {
  [key in Hash]?: Frame;
};

export type Error = {
  message: string;
  origin: Hash;
};
