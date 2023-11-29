import {
  compileGet,
  filterNarrow,
  flatMap,
  guard,
  hasOwn,
  map,
  pairup,
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
  makeBlockStatement,
  makeClosureBlock,
  makeConditionalEffect,
  makeConditionalExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeFunctionExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeYieldExpression,
} from "../node.mjs";
import {
  declarePrivate,
  extendClosure,
  listCallSuperEffect,
  listInitializePrivateEffect,
  listRegisterPrivateManyEffect,
  listRegisterPrivateSingletonEffect,
  makeReadFunctionArgumentsExpression,
  makeReadThisExpression,
  makeReturnArgumentExpression,
  setupPrivateDescriptor,
} from "../param/index.mjs";
import {
  listScopeInitializeEffect,
  makeScopeClosureBlock,
  makeScopeControlBlock,
} from "../scope/index.mjs";
import { unbuildExpression, unbuildNameExpression } from "./expression.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildKeySetup } from "./key.mjs";
import { listBodyStatement } from "./statement.mjs";
import { drill, drillArray } from "../site.mjs";
import {
  isConstructorSite,
  isDefinitionNode,
  isDefinitionSite,
  isInstancePropertySite,
  isMethodDefinitionSite,
  isNameSite,
  isNotNullishSite,
  isPrivateDefinitionSite,
  isStaticSite,
} from "../predicate.mjs";
import { makeSyntaxErrorExpression } from "../syntax-error.mjs";
import {
  listInitCacheEffect,
  makeInitCacheExpression,
  makeReadCacheExpression,
  makeSelfCacheExpression,
  makeSetupExpression,
  listWriteCacheEffect,
  mapSetup,
  sequenceSetup,
} from "../cache.mjs";
import { makeNameKeyExpression, makeReadKeyExpression } from "../key.mjs";
import { makeIsConstructorExpression } from "../helper.mjs";
import {
  hasFreeVariable,
  hasClosureNode,
  isAwaitExpression,
  isYieldExpression,
  hoistBlock,
  hoistClosure,
} from "../query/index.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

/**
 * @template N
 * @typedef {import("../site.mjs").Site<N>} Site
 */

/**
 * @typedef {(
 *   import("../param/private/dictionary.d.ts").PrivateCommon
 * )} PrivateCommon
 */

/**
 * @typedef {import("../cache.mjs").Cache} Cache
 */

/**
 * @template V
 * @typedef {import("../cache.mjs").Setup<V>} Setup
 */

/**
 * @typedef {(
 *   import("../param/private/descriptor.d.ts").PrivateDescriptor
 * )} PrivateDescriptor
 */

/**
 * @typedef {(
 *   import(
 *     "../param/private/dictionary.d.ts"
 *   ).RawPrivateDictionary<PrivateDescriptor>
 * )} RawPrivateDictionary
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

const getKey = compileGet("key");

//////////////
// Key Pass //
//////////////

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
const unbuildKeyPass = ({ node, path, meta }, context, { kontinue }) => {
  const sites = filterNarrow(
    drillArray(drill({ node, path, meta }, ["body"]).body),
    isDefinitionSite,
  );
  return makeSetupExpression(
    mapSetup(
      sequenceSetup(
        map(sites, ({ node, path, meta }) =>
          mapSetup(
            unbuildKeySetup(drill({ node, path, meta }, ["key"]).key, context, {
              computed: node.computed,
            }),
            (key) => pairup(path, key),
          ),
        ),
      ),
      (entries) => kontinue(reduceEntry(entries)),
    ),
    path,
  );
};

//////////////////
// Private Pass //
//////////////////

/**
 * @type {(
 *   site: Site<(
 *     | estree.PropertyDefinition & { key: estree.PrivateIdentifier }
 *     | estree.MethodDefinition & {
 *       kind: "method" | "get" | "set",
 *       key: estree.PrivateIdentifier,
 *     }
 *   )>,
 *   context: Context,
 *   options: {},
 * ) => Setup<[
 *   estree.PrivateKey,
 *   RawPrivateDictionary,
 * ]>}
 */
const unbuildPrivate = ({ node, path, meta }, context, {}) => {
  const key = /** @type {estree.PrivateKey} */ (node.key.name);
  switch (node.type) {
    case "MethodDefinition": {
      return mapSetup(
        setupPrivateDescriptor({ path, meta }, context, { kind: node.kind }),
        (descriptor) =>
          pairup(key, {
            type: node.static ? "constant-singleton" : "constant-many",
            descriptor,
          }),
      );
    }
    case "PropertyDefinition": {
      return {
        setup: [],
        value: pairup(key, {
          type: node.static ? "variable-singleton" : "variable-many",
        }),
      };
    }
    default: {
      throw new AranTypeError("invalid private node", node);
    }
  }
};

