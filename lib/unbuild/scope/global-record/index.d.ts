import { Cache } from "../../cache";

export type GlobalRecordKind = "let" | "const";

export type GlobalRecordBinding = {
  kind: GlobalRecordKind;
};

export type GlobalRecordFrame = {
  type: "global-record";
  dynamic: Cache;
  static: Record<estree.Variable, GlobalRecordBinding>;
};
