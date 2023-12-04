import type { WritableCache } from "../../cache.d.ts";

export type PrivateDescriptor =
  | {
      type: "method";
      method: WritableCache;
    }
  | {
      type: "accessor";
      get: WritableCache | null;
      set: WritableCache | null;
    };
