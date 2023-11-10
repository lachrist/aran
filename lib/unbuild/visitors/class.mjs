import {
  AranTypeError,
  compileGet,
  filter,
  filterOut,
  flatMap,
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
} from "../intrinsic.mjs";
import { splitMeta } from "../mangle.mjs";
import {
  makeApplyExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeFunctionExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";
import {
  extendParamClosure,
  extendParamPrivate,
  listDeclarePrivateEffect,
  listDefinePrivateEffect,
  listSetupEffect,
  makeReadThisExpression,
  makeReturnArgumentExpression,
} from "../param/index.mjs";
import { makeScopeClosureBlock } from "../scope/index.mjs";
import { unbuildExpression, unbuildNameExpression } from "./expression.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildKeyExpression } from "./key.mjs";
import { listBodyStatement } from "./statement.mjs";
import { drill, drillArray } from "../site.mjs";
import { isConstructorSite, isNotNullishSite } from "../predicate.mjs";
import { makeSyntaxErrorExpression } from "../report.mjs";
import {
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
          ? unbuildNameExpression({ node, path, meta }, context, {
              name: makeReadCacheExpression(key, path),
            })
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
                      closure: {
                        type: "method",
                        between: "none",
                        proto: prototype,
                      },
                    },
                    { type: "closure", kinds: {} },
                    (context) =>
                      listBodyStatement(sites.body, context, {
                        parent: "closure",
                        labels: [],
                        completion: null,
                        loop: { break: null, continue: null },
                      }),
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
      const { computed } = node;
      const metas = splitMeta(meta, ["drill", "key"]);
      const sites = drill({ node, path, meta: metas.drill }, ["key", "value"]);
      return makeInitCacheUnsafe(
        "constant",
        unbuildKeyExpression(sites.key, context, { computed }),
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
            head: setup,
            body: [],
            static: node.static ? [callback] : [],
            instance: node.static ? [] : [callback],
          };
        },
      );
    }
    case "MethodDefinition": {
      const metas = splitMeta(meta, ["drill", "key"]);
      const sites = drill({ node, path, meta }, ["key", "value"]);
      return makeInitCacheUnsafe(
        "constant",
        unbuildKeyExpression(sites.key, context, {
          computed: node.computed,
        }),
        { path, meta: metas.key },
        (setup, key) => {
          const descriptor = makeMethodDescriptor(
            node.kind,
            unbuildFunction(sites.value, context, {
              type: "method",
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
                    { path },
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
      {
        ...context,
        "function.arguments": "legal",
        "super": {
          type: "internal",
          proto: self,
        },
        "closure": {
          type: "method",
          between: "none",
        },
      },
      { type: "closure", kinds: {} },
      (context) =>
        map(
          [
            ...listDeclarePrivateEffect(
              context,
              makeReadThisExpression(context, { path }),
              { path },
            ),
            ...flatMap(callbacks, (callback) => callback(context)),
          ],
          (effect) => makeEffectStatement(effect, path),
        ),
      (context) => makeReadThisExpression(context, { path }),
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
 *     field: import("../cache.mjs").Cache | null,
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
            param: extendParamClosure(context.param, {
              type: "constructor",
              self,
              super: super_,
              field,
            }),
          },
          { type: "closure", kinds: {} },
          (context) =>
            map(listSetupEffect(context, { path }), (node) =>
              makeEffectStatement(node, path),
            ),
          (context) =>
            makeReturnArgumentExpression(context, null, {
              path,
              meta: metas.return,
            }),
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
 *     field: import("../cache.mjs").Cache | null,
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
        param: extendParamPrivate(
          parent_context.param,
          reduceEntry(zip(private_key_array, private_cache_array)),
        ),
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
              makeLongSequenceExpression(
                listDeclarePrivateEffect(
                  context,
                  makeReadCacheExpression(self, path),
                  { path },
                ),
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
