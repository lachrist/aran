import type { Cache } from "../../../cache";

export type EvalFrame = {
  type: "eval";
  record: Cache;
};
