import { Cache } from "../../cache";

export type GlobalObjectBinding = {
  kind: "var" | "function";
};

export type GlobalObjectFrame = {
  type: "global-object";
  dynamic: Cache;
  static: Record<estree.Variable, GlobalObjectBinding>;
};
