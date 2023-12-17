import { Cache } from "../../cache";

export type GlobalObjectFrame = {
  type: "dynamic-global-object";
  record: Cache;
};

export type GlobalRecordFrame = {
  type: "dynamic-global-record";
  record: Cache;
};

export type WithFrame = {
  type: "dynamic-with";
  record: Cache;
};

export type DynamicFrame = GlobalObjectFrame | GlobalRecordFrame | WithFrame;
