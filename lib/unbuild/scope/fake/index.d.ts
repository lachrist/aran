import { WritableCache } from "../../cache";

export type FakeKind = "const";

export type FakeBinding = {
  kind: FakeKind;
  proxy: WritableCache;
};

export type FakeFrame = {
  type: "fake";
  record: Record<estree.Variable, FakeBinding>;
};
