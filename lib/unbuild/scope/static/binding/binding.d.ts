export type ImportBinding = {
  type: "import";
  source: estree.Source;
  specifier: estree.Specifier | null;
  variable: estree.Variable;
};

export type RegularBinding = {
  type: "regular";
  kind: "let" | "const" | "var" | "callee";
  exports: estree.Specifier[];
  variable: estree.Variable;
};

export type GlobalBinding = {
  type: "global";
  kind: "let" | "const" | "var";
  variable: estree.Variable;
};

export type Binding = ImportBinding | RegularBinding | GlobalBinding;
