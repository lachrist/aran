export type ImportClash = {
  type: "import";
  variable: estree.Variable;
  escape: estree.Variable;
};

export type ExportClash = {
  type: "export";
  variable: estree.Variable;
  escape: estree.Variable;
};

export type IntrinsicClash = {
  type: "intrinsic";
  variable: estree.Variable;
};

export type Clash = ImportClash | ExportClash | IntrinsicClash;
