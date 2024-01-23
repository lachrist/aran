export type IntrinsicClash = {
  type: "intrinsic";
  variable: estree.Variable;
};

export type EscapeClash = {
  type: "escape";
  escape: estree.Variable;
  variable: estree.Variable;
};

export type Clash = IntrinsicClash | EscapeClash;
