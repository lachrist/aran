import type { PrivateKeyName } from "estree-sentry";
import type { Cache, WritableCache } from "../../cache";
import type { Tree } from "../../../util/tree";
import type { Expression } from "../../atom";
import type { RootSort } from "../../sort";
import type { Mode } from "../../mode";

// Operation //

export type DefinePrivateOperation = {
  target: Expression;
  key: PrivateKeyName;
  value: Expression;
};

export type InitializePrivateOperation = {
  kind: "method" | "getter" | "setter";
  key: PrivateKeyName;
  value: Expression;
};

export type RegisterSingletonPrivateOperation = {
  target: Expression;
};

export type RegisterCollectionPrivateOperation = {
  target: Expression;
};

export type HasPrivateOperation = {
  target: Expression;
  key: PrivateKeyName;
};

export type GetPrivateOperation = {
  target: Expression;
  key: PrivateKeyName;
};

export type SetPrivateOperation = {
  target: Expression;
  key: PrivateKeyName;
  value: Expression;
};

// Scope //

export type PrivateScope = {
  root: RootSort;
  mode: Mode;
  private: Tree<PrivateFrame>;
};

// Frame //

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

export type RawPrivateFrame = [PrivateKeyName, PrivateKind][];

export type DryPrivateBinding =
  | DrySingletonPrivateBinding
  | DryCollectionPrivateBinding;

export type PrivateBinding = SingletonPrivateBinding | CollectionPrivateBinding;

export type PrivateFrame = {
  singleton: WritableCache;
  collection: Cache;
  record: { [k in PrivateKeyName]?: DryPrivateBinding };
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
