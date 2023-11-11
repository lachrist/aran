type ImportBinding = {
  type: "import";
  source: estree.Source;
  specifier: estree.Specifier | null;
};

type RegularBinding = {
  type: "regular";
  kind: "let" | "const" | "var";
  internalized: boolean;
  exports: estree.Specifier[];
};

type RootBinding = {
  type: "root";
  kind: "let" | "const" | "var" | "missing";
};

type Binding = ImportBinding | RegularBinding | RootBinding;

export type MissingBinding = RootBinding & { kind: "missing" };

export type PresentBinding =
  | ImportBinding
  | RegularBinding
  | (RootBinding & { kind: "let" | "const" | "var" });
