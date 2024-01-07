export type BlockHoist = {
  type: "block";
  kind: "let" | "const";
  variable: estree.Variable;
};

export type ClosureHoist = {
  type: "closure";
  kind: "var";
  variable: estree.Variable;
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

export type Hoist = BlockHoist | ClosureHoist | ImportHoist | ExportHoist;
