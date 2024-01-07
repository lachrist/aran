import { Cache } from "../../cache";

export type GlobalObjectBinding = {
  kind: "var";
};

export type GlobalObjectFrame = {
  type: "global-object";
  dynamic: Cache;
  static: Record<estree.Variable, GlobalObjectBinding>;
};
