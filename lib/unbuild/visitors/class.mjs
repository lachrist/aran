import {
  AranTypeError,
  compileGet,
  filter,
  filterOut,
  flatMap,
  guard,
  map,
  mapObject,
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
  makeConditionalEffect,
  makeEffectStatement,
  makeExpressionEffect,
  makeFunctionExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";
import {
  extendClosure,
  listCallSuperEffect,
  listDeclarePrivateEffect,
  listDefinePrivateEffect,
  makeReadFunctionArgumentsExpression,
  makeReadThisExpression,
  makeReturnArgumentExpression,
} from "../param/index.mjs";
import { makeScopeClosureBlock } from "../scope/index.mjs";
import { unbuildExpression, unbuildNameExpression } from "./expression.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildKeyExpression } from "./key.mjs";
import { listBodyStatement } from "./statement.mjs";
import { drill, drillArray } from "../site.mjs";
import {
  isConstructorSite,
  isNameNode,
  isNotNullishSite,
  isPrivateIdentifierSite,
} from "../predicate.mjs";
import { makeSyntaxErrorExpression } from "../syntax-error.mjs";
import {
  listInitCacheStatement,
  makeEnumCacheExpression,
  makeInitCacheExpression,
  makeInitCacheUnsafe,
  makeReadCacheExpression,
  makeSelfCacheExpression,
  makeWriteCacheEffect,
} from "../cache.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

/**
 * @typedef {(
 *   context: import("../context.d.ts").Context,
 *   shadow: import("../cache.mjs").Cache,
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

const getHead = compileGet("head");

const getBody = compileGet("body");

const getStatic = compileGet("static");

const getInstance = compileGet("instance");

const PREFIXES = {
  method: "",
  get: "get ",
  set: "set ",
};

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

/**
 * @type {(
 *   sites: import("../site.mjs").Site<(
 *     | estree.MethodDefinition
 *     | estree.PropertyDefinition
 *     | estree.StaticBlock
 *   )>[],
 * ) => {
 *   constructors: import("../site.mjs").Site<(
 *     estree.MethodDefinition & { kind: "constructor" }
 *   )>[],
 *   definitions: import("../site.mjs").Site<(
 *     | estree.MethodDefinition & { kind: "method" | "get" | "set" }
 *     | estree.PropertyDefinition
 *     | estree.StaticBlock
 *   )>[],
 * }}
 */
const extractConstructor = (pairs) => ({
  constructors: /** @type {any[]} */ (filter(pairs, isConstructorSite)),
  definitions: /** @type {any[]} */ (filterOut(pairs, isConstructorSite)),
});

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.Expression | null | undefined>,
 *   context: import("../context.js").Context,
 *   options: {
 *     path: unbuild.Path,
 *     key: import("../cache.mjs").Cache,
 *     private: estree.PrivateKey | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listFieldEffect = (
  { node, path: dangerous_path, meta },
  context,
  { path: fallback_path, key, private: private_ },
) => {
  const path = node == null ? fallback_path : dangerous_path;
  const descriptor = makeDataDescriptorExpression(
    {
      value:
        node != null
          ? isNameNode(node)
            ? unbuildNameExpression({ node, path, meta }, context, {
                name: makeApplyExpression(
                  makeIntrinsicExpression("String", path),
                  makePrimitiveExpression({ undefined: null }, path),
                  [makeReadCacheExpression(key, path)],
                  path,
                ),
              })
            : unbuildExpression({ node, path, meta }, context, {})
          : makePrimitiveExpression({ undefined: null }, path),
      writable: true,
      enumerable: true,
      configurable: true,
    },
    path,
  );
  return private_ !== null
    ? listDefinePrivateEffect(
        context,
        makeReadThisExpression(context, { path }),
        private_,
        descriptor,
        { path },
      )
    : [
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.defineProperty", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeReadThisExpression(context, { path }),
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
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     key: import("../cache.mjs").Cache,
 *     static: boolean,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listKeySetupEffect = ({ path }, _context, { key, static: static_ }) =>
  static_
    ? [
        makeConditionalEffect(
          makeBinaryExpression(
            "==",
            makeReadCacheExpression(key, path),
            makePrimitiveExpression("prototype", path),
            path,
          ),
          [
            makeExpressionEffect(
              makeThrowErrorExpression(
                "TypeError",
                "Static method/property cannot be named 'prototype'",
                path,
              ),
              path,
            ),
          ],
          [],
          path,
        ),
      ]
    : [];

/**
 * @type {(
 *   site: import("../site.mjs").Site<(
 *     | estree.StaticBlock
 *     | estree.PropertyDefinition
 *     | estree.MethodDefinition & { kind: "method" | "get" | "set" }
 *   )>,
 *   context: import("../context.js").Context,
 *   options: {
 *     constructor: import("../cache.mjs").Cache,
 *     prototype: import("../cache.mjs").Cache,
 *   },
 * ) => Element}
 */
const unbuildClassElement = (
  { node, path, meta },
  context,
  { constructor: constructor_, prototype },
) => {
  switch (node.type) {
    case "StaticBlock": {
      const sites = mapObject(
        drill({ node, path, meta }, ["body"]),
        "body",
        drillArray,
      );
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
                    {
                      ...context,
                      closure: extendClosure(context.closure, {
                        type: "method",
                        proto: prototype,
                      }),
                    },
                    { link: null, kinds: {} },
                    (context) =>
                      makeClosureBlock(
                        [],
                        listBodyStatement(sites.body, context, {
                          parent: "closure",
                          labels: [],
                          completion: null,
                          loop: { break: null, continue: null },
                        }),
                        makePrimitiveExpression({ undefined: null }, path),
                        path,
                      ),
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
      const { computed } = node;
      const metas = splitMeta(meta, ["drill", "key"]);
      const sites = drill({ node, path, meta: metas.drill }, ["key", "value"]);
      return makeInitCacheUnsafe(
        "constant",
        unbuildKeyExpression(sites.key, context, { convert: true, computed }),
        { path, meta: metas.key },
        (setup, key) => {
          /**  @type {Callback} */
          const callback = (context) =>
            listFieldEffect(sites.value, context, {
              path,
              private:
                node.key.type === "PrivateIdentifier"
                  ? /** @type {estree.PrivateKey} */ (node.key.name)
                  : null,
              key,
            });
          return {
            head: [
              ...setup,
              ...listKeySetupEffect({ path }, context, {
                key,
                static: node.static,
              }),
            ],
            body: [],
            static: node.static ? [callback] : [],
            instance: node.static ? [] : [callback],
          };
        },
      );
    }
    case "MethodDefinition": {
      const { computed } = node;
      const metas = splitMeta(meta, ["drill", "key"]);
      const sites = drill({ node, path, meta }, ["key", "value"]);
      if (isPrivateIdentifierSite(sites.key)) {
        const TS_NARROW = sites.key;
        /** @type {Callback} */
        const callback = (context) =>
          listDefinePrivateEffect(
            context,
            makeReadThisExpression(context, { path }),
            /** @type {estree.PrivateKey} */ (TS_NARROW.node.name),
            makeMethodDescriptor(
              node.kind,
              unbuildFunction(sites.value, context, {
                type: "method",
                name: makePrimitiveExpression(
                  `${PREFIXES[node.kind]}#${TS_NARROW.node.name}`,
                  path,
                ),
                proto: prototype,
              }),
              path,
            ),
            { path },
          );
        return {
          head: [],
          body: [],
          static: node.static ? [callback] : [],
          instance: node.static ? [] : [callback],
        };
      } else {
        return makeInitCacheUnsafe(
          "constant",
          unbuildKeyExpression(sites.key, context, { convert: true, computed }),
          { path, meta: metas.key },
          (setup, key) => ({
            head: [
              ...setup,
              ...listKeySetupEffect({ path }, context, {
                key,
                static: node.static,
              }),
            ],
            body: [
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
                    makeMethodDescriptor(
                      node.kind,
                      unbuildFunction(sites.value, context, {
                        type: "method",
                        name: guard(
                          PREFIXES[node.kind] !== "",
                          (key) =>
                            makeBinaryExpression(
                              "+",
                              makePrimitiveExpression(
                                PREFIXES[node.kind] === "",
                                path,
                              ),
                              key,
                              path,
                            ),
                          makeApplyExpression(
                            makeIntrinsicExpression("String", path),
                            makePrimitiveExpression({ undefined: null }, path),
                            [makeReadCacheExpression(key, path)],
                            path,
                          ),
                        ),
                        proto: prototype,
                      }),
                      path,
                    ),
                  ],
                  path,
                ),
                path,
              ),
            ],
            static: [],
            instance: [],
          }),
        );
      }
    }
    default: {
      throw new AranTypeError("invalid class element node", node);
    }
  }
};

/**
 * @type {(
 *   context: import("../context.js").Context,
 *   options: {
 *     self: import("../cache.mjs").Cache,
 *     callbacks: Callback[],
 *   },
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeFieldClosureExpression = (
  context,
  { self, callbacks },
  { path, meta },
) =>
  makeFunctionExpression(
    false,
    false,
    makeScopeClosureBlock(
      {
        ...context,
        closure: extendClosure(context.closure, {
          type: "method",
          proto: self,
        }),
      },
      { link: null, kinds: {} },
      (context) =>
        makeClosureBlock(
          [],
          listInitCacheStatement(
            "constant",
            makeObjectExpression(makePrimitiveExpression(null, path), [], path),
            { path, meta },
            (shadow) =>
              map(
                [
                  ...listDeclarePrivateEffect(
                    context,
                    makeReadThisExpression(context, { path }),
                    makeReadCacheExpression(shadow, path),
                    { path },
                  ),
                  ...flatMap(callbacks, (callback) =>
                    callback(context, shadow),
                  ),
                ],
                (node) => makeEffectStatement(node, path),
              ),
          ),
          makeReadThisExpression(context, { path }),
          path,
        ),
      path,
    ),
    path,
  );

/**
 * @type {(
 *   site: import("../site.mjs").Site<null>,
 *   context: import("../context.js").Context,
 *   options: {
 *     super: import("../cache.mjs").Cache | null,
 *     field: import("../cache.mjs").Cache,
 *     name: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const unbuildDefaultConstructorExpression = (
  { path, meta },
  context,
  { super: super_, field, name },
) => {
  const metas = splitMeta(meta, ["self", "return"]);
  return makeSelfCacheExpression(
    "constant",
    // This bypass a lot of abstractions :(
    // Current abstraction generates a needleesly complicated result.
    (self) =>
      makeFunctionExpression(
        false,
        false,
        makeScopeClosureBlock(
          {
            ...context,
            closure: extendClosure(context.closure, {
              type: "constructor",
              self,
              super: super_,
              field,
            }),
          },
          { link: null, kinds: {} },
          (context) =>
            makeClosureBlock(
              [],
              super_ === null
                ? []
                : map(
                    listCallSuperEffect(
                      context,
                      makeReadFunctionArgumentsExpression(context, { path }),
                      { path },
                    ),
                    (node) => makeEffectStatement(node, path),
                  ),
              makeReturnArgumentExpression(context, null, {
                path,
                meta: metas.return,
              }),
              path,
            ),
          path,
        ),
        path,
      ),
    { path, meta: metas.self },
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
};

/**
 * @type {(
 *   sites: import("../site.mjs").Site<
 *     estree.MethodDefinition & { kind: "constructor" }
 *   >[],
 *   context: import("../context.js").Context,
 *   options: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *     name: aran.Expression<unbuild.Atom>,
 *     super: import("../cache.mjs").Cache | null,
 *     field: import("../cache.mjs").Cache,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeConstructorExpression = (
  sites,
  context,
  { meta, name, super: super_, field, path },
) => {
  switch (sites.length) {
    case 0: {
      return unbuildDefaultConstructorExpression(
        { node: null, path, meta },
        context,
        { name, super: super_, field },
      );
    }
    case 1: {
      return unbuildFunction(drill(sites[0], ["value"]).value, context, {
        type: "constructor",
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
 * @type {(elements: Element[]) => Element}
 */
const combineElement = (elements) => ({
  head: flatMap(elements, getHead),
  body: flatMap(elements, getBody),
  static: flatMap(elements, getStatic),
  instance: flatMap(elements, getInstance),
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
 *   site: import("../site.mjs").Site<estree.ClassBody>,
 *   context: import("../context.js").Context,
 *   options: {
 *     super: import("../cache.mjs").Cache | null,
 *     name: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildClassBody = (
  { node, path, meta },
  parent_context,
  { name, super: super_ },
) => {
  const private_key_array = flatMap(node.body, listPrivate);
  const metas = splitMeta(meta, [
    "drill",
    "constructor",
    "privates",
    "self",
    "field",
    "prototype",
    "instance",
    "static",
  ]);
  const sites = extractConstructor(
    drillArray(drill({ node, path, meta: metas.drill }, ["body"]).body),
  );
  return makeEnumCacheExpression(
    "constant",
    map(private_key_array, (key) => makePrivateExpression(key, path)),
    { path, meta: metas.privates },
    (private_cache_array) => {
      const context = {
        ...parent_context,
        privates: {
          ...parent_context.privates,
          ...reduceEntry(zip(private_key_array, private_cache_array)),
        },
      };
      return makeInitCacheExpression(
        "writable",
        makePrimitiveExpression({ undefined: null }, path),
        { path, meta: metas.field },
        (field) =>
          makeInitCacheExpression(
            "constant",
            makeConstructorExpression(sites.constructors, context, {
              meta: metas.constructor,
              path,
              name,
              super: super_,
              field,
            }),
            { path, meta: metas.self },
            (self) =>
              makeInitCacheExpression(
                "constant",
                makeGetExpression(
                  makeReadCacheExpression(self, path),
                  makePrimitiveExpression("prototype", path),
                  path,
                ),
                { path, meta: metas.prototype },
                (prototype) => {
                  const main = combineElement(
                    map(sites.definitions, (site) =>
                      unbuildClassElement(site, context, {
                        constructor: self,
                        prototype,
                      }),
                    ),
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
                                  context,
                                  { self, callbacks: main.static },
                                  { path, meta: metas.static },
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
                                context,
                                { self, callbacks: main.instance },
                                { path, meta: metas.instance },
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
          ),
      );
    },
  );
};

/**
 * @type {(
 *   site: {
 *     node: estree.ClassExpression | estree.ClassDeclaration,
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     name: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildClass = ({ node, path, meta }, context, { name }) => {
  const metas = splitMeta(meta, ["drill", "super"]);
  const sites = drill({ node, path, meta: metas.drill }, [
    "superClass",
    "body",
  ]);
  if (isNotNullishSite(sites.superClass)) {
    return makeInitCacheExpression(
      "constant",
      unbuildExpression(sites.superClass, context, {}),
      { path, meta: metas.super },
      (super_) =>
        unbuildClassBody(sites.body, context, { name, super: super_ }),
    );
  } else {
    return unbuildClassBody(sites.body, context, { name, super: null });
  }
};
