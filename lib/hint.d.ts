export type LookupHint = {
  type: "lookup";
  mode: "strict" | "sloppy";
  operation: "read" | "write" | "typeof" | "discard";
  variable: estree.Variable | null;
};

export type PrivateHint = {
  type: "private";
  operation: "has" | "get" | "set";
  key: estree.PrivateKey | null;
};

export type Hint = LookupHint | PrivateHint;
