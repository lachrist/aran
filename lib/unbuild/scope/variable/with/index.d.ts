import type { Cache } from "../../../cache";

export type WithFrame = {
  type: "with";
  record: Cache;
};
