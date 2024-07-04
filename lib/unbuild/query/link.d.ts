import type { Source, Specifier, Variable } from "../../estree";

export type ImportLink =
  | {
      type: "import";
      variable: Variable;
      source: Source;
      import: Specifier | null;
    }
  | {
      type: "import";
      variable: null;
      source: Source;
      import: null;
    };

export type ExportLink =
  | {
      type: "export";
      variable: Variable;
      export: Specifier;
    }
  | {
      type: "export";
      variable: null;
      export: Specifier & "default";
    };

export type AggregateLink =
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

export type Link = ImportLink | ExportLink | AggregateLink;
