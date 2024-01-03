import { ExpressionSequence } from "./sequence";

export type Condition = {
  test: aran.Expression<unbuild.Atom>;
  exit: aran.Expression<unbuild.Atom>;
};
