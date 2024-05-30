import { Expression } from "./atom";

export type ArgumentList =
  | {
      type: "spread";
      values: Expression[];
    }
  | {
      type: "concat";
      value: Expression;
    };
