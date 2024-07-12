export type ProgramKind =
  | "module"
  | "script"
  | "global-eval"
  | "root-local-eval"
  | "deep-local-eval";

export type ArrowKind = "arrow" | "async-arrow";

export type FunctionKind = "function" | "async-function";

export type GeneratorKind = "generator" | "async-generator";

export type MethodKind = "method" | "async-method";

export type ClosureKind = ArrowKind | FunctionKind | GeneratorKind | MethodKind;

export type RoutineKind = ProgramKind | ClosureKind;

export type ControlKind =
  | "try"
  | "catch"
  | "finally"
  | "then"
  | "else"
  | "while"
  | "bare";

export type BlockKind = RoutineKind | ControlKind;

export type Parametrization = {
  "module": "this" | "import" | "import.meta";
  "script": "this" | "import";
  "global-eval": "this" | "import";
  "root-local-eval":
    | "this"
    | "new.target"
    | "import"
    | "import.meta"
    | "scope.read"
    | "scope.write"
    | "scope.typeof"
    | "scope.discard"
    | "private.has"
    | "private.get"
    | "private.set"
    | "super.call"
    | "super.get"
    | "super.set";
  "deep-local-eval": never;
  "function": "function.callee" | "new.target" | "this" | "function.arguments";
  "async-function":
    | "function.callee"
    | "new.target"
    | "this"
    | "function.arguments";
  "generator": "function.callee" | "new.target" | "this" | "function.arguments";
  "async-generator":
    | "function.callee"
    | "new.target"
    | "this"
    | "function.arguments";
  "arrow": "function.callee" | "function.arguments";
  "async-arrow": "function.callee" | "function.arguments";
  "method": "function.callee" | "new.target" | "this" | "function.arguments";
  "async-method":
    | "function.callee"
    | "new.target"
    | "this"
    | "function.arguments";
  "catch": "catch.error";
  "try": never;
  "finally": never;
  "then": never;
  "else": never;
  "bare": never;
  "while": never;
};
