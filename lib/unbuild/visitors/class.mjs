import {
  AranTypeError,
  filter,
  filterOut,
  flatMap,
  guard,
  map,
  reduce,
  zip,
} from "../../util/index.mjs";
import {
  makeAccessorDescriptorExpression,
  makeBinaryExpression,
  makeDataDescriptorExpression,
  makeGetExpression,
  makeLongSequenceExpression,
  makeObjectExpression,
  makeThrowErrorExpression,
} from "../intrinsic.mjs";
import { splitMeta } from "../mangle.mjs";
import {
  makeApplyExpression,
  makeClosureBlock,
  makeConditionalExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeFunctionExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
} from "../node.mjs";
import {
  listDeclarePrivateEffect,
  listDefinePrivateEffect,
} from "../private.mjs";
import {
  makeScopeClosureBlock,
  makeScopeParameterExpression,
} from "../scope/index.mjs";
import { unbuildExpression, unbuildNameExpression } from "./expression.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildKeyExpression } from "./key.mjs";
import { listBodyStatement } from "./statement.mjs";
import { drill, drillAll, drillArray } from "../../drill.mjs";
import { hasValue, hasSuperClass } from "../predicate.mjs";
import { makeSyntaxErrorExpression } from "../report.mjs";
import {
  makeEnumCacheExpression,
  makeInitCacheExpression,
  makeInitCacheUnsafe,
  makeReadCacheExpression,
  makeWriteCacheEffect,
} from "../cache.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

/**
 * @typedef {(
 *   context: import("../context.d.ts").Context,
 * ) => aran.Effect<unbuild.Atom>[]} Callback
 */

/**
 * @typedef {{
 *   head: aran.Effect<unbuild.Atom>[],
 *   body: aran.Effect<unbuild.Atom>[],
 *   static: Callback[],
 *   instance: Callback[],
 * }} Element
 */

/**
 * @type {(
 *   kind: "method" | "get" | "set",
 *   value: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeMethodDescriptor = (kind, value, path) =>
  kind === "method"
    ? makeDataDescriptorExpression(
        {
          value,
          writable: true,
          enumerable: false,
          configurable: true,
        },
        path,
      )
    : makeAccessorDescriptorExpression(
        {
          get: kind === "get" ? value : null,
          set: kind === "set" ? value : null,
          enumerable: makePrimitiveExpression(false, path),
          configurable: makePrimitiveExpression(true, path),
        },
        path,
      );

/** @type {(pair: {node: estree.Node}) => boolean} */
const isConstructorPair = ({ node }) =>
  node.type === "MethodDefinition" && node.kind === "constructor";

/**
 * @type {(
 *   pairs: {
 *     node:
 *       | estree.MethodDefinition
 *       | estree.PropertyDefinition
 *       | estree.StaticBlock,
 *     path: unbuild.Path,
 *   }[],
 * ) => {
 *   constructors: {
 *     node: estree.MethodDefinition & { kind: "constructor" },
 *     path: unbuild.Path,
 *   }[],
 *   definitions: ({
 *     node:
 *       | estree.MethodDefinition & { kind: "method" | "get" | "set" }
 *       | estree.PropertyDefinition
 *       | estree.StaticBlock,
 *     path: unbuild.Path,
 *   })[],
 * }}
 */
const extractConstructor = (pairs) => ({
  constructors: /** @type {any[]} */ (filter(pairs, isConstructorPair)),
  definitions: /** @type {any[]} */ (filterOut(pairs, isConstructorPair)),
});

/**
 * @type {(
 *   pair: {
 *     node: estree.PropertyDefinition,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *     key: import("../cache.mjs").Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listFieldEffect = ({ node, path }, context, { meta, key }) => {
  const value = hasValue(node)
    ? unbuildNameExpression(drill({ node, path }, "value"), context, {
        meta,
        name: makeReadCacheExpression(key, path),
      })
    : makePrimitiveExpression({ undefined: null }, path);
  const descriptor = makeDataDescriptorExpression(
    {
      value,
      writable: true,
      enumerable: true,
      configurable: true,
    },
    path,
  );
  return node.key.type === "PrivateIdentifier"
    ? listDefinePrivateEffect(
        context,
        makeScopeParameterExpression(context, "this", path),
        /** @type {estree.PrivateKey} */ (node.key.name),
        descriptor,
        path,
      )
    : [
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.defineProperty", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeScopeParameterExpression(context, "this", path),
              makeReadCacheExpression(key, path),
              descriptor,
            ],
            path,
          ),
          path,
        ),
      ];
};

/**
 * @type {(
 *   pair: {
 *     node:
 *       | estree.StaticBlock
 *       | estree.PropertyDefinition
 *       | estree.MethodDefinition & { kind: "method" | "get" | "set" },
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *     constructor: import("../cache.mjs").Cache,
 *     prototype: import("../cache.mjs").Cache,
 *   },
 * ) => Element}
 */
