import {
  compileGet,
  filter,
  filterNarrow,
  filterOut,
  flatMap,
  guard,
  hasOwn,
  map,
} from "../../util/index.mjs";
import { AranError, AranTypeError } from "../../error.mjs";
import {
  makeAccessorDescriptorExpression,
  makeDataDescriptorExpression,
  makeGetExpression,
  makeLongSequenceExpression,
} from "../intrinsic.mjs";
import { splitMeta } from "../mangle.mjs";
import {
  makeApplyExpression,
  makeClosureBlock,
  makeEffectStatement,
  makeExpressionEffect,
  makeFunctionExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeSequenceExpression,
} from "../node.mjs";
import {
  declarePrivate,
  extendClosure,
  listCallSuperEffect,
  listInitializePrivateEffect,
  listRegisterPrivateEffect,
  makeReadFunctionArgumentsExpression,
  makeReadThisExpression,
  makeReturnArgumentExpression,
} from "../param/index.mjs";
import { makeScopeClosureBlock } from "../scope/index.mjs";
import { unbuildExpression, unbuildNameExpression } from "./expression.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildKey } from "./key.mjs";
import { listBodyStatement } from "./statement.mjs";
import { drill, drillArray } from "../site.mjs";
import {
  isConstructorSite,
  isDefinitionSite,
  isInstanceSite,
  isMethodDefinitionSite,
  isNameSite,
  isNotNullishSite,
  isPrivateSite,
  isStaticSite,
} from "../predicate.mjs";
import { makeSyntaxErrorExpression } from "../syntax-error.mjs";
import {
  makeInitCacheExpression,
  makeReadCacheExpression,
  makeSelfCacheExpression,
  makeWriteCacheEffect,
} from "../cache.mjs";
import {
  makeCheckStaticKeyExpression,
  makeNameKeyExpression,
  makeReadKeyExpression,
} from "../key.mjs";

/**
 * @template N
 * @typedef {import("../site.mjs").Site<N>} Site
 */

/**
 * @typedef {import("../cache.mjs").Cache} Cache
 */

/**
 * @typedef {import("../cache.mjs").WritableCache} WritableCache
 */

/**
 * @typedef {import("../context.d.ts").Context} Context
 */

/**
 * @typedef {import("../key.d.ts").Key} Key
 */

////////////
// Helper //
////////////

const getNode = compileGet("node");

/**
 * @type {(
 *   node1: estree.MethodDefinition | estree.PropertyDefinition,
 *   node2: estree.MethodDefinition | estree.PropertyDefinition
 * ) => boolean}
 */
const areCompagnionAccessor = (node1, node2) =>
  node1.type === "MethodDefinition" &&
  node2.type === "MethodDefinition" &&
  node1.static === node2.static &&
  !node1.computed &&
  !node1.computed &&
  (node1.key.type === "Identifier" || node1.key.type === "PrivateIdentifier") &&
  (node2.key.type === "Identifier" || node2.key.type === "PrivateIdentifier") &&
  node1.key.type === node2.key.type &&
  node1.key.name === node2.key.name &&
  ((node1.kind === "get" && node2.kind === "set") ||
    (node1.kind === "set" && node2.kind === "get"));

/**
 * @type {(
 *   nodes: (
 *     | estree.PropertyDefinition & { key : estree.PrivateIdentifier }
 *     | estree.MethodDefinition & { key : estree.PrivateIdentifier }
 *   )[],
 * ) => {
 *   type: "field" | "method"
 * } | {
 *   type: "accessor",
 *   getter: boolean,
 *   setter: boolean,
 * } | {
 *   type: "incompatible"
 * }}
 */
const mergePrivate = (nodes) => {
  switch (nodes.length) {
    case 0: {
      throw new AranError("empty private nodes");
    }
    case 1: {
      const node = nodes[0];
      switch (node.type) {
        case "MethodDefinition": {
          switch (node.kind) {
            case "constructor": {
              throw new AranError("constructor cannot be private", node);
            }
            case "method": {
              return { type: "method" };
            }
            case "get": {
              return { type: "accessor", getter: true, setter: false };
            }
            case "set": {
              return { type: "accessor", getter: false, setter: true };
            }
            default: {
              throw new AranTypeError("invalid method kind", node.kind);
            }
          }
        }
        case "PropertyDefinition": {
          return { type: "field" };
        }
        default: {
          throw new AranTypeError("invalid definition node", node);
        }
      }
    }
    case 2: {
      if (areCompagnionAccessor(nodes[0], nodes[1])) {
        return { type: "accessor", getter: true, setter: true };
      } else {
        return { type: "incompatible" };
      }
    }
    default: {
      return { type: "incompatible" };
    }
  }
};

