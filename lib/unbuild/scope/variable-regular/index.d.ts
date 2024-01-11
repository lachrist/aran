export type LifespanBinding = {
  kind: "var" | "function";
  export: estree.Specifier[];
};

export type DeadzoneBinding = {
  kind: "let" | "const" | "class";
  export: estree.Specifier[];
};

export type ImportBinding = {
  kind: "import";
  source: estree.Source;
  specifier: estree.Specifier | null;
};

export type RegularBinding = ImportBinding | LifespanBinding | DeadzoneBinding;

export type RegularFrame = {
  type: "regular";
  record: Record<estree.Variable, RegularBinding>;
};
