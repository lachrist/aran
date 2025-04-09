import type { Tree } from "./tree.d.ts";

export type Sequence<W, X> = { write: Tree<W>; value: X };
