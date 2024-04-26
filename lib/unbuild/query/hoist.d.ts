// 'val' kind is actually only used for callee and not hoisted here.
// It is however used as a hoist in scope.

export type DeclareHoist = {
  type: "declare";
  kind: "let" | "const" | "var" | "val";
  variable: estree.Variable;
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
      variable: estree.Variable;
      source: estree.Source;
      import: estree.Specifier | null;
    }
  | {
      type: "import";
      variable: null;
      source: estree.Source;
      import: null;
    };

export type ExportHoist =
  | {
      type: "export";
      variable: estree.Variable;
      export: estree.Specifier;
    }
  | {
      type: "export";
      variable: null;
      export: estree.Specifier & "default";
    };

export type AggregateHoist =
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

export type ModuleHoist = ImportHoist | ExportHoist | AggregateHoist;

export type Hoist = DeclareHoist | ModuleHoist;
