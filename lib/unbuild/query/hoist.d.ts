// 'val' kind is actually only used for callee and not hoisted here.
// It is however used as a hoist in scope.

import type { Source, Specifier, Variable } from "../../estree";

export type DeclareHoist = {
  type: "declare";
  kind: "let" | "const" | "var" | "val";
  variable: Variable;
};

export type DeadzoneHoist = DeclareHoist & {
  kind: "let" | "const";
};

export type LifespanHoist = DeclareHoist & {
  kind: "var" | "val";
};

export type ImportHoist =
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

export type ExportHoist =
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

export type AggregateHoist =
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

export type ModuleHoist = ImportHoist | ExportHoist | AggregateHoist;

export type Hoist = DeclareHoist | ModuleHoist;
