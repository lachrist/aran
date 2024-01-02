export type ImportKind = "import";

export type DeadzoneKind = "let" | "const";

export type HoistingKind = "var";

export type Kind = ImportKind | DeadzoneKind | HoistingKind;

export type ImportEntry = [estree.Variable, ImportKind];

export type DeadzoneEntry = [estree.Variable, DeadzoneKind];

export type HoistingEntry = [estree.Variable, HoistingKind];

export type RegularEntry = ImportEntry | DeadzoneEntry | HoistingEntry;

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

export type RegularBinding = ImportBinding | HoistingBinding | DeadzoneBinding;

export type RegularFrame = {
  type: "regular";
  record: Record<estree.Variable, RegularBinding>;
};
