export type BlockFrame = {
  type: "block";
  kind:
    | "program"
    | "naked"
    | "then"
    | "else"
    | "while"
    | "try"
    | "catch"
    | "finally";
};