const unbuildClassElement = (
  { node, path },
  context,
  { meta, constructor: constructor_, prototype },
) => {
  switch (node.type) {
    case "StaticBlock": {
      return {
        head: [],
        body: [],
        static: [
          (context) => [
            makeExpressionEffect(
              makeApplyExpression(
                makeFunctionExpression(
                  false,
                  false,
                  makeScopeClosureBlock(
                    context,
                    {
                      type: "closure",
                      kind: "method",
                      proto: prototype,
                      self: null,
                      super: null,
                      field: null,
                      kinds: {},
                    },
                    (context) =>
                      listBodyStatement(
                        drillAll(drillArray({ node, path }, "body")),
                        context,
                        {
                          meta,
                          parent: "closure",
                          labels: [],
                          completion: null,
                          loop: { break: null, continue: null },
                        },
                      ),
                    (_context) =>
                      makePrimitiveExpression({ undefined: null }, path),
                    path,
                  ),
                  path,
                ),
                makeReadCacheExpression(constructor_, path),
                [],
                path,
              ),
              path,
            ),
          ],
        ],
        instance: [],
      };
    }
    case "PropertyDefinition": {
      const metas = splitMeta(meta, ["key", "value", "key_cache"]);
      return makeInitCacheUnsafe(
        "constant",
        unbuildKeyExpression(drill({ node, path }, "key"), context, {
          meta: metas.key,
          computed: node.computed,
        }),
        { path, meta: metas.key_cache },
        (setup, key) => ({
          head: setup,
          body: [],
          static: node.static
            ? [
                (context) =>
                  listFieldEffect({ node, path }, context, {
                    meta: metas.value,
                    key,
                  }),
              ]
            : [],
          instance: node.static
            ? []
            : [
                (context) =>
                  listFieldEffect({ node, path }, context, {
                    meta: metas.value,
                    key,
                  }),
              ],
        }),
      );
    }
    case "MethodDefinition": {
      const metas = splitMeta(meta, ["value", "key", "key_cache"]);
      return makeInitCacheUnsafe(
        "constant",
        unbuildKeyExpression(drill({ node, path }, "key"), context, {
          meta: metas.key,
          computed: node.computed,
        }),
        { path, meta: metas.key_cache },
        (setup, key) => {
          const descriptor = makeMethodDescriptor(
            node.kind,
            unbuildFunction(drill({ node, path }, "value"), context, {
              type: "method",
              meta: metas.value,
              name:
                node.kind === "method"
                  ? makeReadCacheExpression(key, path)
                  : makeBinaryExpression(
                      "+",
                      makePrimitiveExpression(`${node.kind} `, path),
                      makeReadCacheExpression(key, path),
                      path,
                    ),
              proto: prototype,
            }),
            path,
          );
          return {
            head: setup,
            body:
              node.key.type === "PrivateIdentifier"
                ? listDefinePrivateEffect(
                    context,
                    makeReadCacheExpression(
                      node.static ? constructor_ : prototype,
                      path,
                    ),
                    /** @type {estree.PrivateKey} */ (node.key.name),
                    descriptor,
                    path,
                  )
                : [
                    makeExpressionEffect(
                      makeApplyExpression(
                        makeIntrinsicExpression("Reflect.defineProperty", path),
                        makePrimitiveExpression({ undefined: null }, path),
                        [
                          makeReadCacheExpression(
                            node.static ? constructor_ : prototype,
                            path,
                          ),
                          makeReadCacheExpression(key, path),
                          descriptor,
                        ],
                        path,
                      ),
                      path,
                    ),
                  ],
            static: [],
            instance: [],
          };
        },
      );
    }
    default: {
      throw new AranTypeError("invalid class element node", node);
    }
  }
};

