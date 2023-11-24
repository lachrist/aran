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
  makeAwaitExpression,
  makeClosureBlock,
  makeConditionalExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeFunctionExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeSequenceExpression,
  makeYieldExpression,
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
import {
  listScopeInitializeEffect,
  makeScopeClosureBlock,
} from "../scope/index.mjs";
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
import { makeIsConstructorExpression } from "../helper.mjs";
import {
  hasFreeVariable,
  hasClosureNode,
  isAwaitExpression,
  isYieldExpression,
} from "../query/index.mjs";
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
              makeReadThisExpression({ path }, context),
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
          object: makeReadThisExpression({ path }, context),
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
  const metas = splitMeta(meta, ["drill", "block"]);
  const sites = filterNarrow(
    drillArray(drill({ node, path, meta: metas.drill }, ["body"]).body),
    isStaticSite,
  );
  if (sites.length === 0) {
    return [];
  } else {
    return [
      makeExpressionEffect(
        makeApplyExpression(
          // await|yield forbidden here
          makeFunctionExpression(
            false,
            false,
            makeScopeClosureBlock(
              { path, meta: metas.block },
              {
                ...context,
                closure: extendClosure(context.closure, {
                  type: "method",
                  proto: konstructor,
                }),
              },
              {
                frame: { link: null, kinds: {} },
                makeBody: (context) =>
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
              },
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
              object: makeReadThisExpression({ path }, context),
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
  const metas = splitMeta(meta, ["drill", "block"]);
  const sites = filterNarrow(
    drillArray(drill({ node, path, meta: metas.drill }, ["body"]).body),
    isInstanceSite,
  );
  if (sites.length === 0) {
    return [];
  } else {
    return [
      makeWriteCacheEffect(
        field,
        // await|yield forbidden here
        makeFunctionExpression(
          false,
          false,
          makeScopeClosureBlock(
            { path, meta: metas.block },
            {
              ...context,
              closure: extendClosure(context.closure, {
                type: "method",
                proto: konstructor,
              }),
            },
            {
              frame: { link: null, kinds: {} },
              makeBody: (context) =>
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
            },
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
 *     derived: boolean,
 *     field: Cache,
 *     name: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeDefaultConstructor = (
  { path, meta },
  context,
  { derived, field, name },
) => {
  const metas = splitMeta(meta, ["self", "super", "return", "block"]);
  return makeSelfCacheExpression(
    "constant",
    (self) =>
      // no yield|await here
      makeFunctionExpression(
        false,
        false,
        makeScopeClosureBlock(
          { path, meta: metas.block },
          {
            ...context,
            closure: extendClosure(context.closure, {
              type: "constructor",
              derived,
              self,
              field,
            }),
          },
          {
            frame: { link: null, kinds: {} },
            makeBody: (context) =>
              makeClosureBlock(
                [],
                derived
                  ? map(
                      listCallSuperEffect(
                        { path, meta: metas.super },
                        context,
                        {
                          input: makeReadFunctionArgumentsExpression(context, {
                            path,
                          }),
                        },
                      ),
                      (node) => makeEffectStatement(node, path),
                    )
                  : [],
                makeReturnArgumentExpression(
                  {
                    path,
                    meta: metas.return,
                  },
                  context,
                  { argument: null },
                ),
                path,
              ),
          },
        ),
        path,
      ),
    { path, meta: metas.self },
    (konstructor) =>
      makeLongSequenceExpression(
        [
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.defineProperty", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeReadCacheExpression(konstructor, path),
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
                makeReadCacheExpression(konstructor, path),
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
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.defineProperty", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeReadCacheExpression(konstructor, path),
                makePrimitiveExpression("prototype", path),
                makeDataDescriptorExpression(
                  {
                    value: makeApplyExpression(
                      makeIntrinsicExpression("Object.defineProperty", path),
                      makePrimitiveExpression({ undefined: null }, path),
                      [
                        makeObjectExpression(
                          makeIntrinsicExpression("Object.prototype", path),
                          [],
                          path,
                        ),
                        makePrimitiveExpression("constructor", path),
                        makeDataDescriptorExpression(
                          {
                            value: makeReadCacheExpression(konstructor, path),
                            writable: true,
                            enumerable: false,
                            configurable: true,
                          },
                          path,
                        ),
                      ],
                      path,
                    ),
                    writable: false,
                    enumerable: false,
                    configurable: false,
                  },
                  path,
                ),
              ],
              path,
            ),
            path,
          ),
        ],
        makeReadCacheExpression(konstructor, path),
        path,
      ),
  );
};

/**
 * @type {(
 *   site: Site<estree.ClassBody>,
 *   context: Context,
 *   options: {
 *     derived: boolean,
 *     name: aran.Expression<unbuild.Atom>,
 *     field: Cache,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const unbuildConstructorBody = (
  { node, path, meta },
  context,
  { name, derived, field },
) => {
  const sites = filterNarrow(
    drillArray(drill({ node, path, meta }, ["body"]).body),
    isConstructorSite,
  );
  switch (sites.length) {
    case 0: {
      return makeDefaultConstructor({ node, path, meta }, context, {
        derived,
        name,
        field,
      });
    }
    case 1: {
      return unbuildFunction(drill(sites[0], ["value"]).value, context, {
        type: "constructor",
        derived,
        name,
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
 *     self: estree.Variable | null,
 *     name: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildClassBody = (
  { node, path, meta },
  context,
  { name, self, zuper },
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
    "self",
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
              { name, derived: zuper !== null, field },
            ),
            { path, meta: metas.konstructor },
            (konstructor) =>
              unbuildKeyBody({ node, path, meta: metas.key }, context, {
                kontinue: (keys) =>
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
                          ...(zuper === null
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
                                      makeReadCacheExpression(prototype, path),
                                      makeConditionalExpression(
                                        makeBinaryExpression(
                                          "==",
                                          makeReadCacheExpression(zuper, path),
                                          makePrimitiveExpression(null, path),
                                          path,
                                        ),
                                        makePrimitiveExpression(null, path),
                                        makeGetExpression(
                                          makeReadCacheExpression(zuper, path),
                                          makePrimitiveExpression(
                                            "prototype",
                                            path,
                                          ),
                                          path,
                                        ),
                                        path,
                                      ),
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
                              makePrimitiveExpression(
                                { undefined: null },
                                path,
                              ),
                              [
                                makeReadCacheExpression(konstructor, path),
                                zuper === null
                                  ? makeIntrinsicExpression("Object", path)
                                  : makeConditionalExpression(
                                      makeBinaryExpression(
                                        "===",
                                        makeReadCacheExpression(zuper, path),
                                        makePrimitiveExpression(null, path),
                                        path,
                                      ),
                                      makeIntrinsicExpression(
                                        "Function.prototype",
                                        path,
                                      ),
                                      makeReadCacheExpression(zuper, path),
                                      path,
                                    ),
                              ],
                              path,
                            ),
                            path,
                          ),
                          ...(self === null
                            ? []
                            : listScopeInitializeEffect(
                                context,
                                self,
                                makeReadCacheExpression(konstructor, path),
                                { path, meta: metas.self },
                              )),
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
                  ),
              }),
          ),
      ),
  });
};

/**
 * @type {(
 *   node: estree.Class,
 *   self: estree.Variable | null,
 * ) => estree.Variable | null}
 */
const isSelfPresent = (node, self) => {
  if (self === null) {
    return null;
  }
  return hasFreeVariable([node], self) ? self : null;
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
  const metas = splitMeta(meta, ["drill", "super", "block"]);
  const sites = drill({ node, path, meta: metas.drill }, [
    "superClass",
    "body",
  ]);
  const self = isSelfPresent(
    node,
    hasOwn(node, "id") && node.id != null
      ? /** @type {estree.Variable} */ (node.id.name)
      : null,
  );
  /** @type {(context: Context) => aran.Expression<unbuild.Atom>} */
  const unbuild = (context) =>
    isNotNullishSite(sites.superClass)
      ? makeInitCacheExpression(
          "constant",
          unbuildExpression(sites.superClass, context, {}),
          { path, meta: metas.super },
          (zuper) =>
            makeConditionalExpression(
              makeConditionalExpression(
                makeBinaryExpression(
                  "===",
                  makeReadCacheExpression(zuper, path),
                  makePrimitiveExpression(null, path),
                  path,
                ),
                makePrimitiveExpression(true, path),
                makeIsConstructorExpression({ path }, { value: zuper }),
                path,
              ),
              unbuildClassBody(sites.body, context, {
                name,
                self,
                zuper,
              }),
              makeThrowErrorExpression(
                "TypeError",
                "parent class should be a constructor",
                path,
              ),
              path,
            ),
        )
      : unbuildClassBody(sites.body, context, {
          name,
          self,
          zuper: null,
        });
  if (self !== null) {
    const asynchronous =
      node.superClass != null &&
      hasClosureNode([node.superClass], isAwaitExpression);
    const generator =
      node.superClass != null &&
      hasClosureNode([node.superClass], isYieldExpression);
    return guard(
      asynchronous,
      (node) => makeAwaitExpression(node, path),
      guard(
        generator,
        (node) => makeYieldExpression(true, node, path),
        makeApplyExpression(
          makeFunctionExpression(
            asynchronous,
            generator,
            makeScopeClosureBlock(
              { path, meta: metas.block },
              { ...context, mode: "strict" },
              {
                frame: { link: null, kinds: { [self]: "const" } },
                makeBody: (context) =>
                  makeClosureBlock([], [], unbuild(context), path),
              },
            ),
            path,
          ),
          // This might throw but c'mon...
          makeReadThisExpression({ path }, context),
          [],
          path,
        ),
      ),
    );
  } else {
    return unbuild({ ...context, mode: "strict" });
  }
};
