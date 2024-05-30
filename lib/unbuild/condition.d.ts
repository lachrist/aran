import { Atom } from "./atom";

export type Condition = {
  test: aran.Expression<Atom>;
  exit: aran.Expression<Atom>;
};
