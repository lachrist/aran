import {
  filterNarrow,
  findFirstIndex,
  findLastIndex,
  flatMap,
  hasOwn,
  map,
  mapIndex,
  pairup,
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
import { unbuildExpression, unbuildNameExpression } from "./expression.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildKey } from "./key.mjs";
import { listBodyStatement } from "./statement.mjs";
import { makeEarlyErrorExpression } from "../early-error.mjs";
import {
  makeReadCacheExpression,
  listWriteCacheEffect,
  cacheSelf,
  cacheConstant,
  cacheWritable,
} from "../cache.mjs";
import { makeIsConstructorExpression } from "../helper.mjs";
import { hasFreeVariable, hoistBlock, hoistClosure } from "../query/index.mjs";
import {
  bindSequence,
  flatSequence,
  initSequence,
  mapSequence,
  mapTwoSequence,
  sequenceClosureBlock,
  sequenceControlBlock,
  sequenceEffect,
  sequenceExpression,
  sequenceStatement,
  zeroSequence,
} from "../sequence.mjs";
import { drillDeepSite, drillSite, drillVeryDeepSite } from "../site.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  extendScope,
  getMode,
  listScopeSaveEffect,
  makeScopeLoadExpression,
  setupClosureFrame,
  setupFakeFrame,
  setupPrivateFrame,
  setupRegularStaticFrame,
} from "../scope/index.mjs";
import { makeNameExpression } from "../name.mjs";
import { makeKeyExpression } from "../member.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

/**
 * @type {(
 *   node: (
 *     | estree.MethodDefinition
 *     | estree.PropertyDefinition
 *     | estree.StaticBlock
 *   ),
 * ) => node is (
 *   | estree.MethodDefinition
 *   | estree.PropertyDefinition
 * )}
 */
export const isDefinitionNode = (node) =>
  node.type === "PropertyDefinition" || node.type === "MethodDefinition";

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.MethodDefinition
 *     | estree.PropertyDefinition
 *     | estree.StaticBlock
 *   )>,
 * ) => site is import("../site").Site<(
 *   | estree.MethodDefinition
 *   | estree.PropertyDefinition
 * )>}
 */
export const isDefinitionSite = (site) => isDefinitionNode(site.node);

//////////////
// Key Pass //
//////////////

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {},
 * ) => import("../sequence.d.ts").EffectSequence<
 *   Record<unbuild.Path, import("./key").Key>
 * >}
 */
