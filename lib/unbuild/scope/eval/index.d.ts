import { Cache } from "../../cache";

export type EvalKind = "var";

export type EvalBinding = {
  kind: EvalKind;
};

export type EvalFrame = {
  type: "eval";
  record: {
    dynamic: Cache;
    static: Record<estree.Variable, EvalBinding>;
  };
};
