export type ProgramParameter =
  | "this"
  | "import"
  | "import.meta@regular"
  | "import.meta@unsafe"
  | "new.target"
  | "super.get"
  | "super.set"
  | "super.call"
  | "private"
  | "scope.read"
  | "scope.write"
  | "scope.typeof"
  | "scope.discard";
