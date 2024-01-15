import { Cache } from "../../cache";

export type GlobalRecordBinding = {
  kind: "let" | "const" | "class";
};

export type GlobalRecordFrame = {
  type: "global-record";
  dynamic: Cache;
  static: { [k in estree.Variable]?: GlobalRecordBinding };
};
