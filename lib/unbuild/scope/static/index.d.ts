import { BlockBinding } from "./block";
import { ExternalBinding } from "./external";
import { FakeBinding } from "./fake";
import { GlobalObjectBinding } from "./global-object";
import { GlobalRecordBinding } from "./global-record";
import { ImportBinding } from "./import";

export type BlockFrame = {
  type: "block";
  record: Record<estree.Variable, BlockBinding>;
};

export type ImportFrame = {
  type: "import";
  record: Record<estree.Variable, ImportBinding>;
};

export type FakeFrame = {
  type: "fake";
  record: Record<estree.Variable, FakeBinding>;
};

export type ExternalFrame = {
  type: "external";
  record: Record<estree.Variable, ExternalBinding>;
};

export type GlobalRecordFrame = {
  type: "global-record";
  record: Record<estree.Variable, GlobalRecordBinding>;
};

export type GlobalObjectFrame = {
  type: "global-object";
  record: Record<estree.Variable, GlobalObjectBinding>;
};

export type StaticFrame =
  | GlobalRecordFrame
  | GlobalObjectFrame
  | BlockFrame
  | ImportFrame
  | FakeFrame
  | ExternalFrame;
