import type {
  SourceValue,
  SpecifierName,
  SpecifierValue,
  VariableName,
} from "estree-sentry";

///////////////////
// DeclareHeader //
///////////////////

export type DeclareHeader = {
  type: "declare";
  kind: "let" | "var";
  variable: VariableName;
};

//////////////////
// ModuleHeader //
//////////////////

export type ImportHeader = {
  type: "import";
  source: SourceValue;
  import: SpecifierName | SpecifierValue | null;
};

export type ExportHeader = {
  type: "export";
  export: SpecifierValue | SpecifierName;
};

export type AggregateHeader =
  | {
      type: "aggregate";
      source: SourceValue;
      import: SpecifierValue | SpecifierName | null;
      export: SpecifierValue | SpecifierName;
    }
  | {
      type: "aggregate";
      source: SourceValue;
      import: null;
      export: null;
    };

export type ModuleHeader = ImportHeader | ExportHeader | AggregateHeader;

////////////
// Header //
////////////

export type Header = ModuleHeader | DeclareHeader;