//////////////
// Key Pass //
//////////////

/**
 * @type {(
 *   sites: Site<(
 *     | estree.PropertyDefinition
 *     | estree.MethodDefinition
 *   )>[],
 *   context: Context,
 *   options: {
 *     kontinue: (
 *       keys: {[k in unbuild.Path]: Key},
 *     ) => aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const unbuildKeyLoop = (sites, context, { kontinue }) => {
  if (sites.length === 0) {
    return kontinue({});
  } else {
    const [{ node, path, meta }, ...rest] = sites;
    return unbuildKey(drill({ node, path, meta }, ["key"]).key, context, {
      computed: node.computed,
      prepend: makeSequenceExpression,
      kontinue: (key) =>
        guard(
          node.static,
          (node) => makeCheckStaticKeyExpression(key, path, node),
          unbuildKeyLoop(rest, context, {
            kontinue: (keys) =>
              kontinue({
                ...keys,
                [path]: key,
              }),
          }),
        ),
    });
  }
};

/**
 * @type {(
 *   site: Site<estree.ClassBody>,
 *   context: Context,
 *   options: {
 *     kontinue: (
 *       keys: {[k in unbuild.Path]: Key},
 *     ) => aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const unbuildKeyBody = (site, context, { kontinue }) =>
  unbuildKeyLoop(
    filterNarrow(drillArray(drill(site, ["body"]).body), isDefinitionSite),
    context,
    { kontinue },
  );

//////////////////
// Private Pass //
//////////////////

/**
 * @type {(
 *   sites: Site<(
 *     | estree.PropertyDefinition & { key: estree.PrivateIdentifier }
 *     | estree.MethodDefinition & { key: estree.PrivateIdentifier }
 *   )>[],
 *   context: Context,
 *   options: {
 *     kontinue: (
 *       context: Context,
 *     ) => aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const declarePrivateLoop = (sites, context, { kontinue }) => {
  if (sites.length === 0) {
    return kontinue(context);
  } else {
    const [{ node, path, meta }, ...rest] = sites;
    const key = /** @type {estree.PrivateKey} */ (node.key.name);
    /**
     * @type {(node: Site<(
     *   | estree.PropertyDefinition & { key: estree.PrivateIdentifier }
     *   | estree.MethodDefinition & { key: estree.PrivateIdentifier }
     * )>) => boolean}
     */
    const isRelated = ({ node }) => node.key.name === key;
    const related = filter(rest, isRelated);
    const unrelated = filterOut(rest, isRelated);
    const descriptor = mergePrivate([node, ...map(related, getNode)]);
    if (descriptor.type === "incompatible") {
      return makeSyntaxErrorExpression(`Duplicate private key #${key}`, path);
    } else {
      return declarePrivate({ path, meta }, context, {
        key,
        descriptor,
        kontinue: (context) =>
          declarePrivateLoop(unrelated, context, { kontinue }),
      });
    }
  }
};

