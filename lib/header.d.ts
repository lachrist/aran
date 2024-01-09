/////////////////////
// ParameterHeader //
/////////////////////

export type StraightParameter =
  | "this"
  | "new.target"
  | "import.meta"
  | "import.dynamic"
  | "super.get"
  | "super.set"
  | "super.call";

export type PrivateParameter = "private";

export type LookupParameter = "lookup.strict" | "lookup.sloppy";

export type HeaderParameter =
  | StraightParameter
  | PrivateParameter
  | LookupParameter;

export type ParameterHeader = {
  type: "parameter";
  parameter: HeaderParameter;
};

///////////////////
// DeclareHeader //
///////////////////

export type LetDeclareHeader = {
  type: "declare.let";
  mode: "strict" | "sloppy";
  variable: estree.Variable;
};

export type VarDeclareHeader = {
  type: "declare.var";
  mode: "strict" | "sloppy";
  variable: estree.Variable;
};

export type DeclareHeader = LetDeclareHeader | VarDeclareHeader;

//////////////////
// LookupHeader //
//////////////////

export type StaticLookupHeader = {
  type: "lookup.static";
  mode: "strict" | "sloppy";
  variable: estree.Variable;
};

export type DynamicLookupHeader = {
  type: "lookup.dynamic";
  mode: "strict" | "sloppy";
};

export type LookupHeader = StaticLookupHeader | DynamicLookupHeader;

///////////////////
// PrivateHeader //
///////////////////

export type StaticPrivateHeader = {
  type: "private.static";
  key: estree.PrivateKey;
};

export type DynamicPrivateHeader = {
  type: "private.dynamic";
};

export type PrivateHeader = StaticPrivateHeader | DynamicPrivateHeader;

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

//////////
// Mode //
//////////

export type StrictHeader =
  | (DeclareHeader & { mode: "strict" })
  | (LookupHeader & { mode: "strict" })
  | PrivateHeader
  | ModuleHeader;

export type SloppyHeader =
  | (DeclareHeader & { mode: "sloppy" })
  | (LookupHeader & { mode: "sloppy" });
