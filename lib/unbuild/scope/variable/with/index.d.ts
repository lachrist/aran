import type { Mode } from "../../../mode";
import type { Cache } from "../../../cache";

export type DryWithFrame = {
  type: "with";
  record: Cache;
};

export type WithFrame = {
  mode: Mode;
  record: Cache;
};
