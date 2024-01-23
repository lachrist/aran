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
  makeThrowErrorExpression,
} from "../intrinsic.mjs";
import {
  EMPTY_EFFECT,
  EMPTY_STATEMENT,
  concatEffect,
  concatStatement,
  makeApplyExpression,
  makeBlockStatement,
  makeClosureBlock,
  makeClosureBody,
  makeConditionalEffect,
  makeConditionalExpression,
  makeControlBlock,
  makeControlBody,
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
  cacheConstant,
  cacheWritable,
} from "../cache.mjs";
import { makeIsConstructorExpression } from "../helper.mjs";
import { hasFreeVariable, hoistBlock, hoistClosure } from "../query/index.mjs";
import {
  bindSequence,
  flatSequence,
  mapSequence,
  mapTwoSequence,
} from "../sequence.mjs";
import {
  drillDeepSite,
  drillSite,
  drillSiteArray,
  drillVeryDeepSite,
} from "../site.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  extendScope,
  getMode,
  listScopeSaveEffect,
  makeIllegalFrame,
  makeScopeLoadExpression,
  setupClosureFrame,
  setupPrivateFrame,
  setupRegularFrame,
} from "../scope/index.mjs";
import { makeNameExpression } from "../name.mjs";
import { makeKeyExpression } from "../key.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

const ARGUMENTS = /** @type {estree.Variable} */ ("arguments");

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
 *   site: import("../site").Site<estree.ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {},
 * ) => import("../sequence").Sequence<
 *   import("../prelude").NodePrelude,
 *   { [k in unbuild.Path] ?: import("../key").Key },
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
              eager_cooking: true,
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
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   site: import("../site").Site<estree.ClassBody>,
 * ) => import("../sequence").Sequence<
 *   import("../prelude").NodePrelude,
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
 * ) => import("../sequence").ExpressionSequence}
 */
const makeDefaultConstructor = (
  { path, meta },
  scope,
  { derived, field, name },
) =>
  bindSequence(
    cacheWritable(
      forkMeta((meta = nextMeta(meta))),
      makePrimitiveExpression({ undefined: null }, path),
      path,
    ),
    (self) =>
      makeSequenceExpression(
        concatEffect([
          listWriteCacheEffect(
            self,
            // no yield|await here
            makeFunctionExpression(
              false,
              false,
              makeClosureBlock(
                bindSequence(
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
                    setupRegularFrame({ path }, []),
                    (frame1, frame2) =>
                      extendScope(extendScope(scope, frame1), frame2),
                  ),
                  (scope) =>
                    makeClosureBody(
                      derived
                        ? bindSequence(
                            cacheConstant(
                              forkMeta((meta = nextMeta(meta))),
                              makeScopeLoadExpression(
                                {
                                  path,
                                  meta: forkMeta((meta = nextMeta(meta))),
                                },
                                scope,
                                {
                                  type: "read-input",
                                  mode: getMode(scope),
                                },
                              ),
                              path,
                            ),
                            (input) =>
                              makeEffectStatement(
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
                                path,
                              ),
                          )
                        : EMPTY_STATEMENT,
                      makeScopeLoadExpression(
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        scope,
                        {
                          type: "wrap-result",
                          mode: getMode(scope),
                          result: null,
                        },
                      ),
                    ),
                ),
                path,
              ),
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
                makeReadCacheExpression(self, path),
                makePrimitiveExpression("prototype", path),
                makeDataDescriptorExpression(
                  {
                    value: makeApplyExpression(
                      makeIntrinsicExpression("Object.defineProperty", path),
                      makePrimitiveExpression({ undefined: null }, path),
                      [
                        makeApplyExpression(
                          makeIntrinsicExpression("Object.create", path),
                          makePrimitiveExpression({ undefined: null }, path),
                          [makeIntrinsicExpression("Object.prototype", path)],
                          path,
                        ),
                        makePrimitiveExpression("constructor", path),
                        makeDataDescriptorExpression(
                          {
                            value: makeReadCacheExpression(self, path),
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
        ]),
        makeReadCacheExpression(self, path),
        path,
      ),
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
 * ) => import("../sequence").ExpressionSequence}
 */
const unbuildConstructorPass = (
  { node, path, meta },
  scope,
  { derived, name, field },
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
 *     key: import("../key").Key,
 *     konstructor: import("../cache").Cache,
 *     prototype: import("../cache").Cache,
 *   },
 * ) => import("../sequence").EffectSequence}
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
      return bindSequence(
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
      );
    }
    case "public": {
      return makeConditionalEffect(
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
        EMPTY_EFFECT,
        makeExpressionEffect(
          makeThrowErrorExpression("TypeError", "Cannot assign method", path),
          path,
        ),
        path,
      );
    }
    default: {
      throw new AranTypeError(key);
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
 *   site: import("../site").Site<estree.ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     keys: { [k in unbuild.Path] ?: import("../key").Key },
 *     konstructor: import("../cache").Cache,
 *     prototype: import("../cache").Cache,
 *   },
 * ) => import("../sequence").EffectSequence}
 */
export const unbuildMethodPass = (
  { node, path, meta },
  scope,
  { keys, konstructor, prototype },
) =>
  concatEffect(
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
        isMethodDefinitionSite,
      ),
      ({ node, path, meta }) => {
        if (hasOwn(keys, path)) {
          return unbuildMethod({ node, path, meta }, scope, {
            key: keys[path],
            konstructor,
            prototype,
          });
        } else {
          throw new AranError("missing key", { path, keys });
        }
      },
    ),
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
 *     key: import("../key").Key,
 *   },
 * ) => import("../sequence").EffectSequence}
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
      return bindSequence(
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
      );
    }
    case "public": {
      return makeConditionalEffect(
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
        EMPTY_EFFECT,
        makeExpressionEffect(
          makeThrowErrorExpression(
            "TypeError",
            "Cannot assign instance property",
            path,
          ),
          path,
        ),
        path,
      );
    }
    default: {
      throw new AranTypeError(key);
    }
  }
};

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.StaticBlock
 *     | estree.PropertyDefinition & { static: true }
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     keys: {[k in unbuild.Path] ?: import("../key").Key },
 *   },
 * ) => import("../sequence").StatementSequence}
 */
