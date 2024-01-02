export type ImportKind = "import";

export type DeadzoneKind = "let" | "const";

export type HoistingKind = "var";

export type Kind = ImportKind | DeadzoneKind | HoistingKind;

export type ImportEntry = [estree.Variable, ImportKind];

export type DeadzoneEntry = [estree.Variable, DeadzoneKind];

export type HoistingEntry = [estree.Variable, HoistingKind];

export type BlockEntry = ImportEntry | DeadzoneEntry | HoistingEntry;

export type HoistingBinding = {
  kind: HoistingKind;
  export: estree.Specifier[];
};

export type DeadzoneBinding = {
  kind: DeadzoneKind;
  export: estree.Specifier[];
};

export type ImportBinding = {
  kind: ImportKind;
  source: estree.Source;
  specifier: estree.Specifier | null;
};

export type BlockBinding = ImportBinding | HoistingBinding | DeadzoneBinding;

export type BlockFrame = {
  type: "block";
  record: Record<estree.Variable, BlockBinding>;
};
