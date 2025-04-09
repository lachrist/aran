import type { Cache } from "../../../cache.d.ts";

export type WithFrame = {
  type: "with";
  record: Cache;
};

export type RawWithFrame = {
  record: Cache;
};