const unbuildStatic = ({ node, path, meta }, scope, { keys }) => {
  const mode = getMode(scope);
  switch (node.type) {
    case "StaticBlock": {
      return makeBlockStatement(
        makeControlBlock(
          [],
          bindSequence(
            mapSequence(
              setupRegularFrame({ path }, [
                ...flatMap(node.body, (node) => hoistBlock(mode, node)),
                ...flatMap(node.body, (node) => hoistClosure(mode, node)),
              ]),
              (frame) =>
                extendScope(
                  extendScope(scope, frame),
                  makeIllegalFrame({
                    [ARGUMENTS]: "static property initializer",
                  }),
                ),
            ),
            (scope) =>
              makeControlBody(
                listBodyStatement(
                  drillSiteArray(
                    drillSite(
                      node,
                      path,
                      forkMeta((meta = nextMeta(meta))),
                      "body",
                    ),
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
              ),
          ),
          path,
        ),
        path,
      );
    }
    case "PropertyDefinition": {
      if (hasOwn(keys, path)) {
        return makeEffectStatement(
          unbuildProperty({ node, path, meta }, scope, {
            key: keys[path],
          }),
          path,
        );
      } else {
        throw new AranError("missing key", { path, keys });
      }
    }
    default: {
      throw new AranTypeError(node);
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
 *   site: import("../site").Site<estree.ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     keys: { [k in unbuild.Path] ?: import("../key").Key },
 *     konstructor: import("../cache").Cache,
 *   },
 * ) => import("../sequence").ExpressionSequence}
 */
const unbuildClassPropertyPass = (
  { node, path, meta },
  scope,
  { keys, konstructor },
) =>
  makeFunctionExpression(
    false,
    false,
    makeClosureBlock(
      bindSequence(
        mapTwoSequence(
          setupClosureFrame(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            {
              type: "closure-method",
              proto: konstructor,
            },
            { mode: getMode(scope) },
          ),
          setupRegularFrame({ path }, []),
          (frame1, frame2) =>
            extendScope(
              extendScope(extendScope(scope, frame1), frame2),
              makeIllegalFrame({
                [ARGUMENTS]: "class property initializer",
              }),
            ),
        ),
        (scope) =>
          makeClosureBody(
            concatStatement(
              map(
                filterNarrow(
                  mapIndex(node.body.length, (index) =>
                    drillDeepSite(node, path, meta, "body", index),
                  ),
                  isStaticSite,
                ),
                (site) => unbuildStatic(site, scope, { keys }),
              ),
            ),
            makePrimitiveExpression({ undefined: null }, path),
          ),
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
  site.node.type === "PropertyDefinition" && !site.node.static;

/**
 * @type {(
 *   site: import("../site").Site<estree.ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     keys: {[k in unbuild.Path] ?: import("../key").Key},
 *     prototype: import("../cache").Cache,
 *   },
 * ) => import("../sequence").ExpressionSequence}
 */
const unbuildInstancePropertyPass = (
  { node, path, meta },
  scope,
  { keys, prototype }, // await|yield forbidden here
) =>
  makeFunctionExpression(
    false,
    false,
    makeClosureBlock(
      bindSequence(
        mapTwoSequence(
          setupClosureFrame(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            {
              type: "closure-method",
              proto: prototype,
            },
            { mode: getMode(scope) },
          ),
          setupRegularFrame({ path }, []),
          (frame1, frame2) =>
            extendScope(
              extendScope(extendScope(scope, frame1), frame2),
              makeIllegalFrame({
                [ARGUMENTS]: "instance property initializer",
              }),
            ),
        ),
        (scope) =>
          makeClosureBody(
            concatStatement([
              makeEffectStatement(
                bindSequence(
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
              ...map(
                filterNarrow(
                  mapIndex(node.body.length, (index) =>
                    drillDeepSite(node, path, meta, "body", index),
                  ),
                  isInstanceSite,
                ),
                ({ node, path, meta }) => {
                  if (hasOwn(keys, path)) {
                    return makeEffectStatement(
                      unbuildProperty({ node, path, meta }, scope, {
                        key: keys[path],
                      }),
                      path,
                    );
                  } else {
                    throw new AranError("missing key", { path, keys });
                  }
                },
              ),
            ]),
            makePrimitiveExpression({ undefined: null }, path),
          ),
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
 *     keys: { [k in unbuild.Path] ?: import("../key").Key },
 *     field: import("../cache").WritableCache,
 *     konstructor: import("../cache").Cache,
 *     prototype: import("../cache").Cache,
 *   },
 * ) => import("../sequence").EffectSequence}
 */
const unbuildClassInner = (
  { node, path, meta },
  scope,
  { zuper, keys, field, konstructor, prototype },
) =>
  concatEffect([
    listScopeSaveEffect(
      { path, meta: forkMeta((meta = nextMeta(meta))) },
      scope,
      {
        type: "register-private-singleton",
        mode: getMode(scope),
        target: konstructor,
      },
    ),
    zuper === null
      ? EMPTY_EFFECT
      : makeExpressionEffect(
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
    unbuildMethodPass(
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
    listWriteCacheEffect(
      field,
      unbuildInstancePropertyPass(
        { node, path, meta: forkMeta((meta = nextMeta(meta))) },
        scope,
        { keys, prototype },
      ),
      path,
    ),
  ]);

/**
 * @type {(
 *   site: import("../site").Site<estree.ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     zuper: import("../cache").Cache | null,
 *     self: import("../cache").WritableCache,
 *     name: import("../name").Name,
 *   },
 * ) => import("../sequence").ExpressionSequence}
 */
const unbuildClassBody = ({ node, path, meta }, scope, { name, self, zuper }) =>
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
                    {
                      node,
                      path,
                      meta: forkMeta((meta = nextMeta(meta))),
                    },
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
                      makeSequenceExpression(
                        concatEffect([
                          listWriteCacheEffect(
                            self,
                            makeReadCacheExpression(konstructor, path),
                            path,
                          ),
                          unbuildClassInner(
                            {
                              node,
                              path,
                              meta: forkMeta((meta = nextMeta(meta))),
                            },
                            scope,
                            {
                              zuper,
                              keys,
                              field,
                              konstructor,
                              prototype,
                            },
                          ),
                        ]),
                        makeReadCacheExpression(konstructor, path),
                        path,
                      ),
                  ),
              ),
          ),
      ),
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
 *     name: import("../name").Name,
 *   },
 * ) => import("../sequence").ExpressionSequence}
 */
export const unbuildClass = ({ node, path, meta }, parent_scope, { name }) => {
  const scope = extendScope(parent_scope, { type: "mode-use-strict" });
  const self = isSelfPresent(
    node,
    hasOwn(node, "id") && node.id != null
      ? /** @type {estree.Variable} */ (node.id.name)
      : null,
  );
  return bindSequence(
    mapSequence(
      cacheWritable(
        forkMeta((meta = nextMeta(meta))),
        makeIntrinsicExpression("aran.deadzone", path),
        path,
      ),
      (cache) => ({
        self: cache,
        scope:
          self === null
            ? scope
            : extendScope(scope, {
                type: "fake",
                record: { [self]: { kind: "const", proxy: cache } },
              }),
      }),
    ),
    ({ self, scope }) =>
      hasClassSuper(node)
        ? bindSequence(
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
          )
        : unbuildClassBody(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "body"),
            scope,
            { name, self, zuper: null },
          ),
  );
};
