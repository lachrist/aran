import { Atom } from "./atom";

export type ClosureBody<A extends Atom> = {
  content: aran.Statement<A>[];
  completion: aran.Expression<A>;
};

export type ControlBody<A extends Atom> = {
  content: aran.Statement<A>[];
};