const unbuildKeyPass = ({ node, path, meta }, scope, {}) =>
  mapSequence(
    flatSequence(
      map(
        filterNarrow(
          mapIndex(node.body.length, (index) =>
            drillDeepSite(
              node,
              path,
              forkMeta((meta = nextMeta(meta))),
              "body",
              index,
            ),
          ),
          isDefinitionSite,
        ),
        ({ node, path, meta }) =>
          mapSequence(
            unbuildKey(drillSite(node, path, meta, "key"), scope, {
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

const PRIVATE_KIND = {
  method: /** @type {"method"} */ ("method"),
  get: /** @type {"getter"} */ ("getter"),
  set: /** @type {"setter"} */ ("setter"),
};

/**
 * @type {(
 *   site: (
 *     | estree.StaticBlock
 *     | estree.PropertyDefinition
 *     | estree.MethodDefinition
 *   ),
 * ) => [
 *   estree.PrivateKey,
 *   import("../scope/private").PrivateKind,
 * ][]}
 */
const listPrivateEntry = (node) => {
  switch (node.type) {
    case "StaticBlock": {
      return [];
    }
    case "MethodDefinition": {
      if (
        node.key.type === "PrivateIdentifier" &&
        node.kind !== "constructor"
      ) {
        return [
          [
            /** @type {estree.PrivateKey} */ (node.key.name),
            `${node.static ? "singleton" : "collection"}-${
              PRIVATE_KIND[node.kind]
            }`,
          ],
        ];
      } else {
        return [];
      }
    }
    case "PropertyDefinition": {
      if (node.key.type === "PrivateIdentifier") {
        return [
          [
            /** @type {estree.PrivateKey} */ (node.key.name),
            `${node.static ? "singleton" : "collection"}-property`,
          ],
        ];
      } else {
        return [];
      }
    }
    default: {
      throw new AranTypeError("invalid class node", node);
    }
  }
};

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.ClassBody>,
 * ) => import("../sequence.d.ts").EffectSequence<
 *   import("../scope/private").PrivateFrame
 * >}
 */
const unbuildPrivatePass = ({ node, path, meta }) =>
  setupPrivateFrame({ path, meta }, flatMap(node.body, listPrivateEntry));

//////////////////////
// Constructor Pass //
//////////////////////

/**
 * @type {(
 *   site: import("../site").Site<estree.ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     derived: boolean,
 *     field: import("../cache").Cache,
 *     name: import("../name.js").Name,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeDefaultConstructor = (
  { path, meta },
  scope,
  { derived, field, name },
) =>
  sequenceExpression(
    mapSequence(
      cacheSelf(
        forkMeta((meta = nextMeta(meta))),
        (self) =>
          // no yield|await here
          makeFunctionExpression(
            false,
            false,
            sequenceClosureBlock(
              mapSequence(
                mapTwoSequence(
                  setupClosureFrame(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    {
                      type: "closure-constructor",
                      derived,
                      self,
                      field,
                    },
                    { mode: getMode(scope) },
                  ),
                  setupRegularStaticFrame({ path }, scope, {
                    mode: getMode(scope),
                    exports: {},
                  }),
                  (frame1, frame2) =>
                    extendScope(extendScope(scope, frame1), frame2),
                ),
                (scope) => ({
                  body: derived
                    ? sequenceStatement(
                        mapSequence(
                          cacheConstant(
                            forkMeta((meta = nextMeta(meta))),
                            makeScopeLoadExpression(
                              { path, meta: forkMeta((meta = nextMeta(meta))) },
                              scope,
                              { type: "read-input", mode: getMode(scope) },
                            ),
                            path,
                          ),
                          (input) =>
                            map(
                              listScopeSaveEffect(
                                {
                                  path,
                                  meta: forkMeta((meta = nextMeta(meta))),
                                },
                                scope,
                                {
                                  type: "call-super",
                                  mode: getMode(scope),
                                  input,
                                },
                              ),
                              (node) => makeEffectStatement(node, path),
                            ),
                        ),
                        path,
                      )
                    : [],
                  completion: makeScopeLoadExpression(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    scope,
                    { type: "wrap-result", mode: getMode(scope), result: null },
                  ),
                }),
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
                      value: makeNameExpression({ path }, name),
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

/**
 * @type {(
 *   node: (
 *     | estree.StaticBlock
 *     | estree.PropertyDefinition
 *     | estree.MethodDefinition
 *   ),
 * ) => boolean}
 */
const isConstructor = (node) =>
  node.type === "MethodDefinition" && node.kind === "constructor";

/**
 * @type {(
 *   site: import("../site").Site<estree.ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     derived: boolean,
 *     name: import("../name").Name,
 *     field: import("../cache").Cache,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const unbuildConstructorPass = (
  { node, path, meta },
  scope,
  { name, derived, field },
) => {
  const index = findFirstIndex(node.body, isConstructor);
  if (index === -1) {
    return makeDefaultConstructor({ node, path, meta }, scope, {
      derived,
      name,
      field,
    });
  } else if (index === findLastIndex(node.body, isConstructor)) {
    return unbuildFunction(
      drillVeryDeepSite(
        /** @type {{body: estree.MethodDefinition[]}} */ (node),
        path,
        meta,
        "body",
        index,
        "value",
      ),
      scope,
      {
        type: "constructor",
        derived,
        name,
        field,
      },
    );
  } else {
    return makeEarlyErrorExpression("multiple constructor definitions", path);
  }
};

/////////////////
// Method Pass //
/////////////////

const METHOD_KIND = {
  method: /** @type {"init"} */ ("init"),
  get: /** @type {"get"} */ ("get"),
  set: /** @type {"set"} */ ("set"),
};

