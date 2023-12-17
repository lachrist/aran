import { WritableCache } from "../../../cache";

export type FakeKind = "const";

export type FakeBinding = {
  kind: FakeKind;
  proxy: WritableCache;
};
