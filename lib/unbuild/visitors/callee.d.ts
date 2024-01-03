import { ExpressionSequence } from "../sequence";

export type Callee =
  | {
      type: "super";
    }
  | {
      type: "regular";
      function: ExpressionSequence;
      this: ExpressionSequence;
    };
