import type {
  SourceValue,
  SpecifierName,
  SpecifierValue,
  VariableName,
} from "estree-sentry";

export type ImportLink =
  | {
      type: "import";
      variable: VariableName;
      source: SourceValue;
      import: SpecifierName | SpecifierValue | null;
    }
  | {
      type: "import";
      variable: null;
      source: SourceValue;
      import: null;
    };

export type ExportLink =
  | {
      type: "export";
      variable: VariableName;
      export: SpecifierName | SpecifierValue;
    }
  | {
      type: "export";
      variable: null;
      export: SpecifierName & "default";
    };

export type AggregateLink =
  | {
      type: "aggregate";
      source: SourceValue;
      import: SpecifierName | SpecifierValue | null;
      export: SpecifierName | SpecifierValue;
    }
  | {
      type: "aggregate";
      source: SourceValue;
      import: null;
      export: null;
    };

export type Link = ImportLink | ExportLink | AggregateLink;
