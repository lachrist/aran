import { ExternalBinding, ExternalKind } from "./external";
import { FakeBinding, FakeKind } from "./fake";
import { GlobalObjectBinding, GlobalObjectKind } from "./global-object";
import { GlobalRecordBinding, GlobalRecordKind } from "./global-record";
import { ImportBinding, ImportKind } from "./import";
import { RegularBinding, RegularKind } from "./regular";

// export type RawExternalFrame = {
//   type: "static-external";
//   record: Record<string, ExternalKind>;
// };

// export type RawGlobalObjectFrame = {
//   type: "static-global-object";
//   record: Record<string, GlobalObjectKind>;
// };

// export type RawGlobalRecordFrame = {
//   type: "static-global-record";
//   record: Record<string, GlobalRecordKind>;
// };

// export type RawImportFrame = {
//   type: "static-import";
//   record: Record<string, ImportKind>;
// };

// export type RawRegularFrame = {
//   type: "static-regular";
//   record: Record<string, RegularKind>;
//   exports: Record<estree.Variable, estree.Specifier[]>;
// };

// export type RawStaticFrame =
//   | RawExternalFrame
//   | RawGlobalObjectFrame
//   | RawGlobalRecordFrame
//   | RawImportFrame
//   | RawRegularFrame;

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
