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

export type LookupParameter =
  | "read.strict"
  | "read.sloppy"
  | "write.strict"
  | "write.sloppy"
  | "typeof.strict"
  | "typeof.sloppy"
  | "discard.sloppy";

export type PrivateParameter = "private.has" | "private.get" | "private.set";

// Header //

export type HeaderParameter =
  | StraightParameter
  | LookupParameter
  | PrivateParameter;

export type StraightHeader = {
  type: StraightParameter;
};

export type LookupHeader = {
  type: LookupParameter;
  variable: estree.Variable | null;
};

export type PrivateHeader = {
  type: PrivateParameter;
  key: estree.PrivateKey | null;
};

export type ParameterHeader = StraightHeader | LookupHeader | PrivateHeader;

// Static | Dynamic //

export type StaticLookupHeader = LookupHeader & {
  variable: estree.Variable;
};

export type DynamicLookupHeader = LookupHeader & {
  variable: null;
};

export type StaticPrivateHeader = PrivateHeader & {
  key: estree.PrivateKey;
};

export type DynamicPrivateHeader = PrivateHeader & {
  key: null;
};

///////////////////
// DeclareHeader //
///////////////////

export type ShallowDeclareHeader = {
  type: "declare.strict" | "declare.sloppy";
  kind: "let" | "var";
  deep: false;
  variable: estree.Variable;
};

export type DeepDeclareHeader = {
  type: "declare.sloppy";
  kind: "var";
  deep: true;
  variable: estree.Variable;
};

export type PrepareDeepDeclareHeader = {
  type: "declare.sloppy";
  kind: "var";
  deep: false;
  variable: null;
};

export type DeclareHeader =
  | ShallowDeclareHeader
  | DeepDeclareHeader
  | PrepareDeepDeclareHeader;

//////////////////
// ModuleHeader //
//////////////////

export type ImportHeader = {
  type: "import";
  source: estree.Source;
  import: estree.Specifier | null;
};

export type ExportHeader = {
  type: "export";
  export: estree.Specifier;
};

export type AggregateHeader =
  | {
      type: "aggregate";
      source: estree.Source;
      import: estree.Specifier | null;
      export: estree.Specifier;
    }
  | {
      type: "aggregate";
      source: estree.Source;
      import: null;
      export: null;
    };

export type ModuleHeader = ImportHeader | ExportHeader | AggregateHeader;

////////////
// Header //
////////////

export type Header =
  | DeclareHeader
  | ModuleHeader
  | ParameterHeader
  | LookupHeader
  | PrivateHeader;
