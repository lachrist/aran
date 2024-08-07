import type { Path } from "../path";
import type { Meta } from "./meta";

export type Site<N> = {
  node: N;
  path: Path;
  meta: Meta;
};

export type LeafSite = {
  path: Path;
  meta: Meta;
};

export type VoidSite = {
  path: Path;
};
