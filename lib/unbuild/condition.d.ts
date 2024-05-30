import { Expression } from "./atom";

export type Condition = {
  test: Expression;
  exit: Expression;
};
