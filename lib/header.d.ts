/////////////////////
// ParameterHeader //
/////////////////////

import type { PrivateKey, Source, Specifier, Variable } from "./estree";

export type ParameterHeader =
  | {
      type: "parameter";
      mode: "strict";
      parameter: "private.get" | "private.set" | "private.has";
      payload: PrivateKey;
    }
  | {
      type: "parameter";
      mode: "strict" | "sloppy";
      parameter: "scope.read" | "scope.write" | "scope.typeof";
      payload: Variable;
    }
  | {
      type: "parameter";
      mode: "sloppy";
      parameter: "scope.discard";
      payload: Variable;
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
  variable: Variable;
};

//////////////////
// ModuleHeader //
//////////////////

export type ImportHeader = {
  type: "import";
  mode: "strict";
  source: Source;
  import: Specifier | null;
};

export type ExportHeader = {
  type: "export";
  mode: "strict";
  export: Specifier;
};

export type AggregateHeader =
  | {
      type: "aggregate";
      mode: "strict";
      source: Source;
      import: Specifier | null;
      export: Specifier;
    }
  | {
      type: "aggregate";
      mode: "strict";
      source: Source;
      import: null;
      export: null;
    };

export type ModuleHeader = ImportHeader | ExportHeader | AggregateHeader;

////////////
// Header //
////////////

export type Header = ModuleHeader | ParameterHeader | DeclareHeader;

export type ModuleProgramHeader =
  | ThisParameterHeader
  | ImportDynamicParameterHeader
  | ImportMetaParameterHeader
  | ImportHeader
  | ExportHeader
  | AggregateHeader;

export type ScriptProgramHeader =
  | DeclareHeader
  | ThisParameterHeader
  | ImportDynamicParameterHeader;

export type GlobalEvalProgramHeader =
  | DeclareHeader
  | ThisParameterHeader
  | ImportDynamicParameterHeader;

export type RootLocalEvalProgramHeader = DeclareHeader | ParameterHeader;

export type DeepLocalEvalProgramHeader = ParameterHeader;
