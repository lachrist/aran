/////////////////////
// ParameterHeader //
/////////////////////

// Parameter //

export type StraightParameter =
  | "super.get"
  | "super.set"
  | "super.call"
  | "this"
  | "new.target"
  | "import.meta"
  | "import.dynamic";

export type PrivateParameter = "private.has" | "private.get" | "private.set";

export type LookupParameter =
  | "read.strict"
  | "write.strict"
  | "typeof.strict"
  | "read.sloppy"
  | "write.sloppy"
  | "typeof.sloppy"
  | "discard.sloppy";

export type HeaderParameter =
  | StraightParameter
  | PrivateParameter
  | LookupParameter;

export type StraightHeader = {
  type: StraightParameter;
  mode: null;
};

export type StaticPrivateHeader = {
  type: PrivateParameter;
  mode: "strict";
  key: estree.PrivateKey;
};

export type DynamicPrivateHeader = {
  type: PrivateParameter;
  mode: "strict";
  key: null;
};

export type PrivateHeader = StaticPrivateHeader | DynamicPrivateHeader;

export type StaticLookupHeader =
  | {
      type: "read";
      mode: "strict" | "sloppy";
      variable: estree.Variable;
    }
  | {
      type: "write";
      mode: "strict" | "sloppy";
      variable: estree.Variable;
    }
  | {
      type: "typeof";
      mode: "strict" | "sloppy";
      variable: estree.Variable;
    }
  | {
      type: "discard";
      mode: "sloppy";
      variable: estree.Variable;
    };

export type DynamicLookupHeader =
  | {
      type: "read";
      mode: "strict" | "sloppy";
      variable: null;
    }
  | {
      type: "write";
      mode: "strict" | "sloppy";
      variable: null;
    }
  | {
      type: "typeof";
      mode: "strict" | "sloppy";
      variable: null;
    }
  | {
      type: "discard";
      mode: "sloppy";
      variable: null;
    };

export type LookupHeader = StaticLookupHeader | DynamicLookupHeader;

export type DeclareHeader = {
  type: "declare";
  mode: "strict" | "sloppy";
  kind: "let" | "var";
  variable: estree.Variable;
};

export type ScopeHeader = DeclareHeader | LookupHeader;

//////////////////
// ModuleHeader //
//////////////////

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
  | ScopeHeader
  | StraightHeader;
