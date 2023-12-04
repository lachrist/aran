import type { Cache, WritableCache } from "../../cache.d.ts";

export type PrivateCommon = {
  singleton: WritableCache;
  many: Cache;
};

export type RawPrivateDictionary<D> =
  | {
      type: "constant-singleton";
      descriptor: D;
    }
  | {
      type: "variable-singleton";
    }
  | {
      type: "constant-many";
      descriptor: D;
    }
  | {
      type: "variable-many";
    };

export type PrivateDictionary<D> =
  | {
      type: "constant-singleton";
      target: WritableCache;
      descriptor: D;
    }
  | {
      type: "variable-singleton";
      target: WritableCache;
      value: WritableCache;
    }
  | {
      type: "constant-many";
      weakset: Cache;
      descriptor: D;
    }
  | {
      type: "variable-many";
      weakmap: Cache;
    };

export type PrivateDictionarySetup<D> = {
  setup: aran.Effect<unbuild.Atom>[];
  dictionary: PrivateDictionarySetup<D>;
};

export type Private<D> = { [k in estree.PrivateKey]: PrivateDictionary<D> };

export type ListSetPrivateDescriptorEffect<D, C extends {}> = (
  site: {
    path: unbuild.Path;
  },
  context: {},
  options: {
    target: Cache;
    key: estree.PrivateKey;
    descriptor: D;
    value: Cache;
  },
) => aran.Effect<unbuild.Atom>[];

export type MakeGetPrivateDescriptorExpression<D, C extends {}> = (
  site: {
    path: unbuild.Path;
  },
  context: C,
  options: {
    target: Cache;
    key: estree.PrivateKey;
    descriptor: D;
  },
) => aran.Expression<unbuild.Atom>;

/**
 * @template D
 * @template {{}} C
 * @typedef {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: C,
 *   options: {
 *     target: Cache,
 *     key: estree.PrivateKey,
 *     descriptor: D,
 *   },
 * ) => aran.Expression<unbuild.Atom>} MakeGetPrivateDescriptorExpression
 */
