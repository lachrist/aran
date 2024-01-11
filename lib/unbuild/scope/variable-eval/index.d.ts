import { Cache } from "../../cache";

export type EvalBinding = {
  kind: "var" | "function";
};

export type EvalFrame = {
  type: "eval";
  record: {
    dynamic: Cache;
    static: Record<estree.Variable, EvalBinding>;
  };
};
