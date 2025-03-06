import type { Tree } from "../../../lib/util/tree";

export type StateWrite<S, W, X> = (state: S) => {
  state: S;
  write: Tree<W>;
  value: X;
};
