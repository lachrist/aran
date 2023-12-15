export type BlockBinding = {
  kind: "let" | "const" | "var" | "callee";
  export: estree.Specifier[];
};
