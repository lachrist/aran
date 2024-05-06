export type EagerHeader =
  | {
      type: "eager";
      mode: "strict";
      parameter: "private.get" | "private.set" | "private.has";
      payload: estree.PrivateKey;
    }
  | {
      type: "eager";
      mode: "sloppy";
      parameter: "scope.discard";
      payload: estree.Variable;
    }
  | {
      type: "eager";
      mode: "strict" | "sloppy";
      parameter: "scope.read" | "scope.write" | "scope.typeof";
      payload: estree.Variable;
    };

export type PrivateHeader = EagerHeader & {
  parameter: "private.get" | "private.set" | "private.has";
};

export type LookupHeader = EagerHeader & {
  parameter: "scope.read" | "scope.write" | "scope.typeof" | "scope.discard";
};

export type SloppyLookupHeader = EagerHeader & {
  mode: "sloppy";
  parameter: "scope.read" | "scope.write" | "scope.typeof" | "scope.discard";
};

export type StrictLookupHeader = EagerHeader & {
  mode: "strict";
  parameter: "scope.read" | "scope.write" | "scope.typeof";
};

export type DeclareHeader = {
  type: "declare";
  mode: "strict" | "sloppy";
  kind: "let" | "var";
  variable: estree.Variable;
};

export type ImportHeader = {
  type: "import";
  mode: "strict";
  source: estree.Source;
  import: estree.Specifier | null;
};

export type ExportHeader = {
  type: "export";
  mode: "strict";
  export: estree.Specifier;
};

export type AggregateHeader =
  | {
      type: "aggregate";
      mode: "strict";
      source: estree.Source;
      import: estree.Specifier | null;
      export: estree.Specifier;
    }
  | {
      type: "aggregate";
      mode: "strict";
      source: estree.Source;
      import: null;
      export: null;
    };

export type ModuleHeader = ImportHeader | ExportHeader | AggregateHeader;

////////////
// Header //
////////////

export type Header = ModuleHeader | EagerHeader | DeclareHeader;