/**
 * @type {(
 *   site: Site<estree.ClassBody>,
 *   context: Context,
 *   options: {
 *     kontinue: (
 *       context: Context,
 *     ) => aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const declarePrivateBody = (site, context, { kontinue }) =>
  declarePrivateLoop(
    filterNarrow(drillArray(drill(site, ["body"]).body), isPrivateSite),
    context,
    { kontinue },
  );

/////////////////
// Method Pass //
/////////////////

/**
 * @type {(
 *   site: Site<estree.MethodDefinition & { kind: "method" | "get" | "set" }>,
 *   context: Context,
 *   options: {
 *     key: Key,
 *     konstructor: Cache,
 *     prototype: Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const unbuildMethod = (
  { node, path, meta },
  context,
  { key, konstructor, prototype },
) => {
  const method = unbuildFunction(
    drill({ node, path, meta }, ["value"]).value,
    context,
    {
      type: "method",
      name: makeNameKeyExpression(key, node.kind, path),
      proto: node.static ? konstructor : prototype,
    },
  );
  switch (key.access) {
    case "public": {
      return [
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.defineProperty", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeReadCacheExpression(
                node.static ? konstructor : prototype,
                path,
              ),
              makeReadKeyExpression(key, path),
              node.kind === "method"
                ? makeDataDescriptorExpression(
                    {
                      value: method,
                      writable: true,
                      enumerable: false,
                      configurable: true,
                    },
                    path,
                  )
                : makeAccessorDescriptorExpression(
                    {
                      get: node.kind === "get" ? method : null,
                      set: node.kind === "set" ? method : null,
                      enumerable: makePrimitiveExpression(false, path),
                      configurable: makePrimitiveExpression(true, path),
                    },
                    path,
                  ),
            ],
            path,
          ),
          path,
        ),
      ];
    }
    case "private": {
      return [
        ...listInitializePrivateEffect({ path }, context, {
          key: key.value,
          descriptor: {
            type: node.kind,
            value: method,
          },
        }),
        ...(node.static
          ? listRegisterPrivateEffect({ path }, context, {
              object: makeReadCacheExpression(konstructor, path),
              key: key.value,
              descriptor: {
                type: node.kind === "method" ? "method" : "accessor",
              },
            })
          : []),
      ];
    }
    default: {
      throw new AranTypeError("invalid key", key);
    }
  }
};

/**
 * @type {(
 *   site: Site<estree.ClassBody>,
 *   context: Context,
 *   options: {
 *     keys: {[k in unbuild.Path]: Key},
 *     konstructor: Cache,
 *     prototype: Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const unbuildMethodBody = (
  { node, path, meta },
  context,
  { keys, konstructor, prototype },
) => {
  const sites = filterNarrow(
    drillArray(drill({ node, path, meta }, ["body"]).body),
    isMethodDefinitionSite,
  );
  return flatMap(sites, ({ node, path, meta }) => {
    if (hasOwn(keys, path)) {
      return unbuildMethod({ node, path, meta }, context, {
        key: keys[path],
        konstructor,
        prototype,
      });
    } else {
      throw new AranError("missing key", { keys, path });
    }
  });
};

/////////////////////
// Property Common //
/////////////////////

/**
 * @type {(
 *   site: Site<estree.PropertyDefinition>,
 *   context: Context,
 *   options: {
 *     key: Key,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const unbuilProperty = ({ node, path, meta }, context, { key }) => {
  const site = drill({ node, path, meta }, ["value"]).value;
  const value = isNotNullishSite(site)
    ? isNameSite(site)
      ? unbuildNameExpression(site, context, {
          name: makeNameKeyExpression(key, "init", path),
        })
      : unbuildExpression(site, context, {})
    : makePrimitiveExpression({ undefined: null }, path);
  switch (key.access) {
    case "public": {
      return [
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.defineProperty", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeReadThisExpression(context, { path }),
              makeReadKeyExpression(key, path),
              makeDataDescriptorExpression(
                {
                  value,
                  writable: true,
                  enumerable: true,
                  configurable: true,
                },
                path,
              ),
            ],
            path,
          ),
          path,
        ),
      ];
    }
    case "private": {
      return [
        ...listRegisterPrivateEffect({ path }, context, {
          object: makeReadThisExpression(context, { path }),
          key: key.value,
          descriptor: { type: "field", value },
        }),
      ];
    }
    default: {
      throw new AranTypeError("invalid key", key);
    }
  }
};

/////////////////
// Static Pass //
/////////////////

/**
 * @type {(
 *   site: Site<(
 *     | estree.StaticBlock
 *     | estree.PropertyDefinition & { static: true }
 *   )>,
 *   context: Context,
 *   options: {
 *     keys: {[k in unbuild.Path]: Key},
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
const unbuildStatic = ({ node, path, meta }, context, { keys }) => {
  switch (node.type) {
    case "StaticBlock": {
      return listBodyStatement(
        drillArray(drill({ node, path, meta }, ["body"]).body),
        context,
        {
          parent: "closure",
          labels: [],
          completion: null,
          loop: { break: null, continue: null },
        },
      );
    }
    case "PropertyDefinition": {
      if (hasOwn(keys, path)) {
        return map(
          unbuilProperty({ node, path, meta }, context, {
            key: keys[path],
          }),
          (node) => makeEffectStatement(node, path),
        );
      } else {
        throw new AranError("missing key", { keys, path });
      }
    }
    default: {
      throw new AranTypeError("invalid class element node", node);
    }
  }
};

/**
 * @type {(
 *   site: Site<estree.ClassBody>,
 *   context: Context,
 *   options: {
 *     keys: {[k in unbuild.Path]: Key},
 *     konstructor: Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const unbuildStaticBody = (
  { node, path, meta },
  context,
  { keys, konstructor },
) => {
  const sites = filterNarrow(
    drillArray(drill({ node, path, meta }, ["body"]).body),
    isStaticSite,
  );
  if (sites.length === 0) {
    return [];
  } else {
    return [
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
                  proto: konstructor,
                }),
              },
              { link: null, kinds: {} },
              (context) =>
                makeClosureBlock(
                  [],
                  flatMap(sites, (site) =>
                    unbuildStatic(site, context, {
                      keys,
                    }),
                  ),
                  makePrimitiveExpression({ undefined: null }, path),
                  path,
                ),
              path,
            ),
            path,
          ),
          makeReadCacheExpression(konstructor, path),
          [],
          path,
        ),
        path,
      ),
    ];
  }
};

///////////////////
// Instance Pass //
///////////////////

/**
 * @type {(
 *   site: Site<(
 *     | estree.PropertyDefinition & { static: false}
 *     | estree.MethodDefinition & {
 *       static: false,
 *       key: estree.PrivateIdentifier,
 *     }
 *   )>,
 *   context: Context,
 *   options: {
 *     keys: {[k in unbuild.Path]: Key},
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const unbuildInstance = ({ node, path, meta }, context, { keys }) => {
  if (hasOwn(keys, path)) {
    const key = keys[path];
    switch (node.type) {
      case "MethodDefinition": {
        switch (key.access) {
          case "private": {
            return listRegisterPrivateEffect({ path }, context, {
              object: makeReadThisExpression(context, { path }),
              key: key.value,
              descriptor: {
                type: node.kind === "method" ? "method" : "accessor",
              },
            });
          }
          case "public": {
            throw new AranError("unexpected public key access", key);
          }
          default: {
            throw new AranTypeError("invalid key access", key);
          }
        }
      }
      case "PropertyDefinition": {
        return unbuilProperty({ node, path, meta }, context, { key });
      }
      default: {
        throw new AranTypeError("invalid instance class element node", node);
      }
    }
  } else {
    throw new AranError("missing key", { keys, path });
  }
};

/**
 * @type {(
 *   site: Site<estree.ClassBody>,
 *   context: Context,
 *   options: {
 *     keys: {[k in unbuild.Path]: Key},
 *     field: WritableCache,
 *     konstructor: Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const unbuildInstanceBody = (
  { node, path, meta },
  context,
  { keys, field, konstructor },
) => {
  const sites = filterNarrow(
    drillArray(drill({ node, path, meta }, ["body"]).body),
    isInstanceSite,
  );
  if (sites.length === 0) {
    return [];
  } else {
    return [
      makeWriteCacheEffect(
        field,
        makeFunctionExpression(
          false,
          false,
          makeScopeClosureBlock(
            {
              ...context,
              closure: extendClosure(context.closure, {
                type: "method",
                proto: konstructor,
              }),
            },
            { link: null, kinds: {} },
            (context) =>
              makeClosureBlock(
                [],
                map(
                  flatMap(
                    // Register private methods first to
                    // enable instance fields to access them.
                    [
                      ...filter(sites, isMethodDefinitionSite),
                      ...filterOut(sites, isMethodDefinitionSite),
                    ],
                    (site) =>
                      unbuildInstance(site, context, {
                        keys,
                      }),
                  ),
                  (node) => makeEffectStatement(node, path),
                ),
                makePrimitiveExpression({ undefined: null }, path),
                path,
              ),
            path,
          ),
          path,
        ),
        path,
      ),
    ];
  }
};

//////////////////////
// Constructor Pass //
//////////////////////

/**
 * @type {(
 *   site: Site<estree.ClassBody>,
 *   context: Context,
 *   options: {
 *     zuper: Cache | null,
 *     field: Cache,
 *     name: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeDefaultConstructor = (
  { path, meta },
  context,
  { zuper, field, name },
) => {
  const metas = splitMeta(meta, ["self", "super", "return"]);
  return makeSelfCacheExpression(
    "constant",
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
              super: zuper,
              field,
            }),
          },
          { link: null, kinds: {} },
          (context) =>
            makeClosureBlock(
              [],
              zuper === null
                ? []
                : map(
                    listCallSuperEffect(
                      context,
                      makeReadFunctionArgumentsExpression(context, { path }),
                      { path, meta: metas.super },
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
 *   site: Site<estree.ClassBody>,
 *   context: Context,
 *   options: {
 *     name: aran.Expression<unbuild.Atom>,
 *     zuper: Cache | null,
 *     field: Cache,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const unbuildConstructorBody = (
  { node, path, meta },
  context,
  { name, zuper, field },
) => {
  const sites = filterNarrow(
    drillArray(drill({ node, path, meta }, ["body"]).body),
    isConstructorSite,
  );
  switch (sites.length) {
    case 0: {
      return makeDefaultConstructor({ node, path, meta }, context, {
        name,
        zuper,
        field,
      });
    }
    case 1: {
      return unbuildFunction(drill(sites[0], ["value"]).value, context, {
        type: "constructor",
        name,
        super: zuper,
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

//////////
// Main //
//////////

/**
 * @type {(
 *   site: Site<estree.ClassBody>,
 *   context: Context,
 *   options: {
 *     zuper: Cache | null,
 *     name: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildClassBody = (
  { node, path, meta },
  context,
  { name, zuper },
) => {
  const metas = splitMeta(meta, [
    // pass //
    "private",
    "constructor",
    "key",
    "method",
    "static",
    "instance",
    // cache //
    "field",
    "konstructor",
    "prototype",
  ]);
  return declarePrivateBody({ node, path, meta: metas.private }, context, {
    kontinue: (context) =>
      makeInitCacheExpression(
        "writable",
        makePrimitiveExpression({ undefined: null }, path),
        { path, meta: metas.field },
        (field) =>
          makeInitCacheExpression(
            "constant",
            unbuildConstructorBody(
              { node, path, meta: metas.constructor },
              context,
              {
                name,
                zuper,
                field,
              },
            ),
            { path, meta: metas.konstructor },
            (konstructor) =>
              makeLongSequenceExpression(
                zuper === null
                  ? []
                  : [
                      makeExpressionEffect(
                        makeApplyExpression(
                          makeIntrinsicExpression(
                            "Reflect.setPrototypeOf",
                            path,
                          ),
                          makePrimitiveExpression({ undefined: null }, path),
                          [
                            makeReadCacheExpression(konstructor, path),
                            makeReadCacheExpression(zuper, path),
                          ],
                          path,
                        ),
                        path,
                      ),
                    ],
                makeInitCacheExpression(
                  "constant",
                  makeGetExpression(
                    makeReadCacheExpression(konstructor, path),
                    makePrimitiveExpression("prototype", path),
                    path,
                  ),
                  { path, meta: metas.prototype },
                  (prototype) =>
                    makeLongSequenceExpression(
                      [
                        makeExpressionEffect(
                          makeApplyExpression(
                            makeIntrinsicExpression(
                              "Reflect.setPrototypeOf",
                              path,
                            ),
                            makePrimitiveExpression({ undefined: null }, path),
                            [
                              makeReadCacheExpression(prototype, path),
                              zuper === null
                                ? makeIntrinsicExpression(
                                    "Object.prototype",
                                    path,
                                  )
                                : makeGetExpression(
                                    makeReadCacheExpression(zuper, path),
                                    makePrimitiveExpression("prototype", path),
                                    path,
                                  ),
                            ],
                            path,
                          ),
                          path,
                        ),
                      ],
                      unbuildKeyBody({ node, path, meta: metas.key }, context, {
                        kontinue: (keys) =>
                          makeLongSequenceExpression(
                            [
                              ...unbuildMethodBody(
                                { node, path, meta: metas.method },
                                context,
                                { keys, konstructor, prototype },
                              ),
                              ...unbuildStaticBody(
                                { node, path, meta: metas.static },
                                context,
                                { keys, konstructor },
                              ),
                              ...unbuildInstanceBody(
                                { node, path, meta: metas.instance },
                                context,
                                { keys, field, konstructor },
                              ),
                            ],
                            makeReadCacheExpression(konstructor, path),
                            path,
                          ),
                      }),
                      path,
                    ),
                ),
                path,
              ),
          ),
      ),
  });
};

/**
 * @type {(
 *   site: {
 *     node: estree.ClassExpression | estree.ClassDeclaration,
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: Context,
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
      (zuper) => unbuildClassBody(sites.body, context, { name, zuper }),
    );
  } else {
    return unbuildClassBody(sites.body, context, { name, zuper: null });
  }
};
