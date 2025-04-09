import type { Expression } from "./atom.d.ts";

export type ArgumentList =
  | {
      type: "spread";
      values: Expression[];
    }
  | {
      type: "concat";
      value: Expression;
    };
