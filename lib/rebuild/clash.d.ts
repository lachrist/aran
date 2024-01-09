export type EscapeClash = {
  type: "escape";
  variable: estree.Variable;
  escape: estree.Variable;
};

export type IntrinsicClash = {
  type: "intrinsic";
  variable: estree.Variable;
};

export type Clash = EscapeClash | IntrinsicClash;
