type Arrow = "arrow" | "none" | "eval";

import { Cache } from "../../cache";

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
      derived: boolean;
      arrow: Arrow;
      self: Cache;
      field: Cache;
    };
