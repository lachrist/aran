export type ImportKind = "import";

export type ImportBinding = {
  kind: ImportKind;
  source: estree.Source;
  specifier: estree.Specifier | null;
};
