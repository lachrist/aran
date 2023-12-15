import { Cache } from "../../cache";

export type GlobalObjectFrame = {
  type: "global-object";
  cache: Cache;
};

export type GlobalRecordFrame = {
  type: "global-record";
  cache: Cache;
};

export type WithFrame = {
  type: "with";
  cache: Cache;
};

export type DynamicFrame = GlobalObjectFrame | GlobalRecordFrame | WithFrame;