/**
 * @type {(
 *   callbacks: Callback[],
 *   context: import("../context.js").Context,
 *   options: {
 *     self: import("../cache.mjs").Cache,
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeFieldClosureExpression = (callbacks, context, { self, path }) =>
  makeFunctionExpression(
    false,
    false,
    makeScopeClosureBlock(
      context,
      {
        type: "closure",
        kind: "method",
        proto: self,
        self: null,
        field: null,
        super: null,
        kinds: {},
      },
      (context) =>
        map(
          [
            ...listDeclarePrivateEffect(
              context,
              makeScopeParameterExpression(context, "this", path),
              path,
            ),
            ...flatMap(callbacks, (callback) => callback(context)),
          ],
          (effect) => makeEffectStatement(effect, path),
        ),
      (context) => makeScopeParameterExpression(context, "this", path),
      path,
    ),
    path,
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   options: {
 *     super: import("../cache.mjs").Cache | null,
 *     field: import("../cache.mjs").Cache | null,
 *     name: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeDefaultConstructorExpression = (
  { path, meta },
  { super: super_, field, name },
) =>
  makeInitCacheExpression(
    "constant",
    // This bypass a lot of abstractions :(
    // Current abstraction generates a needleesly complicated result.
    makeFunctionExpression(
      false,
      false,
      makeClosureBlock(
        [],
        [],
        makeConditionalExpression(
          makeReadExpression("new.target", path),
          guard(
            field !== null,
            (node) =>
              makeApplyExpression(
                makeReadCacheExpression(
                  /** @type {import("../cache.mjs").Cache} */ (field),
                  path,
                ),
                node,
                [],
                path,
              ),
            super_ === null
              ? makeObjectExpression(
                  makeGetExpression(
                    makeReadExpression("new.target", path),
                    makePrimitiveExpression("prototype", path),
                    path,
                  ),
                  [],
                  path,
                )
              : makeApplyExpression(
                  makeIntrinsicExpression("Reflect.construct", path),
                  makePrimitiveExpression({ undefined: null }, path),
                  [
                    makeReadCacheExpression(super_, path),
                    makeReadExpression("function.arguments", path),
                    makeReadExpression("new.target", path),
                  ],
                  path,
                ),
          ),
          makeThrowErrorExpression(
            "TypeError",
            "Constructor cannot be applied",
            path,
          ),
          path,
        ),
        path,
      ),
      path,
    ),
    { path, meta },
    (self) =>
      makeLongSequenceExpression(
        [
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.defineProperty", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeReadCacheExpression(self, path),
                makePrimitiveExpression("length", path),
                makeDataDescriptorExpression(
                  {
                    value: makePrimitiveExpression(0, path),
                    writable: false,
                    enumerable: false,
                    configurable: true,
                  },
                  path,
                ),
              ],
              path,
            ),
            path,
          ),
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.defineProperty", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeReadCacheExpression(self, path),
                makePrimitiveExpression("name", path),
                makeDataDescriptorExpression(
                  {
                    value: name,
                    writable: false,
                    enumerable: false,
                    configurable: true,
                  },
                  path,
                ),
              ],
              path,
            ),
            path,
          ),
        ],
        makeReadCacheExpression(self, path),
        path,
      ),
  );

/**
 * @type {(
 *   pairs: {
 *     node: (estree.MethodDefinition & { kind: "constructor" }),
 *     path: unbuild.Path,
 *   }[],
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *     name: aran.Expression<unbuild.Atom>,
 *     super: import("../cache.mjs").Cache | null,
 *     field: import("../cache.mjs").Cache | null,
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeConstructorExpression = (
  pairs,
  context,
  { meta, name, super: super_, field, path },
) => {
  switch (pairs.length) {
    case 0: {
      return makeDefaultConstructorExpression(
        { path, meta },
        { name, super: super_, field },
      );
    }
    case 1: {
      return unbuildFunction(drill(pairs[0], "value"), context, {
        type: "constructor",
        meta,
        name,
        super: super_,
        field,
      });
    }
    default: {
      return makeSyntaxErrorExpression(
        "multiple constructor definitions",
        path,
      );
    }
  }
};

/**
 * @type {(
 *   element1: Element,
 *   element2: Element,
 *  ) => Element}
 */
const combineElement = (element1, element2) => ({
  head: [...element1.head, ...element2.head],
  body: [...element1.body, ...element2.body],
  static: [...element1.static, ...element2.static],
  instance: [...element1.instance, ...element2.instance],
});

/**
 * @type {(
 *   key: estree.PrivateKey,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makePrivateExpression = (key, path) =>
  makeApplyExpression(
    makeIntrinsicExpression("Symbol", path),
    makePrimitiveExpression({ undefined: null }, path),
    [makePrimitiveExpression(`#${key}`, path)],
    path,
  );

/**
 * @type {(
 *   node: (
 *     | estree.PropertyDefinition
 *     | estree.MethodDefinition
 *     | estree.StaticBlock
 *   ),
 * ) => estree.PrivateKey[]}
 */
const listPrivate = (node) =>
  (node.type === "PropertyDefinition" || node.type === "MethodDefinition") &&
  !node.computed &&
  node.key.type === "PrivateIdentifier"
    ? [/** @type {estree.PrivateKey} */ (node.key.name)]
    : [];

