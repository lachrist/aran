export type RegularEarlyError = {
  type: "regular";
  message: string;
  path: unbuild.Path;
};

export type DuplicateEarlyError = {
  type: "duplicate";
  frame: "aran.global" | "aran.record";
  variable: estree.Variable;
  path: unbuild.Path;
};

export type EarlyError = RegularEarlyError | DuplicateEarlyError;
