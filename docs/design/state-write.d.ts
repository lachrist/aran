import type { Tree } from "../../../lib/util/tree.d.ts";

export type StateWrite<S, W, X> = (state: S) => {
  state: S;
  write: Tree<W>;
  value: X;
};