/**
 * @type {(
 *   site: import("../site").Site<estree.MethodDefinition & {
 *     kind: "method" | "get" | "set",
 *   }>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     key: import("./key").Key,
 *     konstructor: import("../cache").Cache,
 *     prototype: import("../cache").Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildMethod = (
  { node, path, meta },
  scope,
  { key, konstructor, prototype },
) => {
  const method = unbuildFunction(
    drillSite(node, path, forkMeta((meta = nextMeta(meta))), "value"),
    scope,
    {
      type: "method",
      name: {
        type: "property",
        kind: METHOD_KIND[node.kind],
        key,
      },
      proto: node.static ? konstructor : prototype,
    },
  );
  switch (key.access) {
    case "private": {
      return sequenceEffect(
        mapSequence(
          cacheConstant(forkMeta((meta = nextMeta(meta))), method, path),
          (method) =>
            listScopeSaveEffect(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              scope,
              {
                type: "initialize-private",
                mode: getMode(scope),
                kind: PRIVATE_KIND[node.kind],
                key: key.value,
                value: method,
              },
            ),
        ),
        path,
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
              makeKeyExpression({ path }, key),
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
 *   site: import("../site").Site<(
 *     | estree.MethodDefinition
 *     | estree.PropertyDefinition
 *     | estree.StaticBlock
 *   )>,
 * ) => site is import("../site").Site<estree.MethodDefinition & {
 *   kind: "method" | "get" | "set",
 * }>}
 */
const isMethodDefinitionSite = (site) =>
  site.node.type === "MethodDefinition" &&
  (site.node.kind === "method" ||
    site.node.kind === "get" ||
    site.node.kind === "set");

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     keys: { [k in unbuild.Path]: import("./key").Key },
 *     konstructor: import("../cache.d.ts").Cache,
 *     prototype: import("../cache.d.ts").Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildMethodPass = (
  { node, path, meta },
  scope,
  { keys, konstructor, prototype },
) =>
  flatMap(
    filterNarrow(
      mapIndex(node.body.length, (index) =>
        drillDeepSite(
          node,
          path,
          forkMeta((meta = nextMeta(meta))),
          "body",
          index,
        ),
      ),
      isMethodDefinitionSite,
    ),
    (site) =>
      unbuildMethod(site, scope, {
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
 *   node: estree.PropertyDefinition,
 * ) => node is estree.PropertyDefinition & {
 *   value: estree.Expression,
 * }}
 */
const hasPropertyValue = (node) => node.value != null;

/**
 * @type {(
 *   site: import("../site").Site<estree.PropertyDefinition>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     key: import("./key").Key,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const unbuildProperty = ({ node, path, meta }, scope, { key }) => {
  const value = hasPropertyValue(node)
    ? unbuildNameExpression(
        drillSite(node, path, forkMeta((meta = nextMeta(meta))), "value"),
        scope,
        {
          name: {
            type: "property",
            kind: "init",
            key,
          },
        },
      )
    : makePrimitiveExpression({ undefined: null }, path);
  switch (key.access) {
    case "private": {
      return sequenceEffect(
        bindSequence(
          cacheConstant(
            forkMeta((meta = nextMeta(meta))),
            makeScopeLoadExpression(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              scope,
              {
                type: "read-this",
                mode: getMode(scope),
              },
            ),
            path,
          ),
          (target) =>
            bindSequence(
              cacheConstant(forkMeta((meta = nextMeta(meta))), value, path),
              (value) =>
                zeroSequence(
                  listScopeSaveEffect(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    scope,
                    {
                      type: "define-private",
                      mode: getMode(scope),
                      target,
                      key: key.value,
                      value,
                    },
                  ),
                ),
            ),
        ),
        path,
      );
    }
    case "public": {
      return [
        makeConditionalEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.defineProperty", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeScopeLoadExpression(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                {
                  type: "read-this",
                  mode: getMode(scope),
                },
              ),
              makeKeyExpression({ path }, key),
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
 *     keys: {[k in unbuild.Path]: import("./key").Key},
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
const unbuildStatic = ({ node, path, meta }, scope, { keys }) => {
  switch (node.type) {
    case "StaticBlock": {
      return [
        makeBlockStatement(
          sequenceControlBlock(
            mapSequence(
              mapSequence(
                setupRegularStaticFrame(
                  { path },
                  {
                    ...hoistBlock(getMode(scope), node.body),
                    ...hoistClosure(getMode(scope), node.body),
                  },
                  {
                    mode: getMode(scope),
                    exports: {},
                  },
                ),
                (frame) => extendScope(scope, frame),
              ),
              (scope) => ({
                body: listBodyStatement(
                  drillSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "body",
                  ),
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
              }),
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
 *   site: import("../site").Site<(
 *     | estree.MethodDefinition
 *     | estree.PropertyDefinition
 *     | estree.StaticBlock
 *   )>,
 * ) => site is import("../site").Site<(
 *   | estree.StaticBlock
 *   | estree.PropertyDefinition & { static: true }
 * )>}
 */
const isStaticSite = (site) =>
  site.node.type === "StaticBlock" ||
  (site.node.type === "PropertyDefinition" && site.node.static);

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     keys: {[k in unbuild.Path]: import("./key").Key},
 *     konstructor: import("../cache.d.ts").Cache,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const unbuildClassPropertyPass = (
  { node, path, meta },
  scope,
  { keys, konstructor },
) =>
  makeFunctionExpression(
    false,
    false,
    sequenceClosureBlock(
      mapSequence(
        mapTwoSequence(
          setupClosureFrame(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            {
              type: "closure-method",
              proto: konstructor,
            },
            { mode: getMode(scope) },
          ),
          setupRegularStaticFrame(
            { path },
            {},
            { mode: getMode(scope), exports: {} },
          ),
          (frame1, frame2) => extendScope(extendScope(scope, frame1), frame2),
        ),
        (scope) => ({
          body: [
            ...flatMap(
              filterNarrow(
                mapIndex(node.body.length, (index) =>
                  drillDeepSite(node, path, meta, "body", index),
                ),
                isStaticSite,
              ),
              (site) => unbuildStatic(site, scope, { keys }),
            ),
          ],
          completion: makePrimitiveExpression({ undefined: null }, path),
        }),
      ),
      path,
    ),
    path,
  );

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.MethodDefinition
 *     | estree.PropertyDefinition
 *     | estree.StaticBlock
 *   )>,
 * ) => site is import("../site").Site<(
 *   estree.PropertyDefinition & { static: false }
 * )>}
 */
