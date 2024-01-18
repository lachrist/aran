export type RegularHoist = {
  type: "regular";
  kind: "let" | "const" | "var";
  variable: estree.Variable;
};

export type DeadzoneHoist = RegularHoist & {
  kind: "let" | "const";
};

export type LifespanHoist = RegularHoist & {
  kind: "var";
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

export type Hoist = RegularHoist | ImportHoist | ExportHoist;
