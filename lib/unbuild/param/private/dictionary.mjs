import { makeSyntaxErrorExpression } from "../../syntax-error.mjs";
import {
  hasOwn,
  map,
  mapMaybe,
  mapSuccess,
  pairup,
} from "../../../util/index.mjs";
import { AranError, AranTypeError } from "../../../error.mjs";
import {
  makeBinaryExpression,
  makeThrowErrorExpression,
} from "../../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeConstructExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadParameterExpression,
} from "../../node.mjs";
import {
  makeReadCacheExpression,
  listWriteCacheEffect,
  mapSetup,
  sequenceSetup,
  setupCache,
  bindSetup,
} from "../../cache.mjs";
import { makeIsProperObjectExpression } from "../../helper.mjs";
import { splitMeta, zipMeta } from "../../mangle.mjs";

const {
  Reflect: { defineProperty },
} = globalThis;

/**
 * @template V
 * @template E
 * @typedef {import("../../../util/outcome.mjs").Outcome<V, E>} Outcome
 */

/**
 * @typedef {import("../../cache.mjs").Cache} Cache
 */

/**
 * @typedef {import("../../cache.mjs").WritableCache} WritableCache
 */

/**
 * @template V
 * @typedef {import("../../cache.mjs").Setup<V>} Setup
 */

/**
 * @typedef {(
 *   import("./dictionary.js").PrivateCommon
 * )} PrivateCommon
 */

/**
 * @template D
 * @typedef {(
 *   import("./dictionary.js").PrivateDictionary<D>
 * )} PrivateDictionary
 */

/**
 * @template D
 * @typedef {(
 *   import("./dictionary.js").RawPrivateDictionary<D>
 * )} RawPrivateDictionary
 */

/**
 * @template D
 * @typedef {(
 *   import("./dictionary.js").PrivateDictionarySetup<D>
 * )} PrivateDictionarySetup
 */

/**
 * @template D
 * @typedef {(
 *   import("./dictionary.js").Private<D>
 * )} Private
 */

/**
 * @type {<V>(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     target: Cache,
 *     dictionary: PrivateDictionary<V>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 * }
 */
const makeAllowExpression = ({ path }, _context, { dictionary, target }) => {
  switch (dictionary.type) {
    case "constant-singleton": {
      return makeBinaryExpression(
        "===",
        makeReadCacheExpression(dictionary.target, path),
        makeReadCacheExpression(target, path),
        path,
      );
    }
    case "variable-singleton": {
      return makeBinaryExpression(
        "===",
        makeReadCacheExpression(dictionary.target, path),
        makeReadCacheExpression(target, path),
        path,
      );
    }
    case "constant-many": {
      return makeApplyExpression(
        makeIntrinsicExpression("WeakSet.prototype.has", path),
        makeReadCacheExpression(dictionary.weakset, path),
        [makeReadCacheExpression(target, path)],
        path,
      );
    }
    case "variable-many": {
      return makeApplyExpression(
        makeIntrinsicExpression("WeakMap.prototype.has", path),
        makeReadCacheExpression(dictionary.weakmap, path),
        [makeReadCacheExpression(target, path)],
        path,
      );
    }
    default: {
      throw new AranTypeError("invalid private dictionary", dictionary);
    }
  }
};

/////////////
// declare //
/////////////

/**
 * @type {<D>(
 *   old_dictionary: PrivateDictionary<D>,
 *   new_dictionary: PrivateDictionary<D>,
 *   overwritePrivateDescriptor: (
 *     old_descriptor: D,
 *     new_descriptor: D,
 *   ) => D | null,
 * ) => PrivateDictionary<D> | null}
 */
const overwritePrivateDictionary = (
  old_dictionary,
  new_dictionary,
  overwritePrivateDescriptor,
) => {
  if (
    old_dictionary.type === "constant-singleton" &&
    new_dictionary.type === "constant-singleton"
  ) {
    return mapMaybe(
      overwritePrivateDescriptor(
        old_dictionary.descriptor,
        new_dictionary.descriptor,
      ),
      (descriptor) => ({
        type: "constant-singleton",
        target: new_dictionary.target,
        descriptor,
      }),
    );
  } else if (
    old_dictionary.type === "constant-many" &&
    new_dictionary.type === "constant-many"
  ) {
    return mapMaybe(
      overwritePrivateDescriptor(
        old_dictionary.descriptor,
        new_dictionary.descriptor,
      ),
      (descriptor) => ({
        type: "constant-many",
        weakset: new_dictionary.weakset,
        descriptor,
      }),
    );
  } else {
    return null;
  }
};

