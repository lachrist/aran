/////////////////////
// ParameterHeader //
/////////////////////

export type PrivateParameterHeader = {
  type: "parameter";
  mode: "strict";
  parameter: "private.get" | "private.set" | "private.has";
  payload: estree.PrivateKey;
};

export type ScopeParameterHeader =
  | {
      type: "parameter";
      mode: "strict" | "sloppy";
      parameter: "scope.read" | "scope.write" | "scope.typeof";
      payload: estree.Variable;
    }
  | {
      type: "parameter";
      mode: "sloppy";
      parameter: "scope.discard";
      payload: estree.Variable;
    };

export type SuperParameterHeader = {
  type: "parameter";
  mode: "strict" | "sloppy";
  parameter: "super.get" | "super.set" | "super.call";
  payload: null;
};

export type ImportMetaParameterHeader = {
  type: "parameter";
  mode: "strict";
  parameter: "import.meta";
  payload: null;
};

export type ImportDynamicParameterHeader = {
  type: "parameter";
  mode: "strict";
  parameter: "import.dynamic";
  payload: estree.Source;
};

export type NewTargetParameterHeader = {
  type: "parameter";
  mode: "strict";
  parameter: "new.target";
  payload: null;
};

export type ThisParameterHeader = {
  type: "parameter";
  mode: "strict" | "sloppy";
  parameter: "this";
  payload: null;
};

export type ParameterHeader =
  | PrivateParameterHeader
  | ScopeParameterHeader
  | SuperParameterHeader
  | ImportMetaParameterHeader
  | ImportDynamicParameterHeader
  | NewTargetParameterHeader
  | ThisParameterHeader;

export type PrivateParameter = PrivateParameterHeader["parameter"];

export type ScopeParameter = ScopeParameterHeader["parameter"];

export type SuperParameter = SuperParameterHeader["parameter"];

export type HeaderParameter = ParameterHeader["parameter"];

///////////////////
// DeclareHeader //
///////////////////

export type DeclareHeader = {
  type: "declare";
  mode: "strict" | "sloppy";
  kind: "let" | "var";
  variable: estree.Variable;
};

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

export type Header = ModuleHeader | ParameterHeader | DeclareHeader;
