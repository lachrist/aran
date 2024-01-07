import { Cache } from "../../cache";

export type GlobalRecordBinding = {
  kind: "let" | "const";
};

export type GlobalRecordFrame = {
  type: "global-record";
  dynamic: Cache;
  static: Record<estree.Variable, GlobalRecordBinding>;
};
