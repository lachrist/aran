import type { WritableCache } from "../cache.d.ts";

export type Completion = null | {
  cache: WritableCache;
  root: estree.Program;
};
