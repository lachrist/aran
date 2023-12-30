import { ExternalBinding, ExternalKind } from "./external";
import { FakeBinding, FakeKind } from "./fake";
import { ImportBinding, ImportKind } from "./import";
import { RegularBinding, RegularKind } from "./regular";

export type ExternalFrame = {
  type: "static-external";
  record: Record<estree.Variable, ExternalBinding>;
};

export type FakeFrame = {
  type: "static-fake";
  record: Record<estree.Variable, FakeBinding>;
};

export type ImportFrame = {
  type: "static-import";
  record: Record<estree.Variable, ImportBinding>;
};

export type RegularFrame = {
  type: "static-regular";
  record: Record<estree.Variable, RegularBinding>;
};

export type StaticFrame =
  | ExternalFrame
  | FakeFrame
  | ImportFrame
  | RegularFrame;