const isInstanceSite = (site) =>
  site.node.type === "StaticBlock" ||
  (site.node.type === "PropertyDefinition" && site.node.static);

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     keys: {[k in unbuild.Path]: import("./key").Key},
 *     prototype: import("../cache.d.ts").Cache,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const unbuildInstancePropertyPass = (
  { node, path, meta },
  scope,
  { keys, prototype }, // await|yield forbidden here
) =>
  makeFunctionExpression(
    false,
    false,
    sequenceClosureBlock(
      mapSequence(
        mapTwoSequence(
          setupClosureFrame(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            {
              type: "closure-method",
              proto: prototype,
            },
            { mode: getMode(scope) },
          ),
          setupRegularStaticFrame(
            { path },
            {},
            { mode: getMode(scope), exports: {} },
          ),
          (frame1, frame2) => extendScope(extendScope(scope, frame1), frame2),
        ),
        (scope) => ({
          body: [
            ...map(
              sequenceEffect(
                mapSequence(
                  cacheConstant(
                    forkMeta((meta = nextMeta(meta))),
                    makeScopeLoadExpression(
                      { path, meta: forkMeta((meta = nextMeta(meta))) },
                      scope,
                      { type: "read-this", mode: getMode(scope) },
                    ),
                    path,
                  ),
                  (target) =>
                    listScopeSaveEffect(
                      { path, meta: forkMeta((meta = nextMeta(meta))) },
                      scope,
                      {
                        type: "register-private-collection",
                        mode: getMode(scope),
                        target,
                      },
                    ),
                ),
                path,
              ),
              (node) => makeEffectStatement(node, path),
            ),
            ...flatMap(
              filterNarrow(
                mapIndex(node.body.length, (index) =>
                  drillDeepSite(node, path, meta, "body", index),
                ),
                isInstanceSite,
              ),
              ({ node, path, meta }) => {
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
              },
            ),
          ],
          completion: makePrimitiveExpression({ undefined: null }, path),
        }),
      ),
      path,
    ),
    path,
  );

//////////
// Main //
//////////

