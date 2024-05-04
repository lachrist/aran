export type PrivateHeader = {
  type: "private";
  mode: "strict";
  operation: "has" | "get" | "set";
  key: estree.PrivateKey;
};

export type LookupHeader =
  | {
      type: "lookup";
      mode: "strict" | "sloppy";
      operation: "read" | "write" | "typeof";
      variable: estree.Variable;
    }
  | {
      type: "lookup";
      mode: "sloppy";
      operation: "discard";
      variable: estree.Variable;
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

export type Header =
  | ModuleHeader
  | PrivateHeader
  | LookupHeader
  | DeclareHeader;
