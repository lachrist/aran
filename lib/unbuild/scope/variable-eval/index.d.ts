import type { Variable } from "../../../estree";
import type { Cache } from "../../cache";

export type EvalFrame = {
  type: "eval";
  frame: Cache;
  record: { [key in Variable]?: null };
};
