import type { Expression } from "../atom.d.ts";

export type Condition = {
  test: Expression;
  exit: Expression;
};
