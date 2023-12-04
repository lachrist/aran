import type { WritableCache } from "../cache.d.ts";

export type RawFakeFrame = Record<estree.Variable, "var" | "let" | "const">;

export type FakeFrame = Record<
  estree.Variable,
  { kind: "var" | "let" | "const"; proxy: WritableCache }
>;
