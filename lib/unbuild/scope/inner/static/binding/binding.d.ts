type ImportBinding = {
  type: "import";
  source: estree.Source;
  specifier: estree.Specifier | null;
  variable: estree.Variable;
};

type RegularBinding = {
  type: "regular";
  kind: "let" | "const" | "var" | "callee";
  exports: estree.Specifier[];
  variable: estree.Variable;
};

type RootBinding = {
  type: "root";
  kind: "let" | "const" | "var" | "missing";
  variable: estree.Variable;
};

type Binding = ImportBinding | RegularBinding | RootBinding;

export type MissingBinding = RootBinding & { kind: "missing" };

export type PresentBinding =
  | ImportBinding
  | RegularBinding
  | (RootBinding & { kind: "let" | "const" | "var" });
