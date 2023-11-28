import { WritableCache } from "../../cache.mjs";

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
