type Arrow = "arrow" | "none" | "eval";
import { Cache } from "../../cache.mjs";

export type Closure =
  | {
      type: "none";
      arrow: Arrow;
    }
  | {
      type: "function";
      arrow: Arrow;
    }
  | {
      type: "method";
      arrow: Arrow;
      proto: Cache;
    }
  | {
      type: "constructor";
      arrow: Arrow;
      self: Cache;
      super: Cache | null;
      field: Cache | null;
    };