/**
 * @type {(
 *   pair: {
 *     node: estree.ClassBody,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *     super: import("../cache.mjs").Cache | null,
 *     name: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildClassBody = (
  { node, path },
  parent_context,
  { meta, name, super: super_ },
) => {
  const metas = splitMeta(meta, [
    "constructor",
    "definitions",
    "privates",
    "body",
    "self_cache",
    "field_cache",
    "prototype_cache",
  ]);
  const split = extractConstructor(
    drillAll(drillArray({ node, path }, "body")),
  );
  const private_key_array = flatMap(node.body, listPrivate);
  return makeEnumCacheExpression(
    "constant",
    map(private_key_array, (key) => makePrivateExpression(key, path)),
    { path, meta: metas.privates },
    (private_cache_array) => {
      const context = {
        ...parent_context,
        private: {
          ...parent_context.private,
          ...reduceEntry(zip(private_key_array, private_cache_array)),
        },
      };
      return makeInitCacheExpression(
        "writable",
        makePrimitiveExpression({ undefined: null }, path),
        { path, meta: metas.field_cache },
        (field) =>
          makeInitCacheExpression(
            "constant",
            makeConstructorExpression(split.constructors, context, {
              meta: metas.constructor,
              name,
              super: super_,
              field,
              path,
            }),
            { path, meta: metas.self_cache },
            (self) =>
              makeLongSequenceExpression(
                listDeclarePrivateEffect(
                  context,
                  makeReadCacheExpression(self, path),
                  path,
                ),
                makeInitCacheExpression(
                  "constant",
                  makeGetExpression(
                    makeReadCacheExpression(self, path),
                    makePrimitiveExpression("prototype", path),
                    path,
                  ),
                  { path, meta: metas.prototype_cache },
                  (prototype) => {
                    const main = reduce(
                      map(split.definitions, (child) =>
                        unbuildClassElement(child, context, {
                          meta: metas.definitions,
                          constructor: self,
                          prototype,
                        }),
                      ),
                      combineElement,
                      {
                        head: [],
                        body: [],
                        static: [],
                        instance: [],
                      },
                    );
                    return makeLongSequenceExpression(
                      [
                        ...(super_ === null
                          ? []
                          : [
                              makeExpressionEffect(
                                makeApplyExpression(
                                  makeIntrinsicExpression(
                                    "Reflect.setPrototypeOf",
                                    path,
                                  ),
                                  makePrimitiveExpression(
                                    { undefined: null },
                                    path,
                                  ),
                                  [
                                    makeReadCacheExpression(self, path),
                                    makeReadCacheExpression(super_, path),
                                  ],
                                  path,
                                ),
                                path,
                              ),
                            ]),
                        makeExpressionEffect(
                          makeApplyExpression(
                            makeIntrinsicExpression(
                              "Reflect.setPrototypeOf",
                              path,
                            ),
                            makePrimitiveExpression({ undefined: null }, path),
                            [
                              makeReadCacheExpression(prototype, path),
                              super_ === null
                                ? makeIntrinsicExpression(
                                    "Object.prototype",
                                    path,
                                  )
                                : makeGetExpression(
                                    makeReadCacheExpression(super_, path),
                                    makePrimitiveExpression("prototype", path),
                                    path,
                                  ),
                            ],
                            path,
                          ),
                          path,
                        ),
                        ...main.head,
                        ...main.body,
                        ...(main.static.length === 0
                          ? []
                          : [
                              makeExpressionEffect(
                                makeApplyExpression(
                                  makeFieldClosureExpression(
                                    main.static,
                                    context,
                                    {
                                      self,
                                      path,
                                    },
                                  ),
                                  makeReadCacheExpression(self, path),
                                  [],
                                  path,
                                ),
                                path,
                              ),
                            ]),
                        ...(main.instance.length === 0
                          ? []
                          : [
                              makeWriteCacheEffect(
                                field,
                                makeFieldClosureExpression(
                                  main.instance,
                                  context,
                                  {
                                    self,
                                    path,
                                  },
                                ),
                                path,
                              ),
                            ]),
                      ],
                      makeReadCacheExpression(self, path),
                      path,
                    );
                  },
                ),
                path,
              ),
          ),
      );
    },
  );
};

/**
 * @type {(
 *   pair: {
 *     node: estree.ClassExpression | estree.ClassDeclaration,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *     name: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildClass = ({ node, path }, context, { meta, name }) => {
  if (hasSuperClass(node)) {
    const metas = splitMeta(meta, ["super", "body", "super_cache"]);
    return makeInitCacheExpression(
      "constant",
      unbuildExpression(drill({ node, path }, "superClass"), context, {
        meta: metas.super,
      }),
      { path, meta: metas.super_cache },
      (super_) =>
        unbuildClassBody(drill({ node, path }, "body"), context, {
          meta: metas.body,
          name,
          super: super_,
        }),
    );
  } else {
    return unbuildClassBody(drill({ node, path }, "body"), context, {
      meta,
      name,
      super: null,
    });
  }
};
