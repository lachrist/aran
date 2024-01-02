import { WritableCache } from "../../cache";

export type FakeKind = "let" | "const" | "var" | "val";

export type FakeEntry = [estree.Variable, FakeKind];

export type FakeBinding = {
  kind: FakeKind;
  proxy: WritableCache;
};

export type FakeFrame = {
  type: "fake";
  record: Record<estree.Variable, FakeBinding>;
};
