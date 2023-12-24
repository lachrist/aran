import {
  filterNarrow,
  flatMap,
  hasOwn,
  map,
  mapFailure,
  mapSuccess,
  pairup,
  recover,
} from "../../util/index.mjs";
import { AranError, AranTypeError } from "../../error.mjs";
import {
  makeAccessorDescriptorExpression,
  makeBinaryExpression,
  makeDataDescriptorExpression,
  makeGetExpression,
  makeObjectExpression,
  makeThrowErrorExpression,
} from "../intrinsic.mjs";
import { splitMeta } from "../mangle.mjs";
import {
  makeApplyExpression,
  makeBlockStatement,
  makeConditionalEffect,
  makeConditionalExpression,
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
  listRegisterPrivateManyEffect,
  listRegisterPrivateSingletonEffect,
  listSetupClosureEffect,
  makeReadFunctionArgumentsExpression,
  makeReadThisExpression,
  makeReturnArgumentExpression,
  setupPrivateDescriptor,
} from "../param/index.mjs";
import {
  extendFakeScope,
  extendStaticScope,
  listScopeInitializeEffect,
} from "../scope/index.mjs";
import { unbuildExpression, unbuildNameExpression } from "./expression.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildKey } from "./key.mjs";
import { listBodyStatement } from "./statement.mjs";
import { drill, drillArray } from "../site.mjs";
import {
  isConstructorSite,
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
  makeReadCacheExpression,
  listWriteCacheEffect,
  cacheSelf,
  cacheConstant,
  cacheWritable,
} from "../cache.mjs";
import { makeNameKeyExpression, makeReadKeyExpression } from "../key.mjs";
import { makeIsConstructorExpression } from "../helper.mjs";
import { hasFreeVariable, hoistBlock, hoistClosure } from "../query/index.mjs";
import {
  bindSequence,
  flatSequence,
  initSequence,
  listenSequence,
  mapSequence,
  sequenceClosureBlock,
  sequenceControlBlock,
  sequenceExpression,
  tellSequence,
  zeroSequence,
} from "../sequence.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

//////////////
// Key Pass //
//////////////

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {},
 * ) => import("../sequence.d.ts").EffectSequence<
 *   Record<unbuild.Path, import("../key.d.ts").Key>
 * >}
 */
const unbuildKeyPass = ({ node, path, meta }, scope, {}) =>
  mapSequence(
    flatSequence(
      map(
        filterNarrow(
          drillArray(drill({ node, path, meta }, ["body"]).body),
          isDefinitionSite,
        ),
        ({ node, path, meta }) =>
          mapSequence(
            unbuildKey(drill({ node, path, meta }, ["key"]).key, scope, {
              computed: node.computed,
            }),
            (key) => pairup(path, key),
          ),
      ),
    ),
    reduceEntry,
  );

//////////////////
// Private Pass //
//////////////////

/**
 * @type {(
 *   site: import("../site.d.ts").Site<(
 *     | estree.PropertyDefinition & { key: estree.PrivateIdentifier }
 *     | estree.MethodDefinition & {
 *       kind: "method" | "get" | "set",
 *       key: estree.PrivateIdentifier,
 *     }
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: {},
 * ) => import("../sequence.d.ts").EffectSequence<[
 *   estree.PrivateKey,
 *   import("../scope/private/dictionary.js").RawPrivateDictionary<
 *     import("../scope/private/descriptor.js").PrivateDescriptor
 *   >,
 * ]>}
 */
const unbuildPrivate = ({ node, path, meta }, scope, {}) => {
  const key = /** @type {estree.PrivateKey} */ (node.key.name);
  switch (node.type) {
    case "MethodDefinition": {
      return mapSequence(
        setupPrivateDescriptor({ path, meta }, scope, { kind: node.kind }),
        (descriptor) =>
          pairup(key, {
            type: node.static ? "constant-singleton" : "constant-many",
            descriptor,
          }),
      );
    }
    case "PropertyDefinition": {
      return zeroSequence(
        pairup(key, {
          type: node.static ? "variable-singleton" : "variable-many",
        }),
      );
    }
    default: {
      throw new AranTypeError("invalid private node", node);
    }
  }
};

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {},
 * ) => import("../sequence.d.ts").EffectSequence<[
 *   estree.PrivateKey,
 *   import("../scope/private/dictionary.js").RawPrivateDictionary<
 *     import("../scope/private/descriptor.js").PrivateDescriptor
 *   >,
 * ][]>}
 */
