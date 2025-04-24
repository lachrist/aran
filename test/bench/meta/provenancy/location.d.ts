import { Atom as GenericAtom } from "aran";

export type NodeHash = string & { __brand: "NodeHash" };
export type FilePath = string & { __brand: "FilePath" };
export type Atom = GenericAtom & { Tag: NodeHash };
