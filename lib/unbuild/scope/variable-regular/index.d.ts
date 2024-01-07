export type HoistingBinding = {
  kind: "var";
  export: estree.Specifier[];
};

export type DeadzoneBinding = {
  kind: "let" | "const";
  export: estree.Specifier[];
};

export type ImportBinding = {
  kind: "import";
  source: estree.Source;
  specifier: estree.Specifier | null;
};

export type RegularBinding = ImportBinding | HoistingBinding | DeadzoneBinding;

export type RegularFrame = {
  type: "regular";
  record: Record<estree.Variable, RegularBinding>;
};