const unbuildPrivatePass = ({ node, path, meta }, scope, {}) =>
  flatSequence(
    map(
      filterNarrow(
        drillArray(drill({ node, path, meta }, ["body"]).body),
        isPrivateDefinitionSite,
      ),
      (site) => unbuildPrivate(site, scope, {}),
    ),
  );

//////////////////////
// Constructor Pass //
//////////////////////

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     derived: boolean,
 *     field: import("../cache.d.ts").Cache,
 *     name: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeDefaultConstructor = (
  { path, meta },
  scope,
  { derived, field, name },
) => {
  const metas = splitMeta(meta, ["self", "setup", "super", "return"]);
  return sequenceExpression(
    mapSequence(
      cacheSelf(
        metas.self,
        (self) =>
          // no yield|await here
          makeFunctionExpression(
            false,
            false,
            sequenceClosureBlock(
              bindSequence(
                extendStaticScope(
                  { path },
                  {
                    ...scope,
                    closure: extendClosure(scope.closure, {
                      type: "constructor",
                      derived,
                      self,
                      field,
                    }),
                  },
                  {
                    frame: { situ: "local", link: null, kinds: {} },
                  },
                ),
                (scope) =>
                  initSequence(
                    [
                      ...map(
                        listSetupClosureEffect(
                          { path, meta: metas.setup },
                          scope,
                        ),
                        (node) => makeEffectStatement(node, path),
                      ),
                      ...(derived
                        ? map(
                            listCallSuperEffect(
                              { path, meta: metas.super },
                              scope,
                              {
                                input: makeReadFunctionArgumentsExpression(
                                  scope,
                                  {
                                    path,
                                  },
                                ),
                              },
                            ),
                            (node) => makeEffectStatement(node, path),
                          )
                        : []),
                    ],
                    makeReturnArgumentExpression(
                      {
                        path,
                        meta: metas.return,
                      },
                      scope,
                      { argument: null },
                    ),
                  ),
              ),
              path,
            ),
            path,
          ),
        path,
      ),
      (konstructor) =>
        makeSequenceExpression(
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
    ),
    path,
  );
};

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     derived: boolean,
 *     name: aran.Expression<unbuild.Atom>,
 *     field: import("../cache.d.ts").Cache,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const unbuildConstructorPass = (
  { node, path, meta },
  scope,
  { name, derived, field },
) => {
  const sites = filterNarrow(
    drillArray(drill({ node, path, meta }, ["body"]).body),
    isConstructorSite,
  );
  switch (sites.length) {
    case 0: {
      return makeDefaultConstructor({ node, path, meta }, scope, {
        derived,
        name,
        field,
      });
    }
    case 1: {
      return unbuildFunction(drill(sites[0], ["value"]).value, scope, {
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
 *   site: import("../site.d.ts").Site<estree.MethodDefinition & {
 *     kind: "method" | "get" | "set",
 *   }>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     key: import("../key.d.ts").Key,
 *     konstructor: import("../cache.d.ts").Cache,
 *     prototype: import("../cache.d.ts").Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildMethod = (
  { node, path, meta },
  scope,
  { key, konstructor, prototype },
) => {
  const metas = splitMeta(meta, ["drill", "method"]);
  const method = unbuildFunction(
    drill({ node, path, meta: metas.drill }, ["value"]).value,
    scope,
    {
      type: "method",
      name: makeNameKeyExpression(key, node.kind, path),
      proto: node.static ? konstructor : prototype,
    },
  );
  switch (key.access) {
    case "private": {
      return listenSequence(
        bindSequence(cacheConstant(metas.method, method, path), (method) =>
          tellSequence(
            listInitializePrivateEffect({ path }, scope, {
              kind: node.kind,
              target: null,
              key: key.value,
              value: method,
            }),
          ),
        ),
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
 *   site: import("../site.d.ts").Site<estree.ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     keys: { [k in unbuild.Path]: import("../key.d.ts").Key },
 *     konstructor: import("../cache.d.ts").Cache,
 *     prototype: import("../cache.d.ts").Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildMethodPass = (
  site,
  scope,
  { keys, konstructor, prototype },
) =>
  flatMap(
    filterNarrow(
      drillArray(drill(site, ["body"]).body),
      isMethodDefinitionSite,
    ),
    ({ node, path, meta }) =>
      unbuildMethod({ node, path, meta }, scope, {
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
 *   site: import("../site.d.ts").Site<estree.PropertyDefinition>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     key: import("../key.d.ts").Key,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const unbuildProperty = ({ node, path, meta }, scope, { key }) => {
  const metas = splitMeta(meta, ["drill", "target", "value"]);
  const site = drill({ node, path, meta: metas.drill }, ["value"]).value;
  const value = isNotNullishSite(site)
    ? isNameSite(site)
      ? unbuildNameExpression(site, scope, {
          name: makeNameKeyExpression(key, "init", path),
        })
      : unbuildExpression(site, scope, {})
    : makePrimitiveExpression({ undefined: null }, path);
  switch (key.access) {
    case "public": {
      return [
        makeConditionalEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.defineProperty", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeReadThisExpression({ path }, scope),
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
      return listenSequence(
        bindSequence(
          cacheConstant(
            metas.target,
            makeReadThisExpression({ path }, scope),
            path,
          ),
          (target) =>
            bindSequence(cacheConstant(metas.value, value, path), (value) =>
              tellSequence(
                listInitializePrivateEffect({ path }, scope, {
                  kind: "property",
                  target,
                  key: key.value,
                  value,
                }),
              ),
            ),
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
 *   site: import("../site.d.ts").Site<(
 *     | estree.StaticBlock
 *     | estree.PropertyDefinition & { static: true }
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     keys: {[k in unbuild.Path]: import("../key.d.ts").Key},
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
const unbuildStatic = ({ node, path, meta }, scope, { keys }) => {
  switch (node.type) {
    case "StaticBlock": {
      return [
        makeBlockStatement(
          sequenceControlBlock(
            bindSequence(
              extendStaticScope({ path }, scope, {
                frame: {
                  situ: "local",
                  link: null,
                  kinds: {
                    ...hoistBlock(scope.mode, node.body),
                    ...hoistClosure(scope.mode, node.body),
                  },
                },
              }),
              (scope) =>
                tellSequence(
                  listBodyStatement(
                    drillArray(drill({ node, path, meta }, ["body"]).body),
                    scope,
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
                ),
            ),
            [],
            path,
          ),
          path,
        ),
      ];
    }
    case "PropertyDefinition": {
      if (hasOwn(keys, path)) {
        return map(
          unbuildProperty({ node, path, meta }, scope, {
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
 *   site: import("../site.d.ts").Site<estree.ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     keys: {[k in unbuild.Path]: import("../key.d.ts").Key},
 *     konstructor: import("../cache.d.ts").Cache,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const unbuildClassPropertyPass = (
  { node, path, meta },
  scope,
  { keys, konstructor },
) => {
  const metas = splitMeta(meta, ["drill", "setup"]);
  return makeFunctionExpression(
    false,
    false,
    sequenceClosureBlock(
      bindSequence(
        extendStaticScope(
          { path },
          {
            ...scope,
            closure: extendClosure(scope.closure, {
              type: "method",
              proto: konstructor,
            }),
          },
          {
            frame: { situ: "local", link: null, kinds: {} },
          },
        ),
        (scope) =>
          initSequence(
            [
              ...map(
                listSetupClosureEffect({ path, meta: metas.setup }, scope),
                (node) => makeEffectStatement(node, path),
              ),
              ...flatMap(
                filterNarrow(
                  drillArray(
                    drill({ node, path, meta: metas.drill }, ["body"]).body,
                  ),
                  isStaticSite,
                ),
                (site) => unbuildStatic(site, scope, { keys }),
              ),
            ],
            makePrimitiveExpression({ undefined: null }, path),
          ),
      ),
      path,
    ),
    path,
  );
};

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     common: import("../scope/private/dictionary.js").PrivateCommon,
 *     keys: {[k in unbuild.Path]: import("../key.d.ts").Key},
 *     prototype: import("../cache.d.ts").Cache,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const unbuildInstancePropertyPass = (
  { node, path, meta },
  scope,
  { common, keys, prototype },
) => {
  const metas = splitMeta(meta, ["drill", "setup", "this"]);
  const sites = filterNarrow(
    drillArray(drill({ node, path, meta: metas.drill }, ["body"]).body),
    isInstancePropertySite,
  );
  // await|yield forbidden here
  return makeFunctionExpression(
    false,
    false,
    sequenceClosureBlock(
      bindSequence(
        extendStaticScope(
          { path },
          {
            ...scope,
            closure: extendClosure(scope.closure, {
              type: "method",
              proto: prototype,
            }),
          },
          {
            frame: { situ: "local", link: null, kinds: {} },
          },
        ),
        (scope) =>
          initSequence(
            [
              ...map(
                listSetupClosureEffect({ path, meta: metas.setup }, scope),
                (node) => makeEffectStatement(node, path),
              ),
              ...map(
                listenSequence(
                  bindSequence(
                    cacheConstant(
                      metas.this,
                      makeReadThisExpression({ path }, scope),
                      path,
                    ),
                    (target) =>
                      tellSequence(
                        listRegisterPrivateManyEffect({ path }, scope, {
                          common,
                          target,
                        }),
                      ),
                  ),
                ),
                (node) => makeEffectStatement(node, path),
              ),
              ...flatMap(sites, ({ node, path, meta }) => {
                if (hasOwn(keys, path)) {
                  const key = keys[path];
                  return map(
                    unbuildProperty({ node, path, meta }, scope, {
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
          ),
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
 *   site: import("../site.d.ts").Site<estree.ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     zuper: import("../cache.d.ts").Cache | null,
 *     self: estree.Variable | null,
 *     common: import("../scope/private/dictionary.js").PrivateCommon,
 *     keys: Record<unbuild.Path, import("../key.d.ts").Key>,
 *     field: import("../cache.d.ts").WritableCache,
 *     konstructor: import("../cache.d.ts").Cache,
 *     prototype: import("../cache.d.ts").Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const unbuildClassInner = (
  { node, path, meta },
  scope,
  { zuper, self, common, keys, field, konstructor, prototype },
) => {
  const metas = splitMeta(meta, [
    "self",
    "method",
    "class_property",
    "instance_property",
  ]);
  return [
    ...listRegisterPrivateSingletonEffect({ path }, scope, {
      common,
      target: konstructor,
    }),
    ...(zuper === null
      ? []
      : [
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.setPrototypeOf", path),
              makePrimitiveExpression({ undefined: null }, path),
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
                    makePrimitiveExpression("prototype", path),
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
        makeIntrinsicExpression("Reflect.setPrototypeOf", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeReadCacheExpression(konstructor, path),
          zuper === null
            ? makeIntrinsicExpression("Function.prototype", path)
            : makeConditionalExpression(
                makeBinaryExpression(
                  "===",
                  makeReadCacheExpression(zuper, path),
                  makePrimitiveExpression(null, path),
                  path,
                ),
                makeIntrinsicExpression("Function.prototype", path),
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
      : listScopeInitializeEffect({ path, meta: metas.self }, scope, {
          variable: self,
          right: makeReadCacheExpression(konstructor, path),
        })),
    ...unbuildMethodPass({ node, path, meta: metas.method }, scope, {
      keys,
      konstructor,
      prototype,
    }),
    makeExpressionEffect(
      makeApplyExpression(
        unbuildClassPropertyPass(
          { node, path, meta: metas.class_property },
          scope,
          { keys, konstructor },
        ),
        makeReadCacheExpression(konstructor, path),
        [],
        path,
      ),
      path,
    ),
    ...listWriteCacheEffect(
      field,
      unbuildInstancePropertyPass(
        {
          node,
          path,
          meta: metas.instance_property,
        },
        scope,
        { common, keys, prototype },
      ),
      path,
    ),
  ];
};

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     zuper: import("../cache.d.ts").Cache | null,
 *     self: estree.Variable | null,
 *     name: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const unbuildClassBody = (
  { node, path, meta },
  scope,
  { name, self, zuper },
) => {
  const metas = splitMeta(meta, [
    // pass //
    "key_pass",
    "private_pass",
    "constructor_pass",
    // cache //
    "body",
    "private",
    "field",
    "konstructor",
    "prototype",
  ]);
  return sequenceExpression(
    bindSequence(
      unbuildPrivatePass({ node, path, meta: metas.private_pass }, scope, {}),
      (entries) =>
        bindSequence(
          declarePrivate({ path, meta: metas.private }, scope, { entries }),
          (outcome) =>
            recover(
              mapSuccess(
                mapFailure(outcome, (message) =>
                  zeroSequence(makeSyntaxErrorExpression(message, path)),
                ),
                ({ scope, common }) =>
                  bindSequence(
                    unbuildKeyPass(
                      { node, path, meta: metas.key_pass },
                      scope,
                      {},
                    ),
                    (keys) =>
                      bindSequence(
                        cacheWritable(
                          metas.field,
                          makePrimitiveExpression({ undefined: null }, path),
                          path,
                        ),
                        (field) =>
                          bindSequence(
                            cacheConstant(
                              metas.konstructor,
                              unbuildConstructorPass(
                                { node, path, meta: metas.constructor_pass },
                                scope,
                                { name, derived: zuper !== null, field },
                              ),
                              path,
                            ),
                            (konstructor) =>
                              bindSequence(
                                cacheConstant(
                                  metas.prototype,
                                  makeGetExpression(
                                    makeReadCacheExpression(konstructor, path),
                                    makePrimitiveExpression("prototype", path),
                                    path,
                                  ),
                                  path,
                                ),
                                (prototype) =>
                                  initSequence(
                                    unbuildClassInner(
                                      {
                                        node,
                                        path,
                                        meta: metas.body,
                                      },
                                      scope,
                                      {
                                        zuper,
                                        self,
                                        common,
                                        keys,
                                        field,
                                        konstructor,
                                        prototype,
                                      },
                                    ),
                                    makeReadCacheExpression(konstructor, path),
                                  ),
                              ),
                          ),
                      ),
                  ),
              ),
            ),
        ),
    ),
    path,
  );
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
 *   scope: import("../scope").Scope,
 *   options: {
 *     name: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildClass = ({ node, path, meta }, scope, { name }) => {
  const metas = splitMeta(meta, ["drill", "super", "fake"]);
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
  return sequenceExpression(
    mapSequence(
      extendFakeScope(
        { path, meta: metas.fake },
        { ...scope, mode: /** @type {"strict"} */ ("strict") },
        {
          frame: self === null ? {} : { [self]: "const" },
        },
      ),
      (scope) =>
        isNotNullishSite(sites.superClass)
          ? sequenceExpression(
              mapSequence(
                cacheConstant(
                  metas.super,
                  unbuildExpression(sites.superClass, scope, {}),
                  path,
                ),
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
                    unbuildClassBody(sites.body, scope, {
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
              ),
              path,
            )
          : unbuildClassBody(sites.body, scope, {
              name,
              self,
              zuper: null,
            }),
    ),
    path,
  );
};
