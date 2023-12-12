export type DeclarationHeader = {
  type: "declaration";
  kind: "let" | "var";
  mode: "strict" | "sloppy";
  variable: estree.Variable;
};

export type LookupHeader = {
  type: "lookup";
  mode: "strict" | "sloppy";
  variable: estree.Variable;
};

export type ParameterHeader = {
  type: "parameter";
  mode: "strict";
  parameter:
    | "this"
    | "import"
    | "import.meta"
    | "new.target"
    | "super.get"
    | "super.set"
    | "super.call";
};

export type PrivateHeader = {
  type: "private";
  mode: "strict";
  key: estree.PrivateKey;
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

export type Header =
  | DeclarationHeader
  | LookupHeader
  | ParameterHeader
  | PrivateHeader
  | ModuleHeader;

export type StrictHeader = Header & { mode: "strict" };

export type SloppyHeader = Header & { mode: "sloppy" };
