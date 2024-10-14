import type { Tree } from "./tree";

export type Sequence<W, X> = { write: Tree<W>; value: X };
