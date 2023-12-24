import { Meta } from "./meta";

export type Site<N> = {
  node: N;
  path: unbuild.Path;
  meta: Meta;
};

export type LeafSite = {
  path: unbuild.Path;
  meta: Meta;
};

export type VoidSite = {
  path: unbuild.Path;
};
