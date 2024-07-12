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
  | "scope.writeStrict"
  | "scope.writeSloppy"
  | "scope.typeof"
  | "scope.discard";
