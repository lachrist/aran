export type Binding =
  | {
      type: "import";
      source: estree.Source;
      specifier: estree.Specifier | null;
    }
  | {
      type: "regular";
      kind: "let" | "const" | "var";
      exports: estree.Specifier[];
    }
  | {
      type: "global";
      kind: "let" | "const" | "var" | "missing";
    }
  | {
      type: "enclave";
      kind: "let" | "const" | "var" | "missing";
      spot: "local" | "global";
    };

export type MissingBinding =
  | { type: "global"; kind: "missing" }
  | { type: "enclave"; kind: "missing"; spot: "local" | "global" };

export type PresentBinding =
  | {
      type: "import";
      source: estree.Source;
      specifier: estree.Specifier | null;
    }
  | {
      type: "regular";
      kind: "let" | "const" | "var";
      exports: estree.Specifier[];
    }
  | {
      type: "global";
      kind: "let" | "const" | "var";
    }
  | {
      type: "enclave";
      kind: "let" | "const" | "var";
      spot: "local" | "global";
    };
