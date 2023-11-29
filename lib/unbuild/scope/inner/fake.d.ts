import { WritableCache } from "./index.mjs";

export type RawFakeFrame = Record<estree.Variable, "var" | "let" | "const">;

export type FakeFrame = Record<
  estree.Variable,
  { kind: "var" | "let" | "const"; proxy: WritableCache }
>;
