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

type GlobalBinding = {
  type: "global";
  kind: "let" | "const" | "var" | "missing";
};

type EnclaveBinding = {
  type: "enclave";
  kind: "let" | "const" | "var" | "missing";
  site: "local" | "global";
};

type Binding = ImportBinding | RegularBinding | GlobalBinding | EnclaveBinding;

export type MissingBinding =
  | (GlobalBinding & { kind: "missing" })
  | (EnclaveBinding & { kind: "missing" });

export type PresentBinding =
  | ImportBinding
  | RegularBinding
  | (GlobalBinding & { kind: "let" | "const" | "var" })
  | (EnclaveBinding & { kind: "let" | "const" | "var"; site: "global" });
