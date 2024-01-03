import { ExpressionSequence } from "../sequence";

export type ArgumentList =
  | {
      type: "spread";
      values: ExpressionSequence[];
    }
  | {
      type: "concat";
      value: ExpressionSequence;
    };
