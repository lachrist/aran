import type { WritableCache } from "../../cache.d.ts";

export type RawFakeBinding = "var" | "let" | "const";

export type FakeBinding = {
  kind: "var" | "let" | "const";
  proxy: WritableCache;
};
