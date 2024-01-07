import { Cache } from "../../cache";

export type EvalBinding = {
  kind: "var";
};

export type EvalFrame = {
  type: "eval";
  record: {
    dynamic: Cache;
    static: Record<estree.Variable, EvalBinding>;
  };
};
