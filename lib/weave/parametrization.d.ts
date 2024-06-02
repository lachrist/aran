export type Parametrization = {
  "module":
    | "this"
    | "import.meta"
    | "import.dynamic"
    | "scope.read"
    | "scope.write"
    | "scope.typeof"
    | "scope.discard";
  "script":
    | "this"
    | "import.dynamic"
    | "scope.read"
    | "scope.write"
    | "scope.typeof"
    | "scope.discard";
  "eval.global":
    | "this"
    | "import.dynamic"
    | "scope.read"
    | "scope.write"
    | "scope.typeof"
    | "scope.discard";
  "eval.local.root":
    | "this"
    | "new.target"
    | "import.dynamic"
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
  "eval.local.deep": never;
  "function": "function.callee" | "new.target" | "this" | "function.arguments";
  "function.async":
    | "function.callee"
    | "new.target"
    | "this"
    | "function.arguments";
  "function.generator":
    | "function.callee"
    | "new.target"
    | "this"
    | "function.arguments";
  "function.async.generator":
    | "function.callee"
    | "new.target"
    | "this"
    | "function.arguments";
  "arrow": "function.callee" | "function.arguments";
  "arrow.async": "function.callee" | "function.arguments";
  "catch": "catch.error";
  "try": never;
  "finally": never;
  "then": never;
  "else": never;
  "bare": never;
  "while": never;
};
