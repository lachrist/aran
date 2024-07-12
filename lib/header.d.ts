import type { Source, Specifier, Variable } from "./estree";

///////////////////
// DeclareHeader //
///////////////////

export type DeclareHeader = {
  type: "declare";
  kind: "let" | "var";
  variable: Variable;
};

//////////////////
// ModuleHeader //
//////////////////

export type ImportHeader = {
  type: "import";
  source: Source;
  import: Specifier | null;
};

export type ExportHeader = {
  type: "export";
  export: Specifier;
};

export type AggregateHeader =
  | {
      type: "aggregate";
      source: Source;
      import: Specifier | null;
      export: Specifier;
    }
  | {
      type: "aggregate";
      source: Source;
      import: null;
      export: null;
    };

export type ModuleHeader = ImportHeader | ExportHeader | AggregateHeader;

////////////
// Header //
////////////

export type Header = ModuleHeader | DeclareHeader;
