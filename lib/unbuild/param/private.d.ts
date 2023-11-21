import { Cache, WritableCache } from "../cache.mjs";

export type PrivateDescriptor =
  | {
      type: "field";
      store: Cache;
    }
  | {
      type: "method";
      allow: Cache;
      method: WritableCache;
    }
  | {
      type: "accessor";
      allow: Cache;
      getter: WritableCache | null;
      setter: WritableCache | null;
    };

export type Private = { [k in estree.PrivateKey]: PrivateDescriptor };
