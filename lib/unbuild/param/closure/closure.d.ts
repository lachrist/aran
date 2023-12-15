import type { Cache } from "../../cache.d.ts";

export type Closure =
  | {
      type: "none";
    }
  | {
      type: "function";
    }
  | {
      type: "method";
      proto: Cache;
    }
  | {
      type: "constructor";
      derived: boolean;
      self: Cache;
      field: Cache;
    };
