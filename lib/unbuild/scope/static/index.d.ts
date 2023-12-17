import { ExternalBinding } from "./external";
import { FakeBinding } from "./fake";
import { GlobalObjectBinding } from "./global-object";
import { GlobalRecordBinding } from "./global-record";
import { ImportBinding } from "./import";
import { RegularBinding } from "./regular";

export type ExternalFrame = {
  type: "static-external";
  record: Record<estree.Variable, ExternalBinding>;
};

export type FakeFrame = {
  type: "static-fake";
  record: Record<estree.Variable, FakeBinding>;
};

export type GlobalObjectFrame = {
  type: "static-global-object";
  record: Record<estree.Variable, GlobalObjectBinding>;
};

export type GlobalRecordFrame = {
  type: "static-global-record";
  record: Record<estree.Variable, GlobalRecordBinding>;
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
  | GlobalObjectFrame
  | GlobalRecordFrame
  | ImportFrame
  | RegularFrame;
