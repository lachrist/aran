import type { Cache, WritableCache } from "../../cache.js";

export type SingletonPrivateKind =
  | "singleton-method"
  | "singleton-getter"
  | "singleton-setter"
  | "singleton-property";

export type CollectionPrivateKind =
  | "collection-method"
  | "collection-getter"
  | "collection-setter"
  | "collection-property";

export type PrivateKind = SingletonPrivateKind | CollectionPrivateKind;

export type RawPrivateFrame = [estree.PrivateKey, PrivateKind][];

export type PrivateBinding = SingletonPrivateBinding | CollectionPrivateBinding;

export type DryPrivateBinding =
  | DrySingletonPrivateBinding
  | DryCollectionPrivateBinding;

export type PrivateFrame = {
  type: "private";
  singleton: WritableCache;
  collection: Cache;
  record: Record<estree.PrivateKey, DryPrivateBinding>;
};

// Singleton //

export type SingletonPrivateBinding =
  | {
      type: "singleton-method";
      target: WritableCache;
      method: WritableCache;
    }
  | {
      type: "singleton-accessor";
      target: WritableCache;
      getter: WritableCache | null;
      setter: WritableCache | null;
    }
  | {
      type: "singleton-property";
      target: WritableCache;
      value: WritableCache;
    };

export type DrySingletonPrivateBinding =
  | {
      type: "singleton-method";
      method: WritableCache;
    }
  | {
      type: "singleton-accessor";
      getter: WritableCache | null;
      setter: WritableCache | null;
    }
  | {
      type: "singleton-property";
      value: WritableCache;
    };

// Collection //

export type CollectionPrivateBinding =
  | {
      type: "collection-method";
      weakset: Cache;
      method: WritableCache;
    }
  | {
      type: "collection-accessor";
      weakset: Cache;
      getter: WritableCache | null;
      setter: WritableCache | null;
    }
  | {
      type: "collection-property";
      weakmap: Cache;
    };

export type DryCollectionPrivateBinding =
  | {
      type: "collection-method";
      method: WritableCache;
    }
  | {
      type: "collection-accessor";
      getter: WritableCache | null;
      setter: WritableCache | null;
    }
  | {
      type: "collection-property";
      weakmap: Cache;
    };
