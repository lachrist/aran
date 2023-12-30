import { Cache, WritableCache } from "../../cache";

export type ClosureKind = "var";

export type ClosureBinding = {
  kind: ClosureKind;
};

export type BlockKind = "let" | "const";

export type BlockBinding = {
  kind: BlockKind;
};

export type GlobalObjectFrame = {
  type: "dynamic-global-object";
  dynamic: Cache;
  static: Record<estree.Variable, ClosureBinding>;
};

export type GlobalRecordFrame = {
  type: "dynamic-global-record";
  dynamic: Cache;
  static: Record<estree.Variable, BlockBinding>;
};

export type EvalFrame = {
  type: "dynamic-eval";
  dynamic: Cache;
  static: Record<estree.Variable, ClosureBinding>;
};

export type WithFrame = {
  type: "dynamic-with";
  dynamic: Cache;
};

export type DynamicFrame = GlobalObjectFrame | GlobalRecordFrame | WithFrame;
