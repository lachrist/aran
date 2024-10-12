import type { Tree } from "./util/tree";

export type StateWrite<S, W, X> = (state: S) => {
  state: S;
  write: Tree<W>;
  value: X;
};
