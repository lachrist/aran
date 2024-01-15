import { Cache } from "../../cache";

export type GlobalObjectBinding = {
  kind: "var" | "function";
};

export type GlobalObjectFrame = {
  type: "global-object";
  dynamic: Cache;
  static: { [k in estree.Variable]?: GlobalObjectBinding };
};
