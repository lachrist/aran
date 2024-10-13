import type { Tree } from "./util/tree";

export type Sequence<W, X> = { write: Tree<W>; value: X };