/**
 * @type {(
 *   site: Site<estree.ClassBody>,
 *   context: Context,
 *   options: {
 *     kontinue: (
 *       entries: [
 *         estree.PrivateKey,
 *         RawPrivateDictionary,
 *       ][],
 *     ) => aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const unbuildPrivatePass = ({ node, path, meta }, context, { kontinue }) =>
  makeSetupExpression(
    mapSetup(
      sequenceSetup(
        map(
          filterNarrow(
            drillArray(drill({ node, path, meta }, ["body"]).body),
            isPrivateDefinitionSite,
          ),
          (site) => unbuildPrivate(site, context, {}),
        ),
      ),
      kontinue,
    ),
    path,
  );

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

/////////////////
// Method Pass //
/////////////////

/**
 * @type {(
 *   site: Site<estree.MethodDefinition & {
 *     kind: "method" | "get" | "set",
 *   }>,
 *   context: Context,
 *   options: {
 *     key: Key,
 *     konstructor: Cache,
 *     prototype: Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildMethod = (
  { node, path, meta },
  context,
  { key, konstructor, prototype },
) => {
  const metas = splitMeta(meta, ["drill", "method"]);
  const method = unbuildFunction(
    drill({ node, path, meta: metas.drill }, ["value"]).value,
    context,
    {
      type: "method",
      name: makeNameKeyExpression(key, node.kind, path),
      proto: node.static ? konstructor : prototype,
    },
  );
  switch (key.access) {
    case "private": {
      return listInitCacheEffect(
        "constant",
        method,
        { path, meta: metas.method },
        (method) =>
          listInitializePrivateEffect({ path }, context, {
            kind: node.kind,
            target: null,
            key: key.value,
            value: method,
          }),
      );
    }
    case "public": {
      return [
        makeConditionalEffect(
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
          [],
          [
            makeExpressionEffect(
              makeThrowErrorExpression(
                "TypeError",
                "Cannot assign method",
                path,
              ),
              path,
            ),
          ],
          path,
        ),
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
 *     keys: { [k in unbuild.Path]: Key },
 *     konstructor: Cache,
 *     prototype: Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildMethodPass = (
  site,
  context,
  { keys, konstructor, prototype },
) =>
  flatMap(
    filterNarrow(
      drillArray(drill(site, ["body"]).body),
      isMethodDefinitionSite,
    ),
    ({ node, path, meta }) =>
      unbuildMethod({ node, path, meta }, context, {
        key: keys[path],
        konstructor,
        prototype,
      }),
  );

///////////////////
// Property Pass //
///////////////////

/**
 * @type {(
 *   site: Site<estree.PropertyDefinition>,
 *   context: Context,
 *   options: {
 *     key: Key,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const unbuildProperty = ({ node, path, meta }, context, { key }) => {
  const metas = splitMeta(meta, ["drill", "target", "descriptor", "value"]);
  const site = drill({ node, path, meta: metas.drill }, ["value"]).value;
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
        makeConditionalEffect(
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
          [],
          [
            makeExpressionEffect(
              makeThrowErrorExpression(
                "TypeError",
                "Cannot assign instance property",
                path,
              ),
              path,
            ),
          ],
          path,
        ),
      ];
    }
    case "private": {
      return listInitCacheEffect(
        "constant",
        makeReadThisExpression({ path }, context),
        { path, meta: metas.target },
        (target) =>
          listInitCacheEffect(
            "constant",
            value,
            { path, meta: metas.value },
            (value) =>
              listInitializePrivateEffect({ path }, context, {
                kind: "property",
                target,
                key: key.value,
                value,
              }),
          ),
      );
    }
    default: {
      throw new AranTypeError("invalid key", key);
    }
  }
};

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
      return [
        makeBlockStatement(
          makeScopeControlBlock(
            context,
            {
              link: null,
              kinds: {
                ...hoistBlock(context.mode, node.body),
                ...hoistClosure(context.mode, node.body),
              },
            },
            [],
            (context) =>
              listBodyStatement(
                drillArray(drill({ node, path, meta }, ["body"]).body),
                context,
                {
                  parent: "block",
                  labels: [],
                  completion: null,
                  loop: {
                    break: null,
                    continue: null,
                  },
                },
              ),
            path,
          ),
          path,
        ),
      ];
    }
    case "PropertyDefinition": {
      if (hasOwn(keys, path)) {
        return map(
          unbuildProperty({ node, path, meta }, context, {
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
const unbuildClassPropertyPass = (
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

/**
 * @type {(
 *   site: Site<estree.ClassBody>,
 *   context: Context,
 *   options: {
 *     common: PrivateCommon,
 *     keys: {[k in unbuild.Path]: Key},
 *     field: WritableCache,
 *     konstructor: Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const unbuildInstancePropertyPass = (
  { node, path, meta },
  context,
  { common, keys, field, konstructor },
) => {
  const metas = splitMeta(meta, ["drill", "block", "this"]);
  const sites = filterNarrow(
    drillArray(drill({ node, path, meta: metas.drill }, ["body"]).body),
    isInstancePropertySite,
  );
  return listWriteCacheEffect(
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
              [
                ...map(
                  listInitCacheEffect(
                    "constant",
                    makeReadThisExpression({ path }, context),
                    { path, meta: metas.this },
                    (target) =>
                      listRegisterPrivateManyEffect({ path }, context, {
                        common,
                        target,
                      }),
                  ),
                  (node) => makeEffectStatement(node, path),
                ),
                ...flatMap(sites, ({ node, path, meta }) => {
                  if (hasOwn(keys, path)) {
                    const key = keys[path];
                    return map(
                      unbuildProperty({ node, path, meta }, context, {
                        key,
                      }),
                      (node) => makeEffectStatement(node, path),
                    );
                  } else {
                    throw new AranError("missing key", { keys, path });
                  }
                }),
              ],
              makePrimitiveExpression({ undefined: null }, path),
              path,
            ),
        },
      ),
      path,
    ),
    path,
  );
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
    "key_pass",
    "private_pass",
    "constructor_pass",
    "method_pass",
    "class_property_pass",
    "instance_property_pass",
    // cache //
    "private",
    "field",
    "konstructor",
    "prototype",
    "self",
  ]);
  return unbuildPrivatePass({ node, path, meta: metas.private_pass }, context, {
    kontinue: (entries) =>
      declarePrivate({ path, meta: metas.private }, context, {
        entries,
        kontinue: (context, common) =>
          unbuildKeyPass({ node, path, meta: metas.key_pass }, context, {
            kontinue: (keys) =>
              makeInitCacheExpression(
                "writable",
                makePrimitiveExpression({ undefined: null }, path),
                { path, meta: metas.field },
                (field) =>
                  makeInitCacheExpression(
                    "constant",
                    unbuildConstructorBody(
                      { node, path, meta: metas.constructor_pass },
                      context,
                      { name, derived: zuper !== null, field },
                    ),
                    { path, meta: metas.konstructor },
                    (konstructor) =>
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
                              ...listRegisterPrivateSingletonEffect(
                                { path },
                                context,
                                { common, target: konstructor },
                              ),
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
                                          makeReadCacheExpression(
                                            prototype,
                                            path,
                                          ),
                                          makeConditionalExpression(
                                            makeBinaryExpression(
                                              "==",
                                              makeReadCacheExpression(
                                                zuper,
                                                path,
                                              ),
                                              makePrimitiveExpression(
                                                null,
                                                path,
                                              ),
                                              path,
                                            ),
                                            makePrimitiveExpression(null, path),
                                            makeGetExpression(
                                              makeReadCacheExpression(
                                                zuper,
                                                path,
                                              ),
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
                                      ? makeIntrinsicExpression(
                                          "Function.prototype",
                                          path,
                                        )
                                      : makeConditionalExpression(
                                          makeBinaryExpression(
                                            "===",
                                            makeReadCacheExpression(
                                              zuper,
                                              path,
                                            ),
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
                              ...unbuildMethodPass(
                                { node, path, meta: metas.method_pass },
                                context,
                                { keys, konstructor, prototype },
                              ),
                              ...unbuildClassPropertyPass(
                                { node, path, meta: metas.class_property_pass },
                                context,
                                { keys, konstructor },
                              ),
                              ...unbuildInstancePropertyPass(
                                {
                                  node,
                                  path,
                                  meta: metas.instance_property_pass,
                                },
                                context,
                                { keys, konstructor, field, common },
                              ),
                            ],
                            makeReadCacheExpression(konstructor, path),
                            path,
                          ),
                      ),
                  ),
              ),
          }),
      }),
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
    const body = [
      ...(node.superClass != null ? [node.superClass] : []),
      ...map(filterNarrow(node.body.body, isDefinitionNode), getKey),
    ];
    const asynchronous = hasClosureNode(body, isAwaitExpression);
    const generator = hasClosureNode(body, isYieldExpression);
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
          // This might throw in derived class but c'mon...
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
