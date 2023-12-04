import type { Cache } from "../cache.d.ts";

export type Parametrization =
  | {
      type: "arrow" | "function";
    }
  | {
      type: "method";
      proto: Cache;
    }
  | {
      type: "constructor";
      derived: boolean;
      field: Cache;
    };
