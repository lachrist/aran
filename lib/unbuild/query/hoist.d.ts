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

export type ImportHoist = {
  type: "import";
  variable: estree.Variable;
  source: estree.Source;
  specifier: estree.Specifier | null;
};

export type ExportHoist = {
  type: "export";
  variable: estree.Variable;
  specifier: estree.Specifier;
};

export type Hoist = DeclareHoist | ImportHoist | ExportHoist;
