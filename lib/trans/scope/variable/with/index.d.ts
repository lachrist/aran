import type { Cache } from "../../../cache";

export type WithFrame = {
  type: "with";
  record: Cache;
};

export type RawWithFrame = {
  record: Cache;
};
