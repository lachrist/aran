/////////////////////
// ParameterHeader //
/////////////////////

export type ParameterHeader =
  | {
      type: "parameter";
      mode: "strict";
      parameter: "private.get" | "private.set" | "private.has";
      payload: estree.PrivateKey;
    }
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
    }
  | {
      type: "parameter";
      mode: "strict" | "sloppy";
      parameter:
        | "this"
        | "import.meta"
        | "import.dynamic"
        | "new.target"
        | "super.get"
        | "super.set"
        | "super.call";
      payload: null;
    };

export type HeaderParameter = ParameterHeader["parameter"];

export type PrivateParameter = "private.get" | "private.set" | "private.has";

export type PrivateParameterHeader = ParameterHeader & {
  parameter: PrivateParameter;
};

export type ScopeParameter =
  | "scope.read"
  | "scope.write"
  | "scope.typeof"
  | "scope.discard";

export type ScopeParameterHeader = ParameterHeader & {
  parameter: ScopeParameter;
};

export type SuperParameter = "super.get" | "super.set" | "super.call";

export type SuperParameterHeader = ParameterHeader & {
  parameter: SuperParameter;
};

export type ImportMetaParameterHeader = ParameterHeader & {
  parameter: "import.meta";
};

export type ImportDynamicParameterHeader = ParameterHeader & {
  parameter: "import.dynamic";
};

export type NewTargetParameterHeader = ParameterHeader & {
  parameter: "new.target";
};

export type ThisParameterHeader = ParameterHeader & {
  parameter: "this";
};

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

export type LinkHeader = ImportHeader | ExportHeader | AggregateHeader;

////////////
// Header //
////////////

export type Header = LinkHeader | ParameterHeader | DeclareHeader;

export type ModuleHeader =
  | ThisParameterHeader
  | ImportDynamicParameterHeader
  | ImportMetaParameterHeader
  | ImportHeader
  | ExportHeader
  | AggregateHeader;

export type ScriptHeader =
  | DeclareHeader
  | ThisParameterHeader
  | ImportDynamicParameterHeader;

export type GlobalEvalHeader =
  | DeclareHeader
  | ThisParameterHeader
  | ImportDynamicParameterHeader;

export type RootLocalEvalHeader = DeclareHeader | ParameterHeader;

export type DeepLocalEvalHeader = ParameterHeader;