/* eslint-disable local/no-impure */
/**
 * @type {<D>(
 *   entries: [
 *     key: estree.PrivateKey,
 *     dictionary: PrivateDictionary<D>
 *   ][],
 *   overwritePrivateDescriptor: (
 *     old_descriptor: D,
 *     new_descriptor: D,
 *   ) => D | null,
 * ) => Outcome<
 *   { [k in estree.PrivateKey]: PrivateDictionary<D> },
 *   string
 * >}
 */
const combinePrivateDictionary = (entries, overwritePrivateDescriptor) => {
  /** @type {{ [k in estree.PrivateKey]: PrivateDictionary<any> }} */
  const record = {};
  for (const [key, new_dictionary] of entries) {
    if (hasOwn(record, key)) {
      const old_dictionary = record[key];
      const dictionary = overwritePrivateDictionary(
        old_dictionary,
        new_dictionary,
        overwritePrivateDescriptor,
      );
      if (dictionary === null) {
        return {
          type: "failure",
          error: `Duplicate private field #${key}`,
        };
      } else {
        defineProperty(record, key, {
          value: dictionary,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    } else {
      defineProperty(record, key, {
        value: new_dictionary,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
  }
  return { type: "success", value: record };
};
/* eslint-enable local/no-impure */

/**
 * @type {<D>(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {},
 *   options: {
 *     dictionary: RawPrivateDictionary<D>,
 *     common: PrivateCommon,
 *   },
 * ) => Setup<PrivateDictionary<D>>}
 */
const cookPrivateDictionary = (
  { path, meta },
  _context,
  { dictionary, common },
) => {
  switch (dictionary.type) {
    case "constant-singleton": {
      return {
        setup: [],
        value: {
          type: "constant-singleton",
          target: common.singleton,
          descriptor: dictionary.descriptor,
        },
      };
    }
    case "variable-singleton": {
      return mapSetup(
        setupCache("writable", makeIntrinsicExpression("aran.deadzone", path), {
          path,
          meta,
        }),
        (value) => ({
          type: "variable-singleton",
          target: common.singleton,
          value,
        }),
      );
    }
    case "constant-many": {
      return {
        setup: [],
        value: {
          type: "constant-many",
          weakset: common.many,
          descriptor: dictionary.descriptor,
        },
      };
    }
    case "variable-many": {
      return mapSetup(
        setupCache(
          "constant",
          makeConstructExpression(
            makeIntrinsicExpression("WeakMap", path),
            [],
            path,
          ),
          {
            path,
            meta,
          },
        ),
        (weakmap) => ({
          type: "variable-many",
          weakmap,
        }),
      );
    }
    default: {
      throw new AranTypeError("invalid private dictionary", dictionary);
    }
  }
};

/**
 * @type {<D, C extends { private: Private<D> }>(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: C,
 *   options: {
 *     entries: [
 *       estree.PrivateKey,
 *       RawPrivateDictionary<D>,
 *     ][],
 *     overwritePrivateDescriptor: (
 *       old_descriptor: D,
 *       new_descriptor: D,
 *     ) => D | null,
 *   },
 * ) => Setup<Outcome<{
 *   context: C,
 *   common: PrivateCommon,
 * }, string>>}
 */
export const declarePrivate = (
  { path, meta },
  context,
  { entries, overwritePrivateDescriptor },
) => {
  const metas = splitMeta(meta, ["singleton", "many", "cook"]);
  return bindSetup(
    setupCache("writable", makeIntrinsicExpression("aran.deadzone", path), {
      path,
      meta: metas.singleton,
    }),
    (singleton) =>
      bindSetup(
        setupCache(
          "constant",
          makeConstructExpression(
            makeIntrinsicExpression("WeakSet", path),
            [],
            path,
          ),
          { path, meta: metas.many },
        ),
        (many) => {
          const common = { singleton, many };
          return mapSetup(
            sequenceSetup(
              map(zipMeta(metas.cook, entries), ([meta, [key, dictionary]]) => {
                const setup = cookPrivateDictionary({ path, meta }, context, {
                  dictionary,
                  common,
                });
                return mapSetup(setup, (dictionary) => pairup(key, dictionary));
              }),
            ),
            (entries) =>
              mapSuccess(
                combinePrivateDictionary(entries, overwritePrivateDescriptor),
                (dictionaries) => ({
                  common,
                  context: {
                    ...context,
                    private: {
                      ...context.private,
                      ...dictionaries,
                    },
                  },
                }),
              ),
          );
        },
      ),
  );
};

//////////////
// Register //
//////////////

/**
 * @type {<D>(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: { private: Private<D> },
 *   options: {
 *     common: PrivateCommon,
 *     target: Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listRegisterPrivateSingletonEffect = (
  { path },
  _context,
  { common, target },
) => [
  makeConditionalEffect(
    makeBinaryExpression(
      "===",
      makeReadCacheExpression(common.singleton, path),
      makeIntrinsicExpression("aran.deadzone", path),
      path,
    ),
    listWriteCacheEffect(
      common.singleton,
      makeReadCacheExpression(target, path),
      path,
    ),
    [
      makeExpressionEffect(
        makeThrowErrorExpression(
          "TypeError",
          `Duplicate singleton private registration`,
          path,
        ),
        path,
      ),
    ],
    path,
  ),
];

/**
 * @type {<D>(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: { private: Private<D> },
 *   options: {
 *     common: PrivateCommon,
 *     target: Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listRegisterPrivateManyEffect = (
  { path },
  _context,
  { common, target },
) => [
  makeConditionalEffect(
    makeApplyExpression(
      makeIntrinsicExpression("WeakSet.prototype.has", path),
      makeReadCacheExpression(common.many, path),
      [makeReadCacheExpression(target, path)],
      path,
    ),
    [
      makeExpressionEffect(
        makeThrowErrorExpression(
          "TypeError",
          "Duplicate private registration",
          path,
        ),
        path,
      ),
    ],
    [
      makeExpressionEffect(
        makeApplyExpression(
          makeIntrinsicExpression("WeakSet.prototype.add", path),
          makeReadCacheExpression(common.many, path),
          [makeReadCacheExpression(target, path)],
          path,
        ),
        path,
      ),
    ],
    path,
  ),
];

////////////////
// Initialize //
////////////////

/**
 * @type {<D, C extends { private: Private<D> }>(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: C,
 *   options: {
 *     target: Cache | null,
 *     key: estree.PrivateKey,
 *     value: Cache,
 *     listInitializePrivateDescriptorEffect: (
 *       site: {
 *         path: unbuild.Path,
 *       },
 *       context: C,
 *       options: {
 *         descriptor: D,
 *         value: Cache,
 *       },
 *     ) => aran.Effect<unbuild.Atom>[],
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listInitializePrivateEffect = (
  { path },
  context,
  { target, key, value, listInitializePrivateDescriptorEffect },
) => {
  if (hasOwn(context.private, key)) {
    const dictionary = context.private[key];
    if (
      dictionary.type === "constant-singleton" ||
      dictionary.type === "constant-many"
    ) {
      return listInitializePrivateDescriptorEffect({ path }, context, {
        descriptor: dictionary.descriptor,
        value,
      });
    } else if (dictionary.type === "variable-singleton") {
      return [
        makeConditionalEffect(
          makeBinaryExpression(
            "===",
            makeReadCacheExpression(dictionary.value, path),
            makeIntrinsicExpression("aran.deadzone", path),
            path,
          ),
          listWriteCacheEffect(
            dictionary.value,
            makeReadCacheExpression(value, path),
            path,
          ),
          [
            makeExpressionEffect(
              makeThrowErrorExpression(
                "TypeError",
                `Duplicate initialization of writable private singleton #${key}`,
                path,
              ),
              path,
            ),
          ],
          path,
        ),
      ];
    } else if (dictionary.type === "variable-many") {
      if (target === null) {
        throw new AranError(
          "missing a target to initialize private dictionary",
          { key, dictionary },
        );
      } else {
        return [
          makeConditionalEffect(
            makeApplyExpression(
              makeIntrinsicExpression("WeakMap.prototype.has", path),
              makeReadCacheExpression(dictionary.weakmap, path),
              [makeReadCacheExpression(target, path)],
              path,
            ),
            [
              makeExpressionEffect(
                makeThrowErrorExpression(
                  "TypeError",
                  `Duplicate initialization of writable private dictionary #${key}`,
                  path,
                ),
                path,
              ),
            ],
            [
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("WeakMap.prototype.set", path),
                  makeReadCacheExpression(dictionary.weakmap, path),
                  [
                    makeReadCacheExpression(target, path),
                    makeReadCacheExpression(value, path),
                  ],
                  path,
                ),
                path,
              ),
            ],
            path,
          ),
        ];
      }
    } else {
      throw new AranTypeError("invalid private dictionary", dictionary);
    }
  } else {
    throw new AranError("missing a private dictionary", { key });
  }
};

/////////////////
// private.has //
/////////////////

/**
 * @type {<V>(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     private: Private<V>,
 *   },
 *   options: {
 *     target: Cache,
 *     key: estree.PrivateKey,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeHasPrivateExpression = (
  { path },
  context,
  { target, key },
) => {
  if (hasOwn(context.private, key)) {
    const dictionary = context.private[key];
    return makeConditionalExpression(
      makeIsProperObjectExpression({ path }, { value: target }),
      makeAllowExpression({ path }, context, {
        target,
        dictionary,
      }),
      makeThrowErrorExpression(
        "TypeError",
        "Cannot access private property of non-object",
        path,
      ),
      path,
    );
  } else {
    switch (context.root.situ) {
      case "global": {
        return makeSyntaxErrorExpression(
          `Missing private member #${key}`,
          path,
        );
      }
      case "local": {
        return makeApplyExpression(
          makeReadParameterExpression("private.has", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeReadCacheExpression(target, path),
            makePrimitiveExpression(key, path),
          ],
          path,
        );
      }
      default: {
        throw new AranTypeError("invalid context.root.situ", context.root.situ);
      }
    }
  }
};

/////////
// get //
/////////

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

/**
 * @type {<D, C extends {}>(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: C,
 *   options: {
 *     target: Cache,
 *     key: estree.PrivateKey,
 *     dictionary: PrivateDictionary<D>,
 *     makeGetPrivateDescriptorExpression:
 *       MakeGetPrivateDescriptorExpression<D, C>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeGetAllowExpression = (
  { path },
  context,
  { target, key, dictionary, makeGetPrivateDescriptorExpression },
) => {
  switch (dictionary.type) {
    case "constant-singleton": {
      return makeGetPrivateDescriptorExpression({ path }, context, {
        target,
        key,
        descriptor: dictionary.descriptor,
      });
    }
    case "variable-singleton": {
      return makeReadCacheExpression(dictionary.value, path);
    }
    case "constant-many": {
      return makeGetPrivateDescriptorExpression({ path }, context, {
        target,
        key,
        descriptor: dictionary.descriptor,
      });
    }
    case "variable-many": {
      return makeApplyExpression(
        makeIntrinsicExpression("WeakMap.prototype.get", path),
        makeReadCacheExpression(dictionary.weakmap, path),
        [makeReadCacheExpression(target, path)],
        path,
      );
    }
    default: {
      throw new AranTypeError("invalid private dictionary", dictionary);
    }
  }
};

/**
 * @type {<D, C extends {
 *   root: {
 *     situ: "global" | "local",
 *   },
 *   private: Private<D>,
 * }>(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: C,
 *   options: {
 *     target: Cache,
 *     key: estree.PrivateKey,
 *     makeGetPrivateDescriptorExpression:
 *       MakeGetPrivateDescriptorExpression<D, C>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGetPrivateExpression = (
  { path },
  context,
  { target, key, makeGetPrivateDescriptorExpression },
) => {
  if (hasOwn(context.private, key)) {
    const dictionary = context.private[key];
    return makeConditionalExpression(
      makeAllowExpression({ path }, context, {
        target,
        dictionary,
      }),
      makeGetAllowExpression({ path }, context, {
        target,
        key,
        dictionary,
        makeGetPrivateDescriptorExpression,
      }),
      makeThrowErrorExpression(
        "TypeError",
        `Cannot get private member #${key}`,
        path,
      ),
      path,
    );
  } else {
    switch (context.root.situ) {
      case "global": {
        return makeSyntaxErrorExpression(
          `Missing private member #${key}`,
          path,
        );
      }
      case "local": {
        return makeApplyExpression(
          makeReadParameterExpression("private.get", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeReadCacheExpression(target, path),
            makePrimitiveExpression(key, path),
          ],
          path,
        );
      }
      default: {
        throw new AranTypeError("invalid context.root.situ", context.root.situ);
      }
    }
  }
};

/////////////////
// private.set //
/////////////////

/**
 * @template D
 * @template {{}} C
 * @typedef {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     target: Cache,
 *     key: estree.PrivateKey,
 *     descriptor: D,
 *     value: Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]} ListSetPrivateDescriptorEffect
 */

/**
 * @type {<D, C extends {}>(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: C,
 *   options: {
 *     target: Cache,
 *     key: estree.PrivateKey,
 *     dictionary: PrivateDictionary<D>,
 *     value: Cache,
 *     listSetPrivateDescriptorEffect: ListSetPrivateDescriptorEffect<D, C>,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listSetAllowEffect = (
  { path },
  context,
  { target, key, value, dictionary, listSetPrivateDescriptorEffect },
) => {
  switch (dictionary.type) {
    case "constant-singleton": {
      return listSetPrivateDescriptorEffect({ path }, context, {
        target,
        key,
        value,
        descriptor: dictionary.descriptor,
      });
    }
    case "variable-singleton": {
      return listWriteCacheEffect(
        dictionary.value,
        makeReadCacheExpression(value, path),
        path,
      );
    }
    case "constant-many": {
      return listSetPrivateDescriptorEffect({ path }, context, {
        target,
        key,
        value,
        descriptor: dictionary.descriptor,
      });
    }
    case "variable-many": {
      return [
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("WeakMap.prototype.set", path),
            makeReadCacheExpression(dictionary.weakmap, path),
            [
              makeReadCacheExpression(target, path),
              makeReadCacheExpression(value, path),
            ],
            path,
          ),
          path,
        ),
      ];
    }
    default: {
      throw new AranTypeError("invalid private dictionary", dictionary);
    }
  }
};

/**
 * @type {<D, C extends {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     private: Private<D>,
 *   }>(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: C,
 *   options: {
 *     target: Cache,
 *     key: estree.PrivateKey,
 *     value: Cache,
 *     listSetPrivateDescriptorEffect: ListSetPrivateDescriptorEffect<D, C>,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listSetPrivateEffect = (
  { path },
  context,
  { target, key, value, listSetPrivateDescriptorEffect },
) => {
  if (hasOwn(context.private, key)) {
    const dictionary = context.private[key];
    return [
      makeConditionalEffect(
        makeAllowExpression({ path }, context, {
          target,
          dictionary,
        }),
        listSetAllowEffect({ path }, context, {
          target,
          key,
          value,
          dictionary,
          listSetPrivateDescriptorEffect,
        }),
        [
          makeExpressionEffect(
            makeThrowErrorExpression(
              "TypeError",
              `Cannot set private member #${key}`,
              path,
            ),
            path,
          ),
        ],
        path,
      ),
    ];
  } else {
    switch (context.root.situ) {
      case "global": {
        return [
          makeExpressionEffect(
            makeSyntaxErrorExpression(`Missing private member #${key}`, path),
            path,
          ),
        ];
      }
      case "local": {
        return [
          makeExpressionEffect(
            makeApplyExpression(
              makeReadParameterExpression("private.set", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeReadCacheExpression(target, path),
                makePrimitiveExpression(key, path),
                makeReadCacheExpression(value, path),
              ],
              path,
            ),
            path,
          ),
        ];
      }
      default: {
        throw new AranTypeError("invalid context.root.situ", context.root.situ);
      }
    }
  }
};