/**
 * @type {(
 *   site: import("../site").Site<estree.ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     zuper: import("../cache").Cache | null,
 *     self: estree.Variable | null,
 *     keys: Record<unbuild.Path, import("./key").Key>,
 *     field: import("../cache").WritableCache,
 *     konstructor: import("../cache").Cache,
 *     prototype: import("../cache").Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const unbuildClassInner = (
  { node, path, meta },
  scope,
  { zuper, self, keys, field, konstructor, prototype },
) => [
  ...listScopeSaveEffect(
    { path, meta: forkMeta((meta = nextMeta(meta))) },
    scope,
    {
      type: "register-private-singleton",
      mode: getMode(scope),
      target: konstructor,
    },
  ),
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
    : listScopeSaveEffect(
        { path, meta: forkMeta((meta = nextMeta(meta))) },
        scope,
        {
          type: "initialize",
          mode: getMode(scope),
          variable: self,
          right: konstructor,
        },
      )),
  ...unbuildMethodPass(
    { node, path, meta: forkMeta((meta = nextMeta(meta))) },
    scope,
    { keys, konstructor, prototype },
  ),
  makeExpressionEffect(
    makeApplyExpression(
      unbuildClassPropertyPass(
        { node, path, meta: forkMeta((meta = nextMeta(meta))) },
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
      { node, path, meta: forkMeta((meta = nextMeta(meta))) },
      scope,
      { keys, prototype },
    ),
    path,
  ),
];

/**
 * @type {(
 *   site: import("../site").Site<estree.ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     zuper: import("../cache").Cache | null,
 *     self: estree.Variable | null,
 *     name: import("../name").Name,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const unbuildClassBody = ({ node, path, meta }, scope, { name, self, zuper }) =>
  sequenceExpression(
    bindSequence(
      mapSequence(
        unbuildPrivatePass({
          node,
          path,
          meta: forkMeta((meta = nextMeta(meta))),
        }),
        (frame) => extendScope(scope, frame),
      ),
      (scope) =>
        bindSequence(
          unbuildKeyPass(
            { node, path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            {},
          ),
          (keys) =>
            bindSequence(
              cacheWritable(
                forkMeta((meta = nextMeta(meta))),
                makePrimitiveExpression({ undefined: null }, path),
                path,
              ),
              (field) =>
                bindSequence(
                  cacheConstant(
                    forkMeta((meta = nextMeta(meta))),
                    unbuildConstructorPass(
                      { node, path, meta: forkMeta((meta = nextMeta(meta))) },
                      scope,
                      { name, derived: zuper !== null, field },
                    ),
                    path,
                  ),
                  (konstructor) =>
                    bindSequence(
                      cacheConstant(
                        forkMeta((meta = nextMeta(meta))),
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
                              meta: forkMeta((meta = nextMeta(meta))),
                            },
                            scope,
                            {
                              zuper,
                              self,
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
    path,
  );

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
 *   node: estree.Class,
 * ) => node is estree.Class & {
 *   superClass: estree.Expression,
 * }}
 */
const hasClassSuper = (node) => node.superClass != null;

/**
 * @type {(
 *   site: import("../site").Site<estree.Class>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     name: import("../name.js").Name,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildClass = ({ node, path, meta }, parent_scope, { name }) => {
  const scope = extendScope(parent_scope, { type: "mode-use-strict" });
  const self = isSelfPresent(
    node,
    hasOwn(node, "id") && node.id != null
      ? /** @type {estree.Variable} */ (node.id.name)
      : null,
  );
  return sequenceExpression(
    mapSequence(
      self === null
        ? zeroSequence(scope)
        : mapSequence(
            setupFakeFrame(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              { [self]: "const" },
              {},
            ),
            (frame) => extendScope(scope, frame),
          ),
      (scope) =>
        hasClassSuper(node)
          ? sequenceExpression(
              mapSequence(
                cacheConstant(
                  forkMeta((meta = nextMeta(meta))),
                  unbuildExpression(
                    drillSite(
                      node,
                      path,
                      forkMeta((meta = nextMeta(meta))),
                      "superClass",
                    ),
                    scope,
                    null,
                  ),
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
                    unbuildClassBody(
                      drillSite(
                        node,
                        path,
                        forkMeta((meta = nextMeta(meta))),
                        "body",
                      ),
                      scope,
                      { name, self, zuper },
                    ),
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
          : unbuildClassBody(
              drillSite(node, path, forkMeta((meta = nextMeta(meta))), "body"),
              scope,
              { name, self, zuper: null },
            ),
    ),
    path,
  );
};
