import { ExpressionSequence } from "../sequence";

export type Callee =
  | {
      type: "super";
    }
  | {
      type: "eval";
    }
  | {
      type: "regular";
      function: ExpressionSequence;
      this: ExpressionSequence;
    };
