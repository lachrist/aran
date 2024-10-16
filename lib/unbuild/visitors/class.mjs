import {
  EMPTY,
  concatXX,
  concat_,
  concat__,
  concat___,
  concat____,
  filterNarrow,
  flat,
  flatMap,
  flatenTree,
  hasOwn,
  map,
  tuple2,
  NULL_SEQUENCE,
  bindSequence,
  callSequence_X_,
  callSequence__X_,
  callSequence___X,
  flatSequence,
  liftSequenceX,
  liftSequenceXX,
  liftSequenceXX__,
  liftSequenceX_,
  liftSequenceX_X,
  liftSequenceX_X_,
  liftSequenceX__,
  liftSequenceX___,
  liftSequence_X,
  liftSequence_X_,
  liftSequence_X__,
  liftSequence__X,
  liftSequence__XX_,
  liftSequence__X_,
  liftSequence__X__,
  mapSequence,
  zeroSequence,
} from "../../util/index.mjs";
import { AranExecError, AranTypeError } from "../../error.mjs";
import {
  makeAccessorDescriptor,
  makeAccessorDescriptorExpression,
  makeBinaryExpression,
  makeDataDescriptor,
  makeDataDescriptorExpression,
  makeGetExpression,
  makeThrowErrorExpression,
} from "../intrinsic.mjs";
import {
  listEffectStatement,
  makeApplyExpression,
  makeBlockStatement,
  makeRoutineBlock,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeSequenceExpression,
  makeClosureExpression,
  makeTreeSegmentBlock,
  makeTreeRoutineBlock,
} from "../node.mjs";
import { unbuildExpression, unbuildNameExpression } from "./expression.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildKey } from "./key.mjs";
import { unbuildBody } from "./statement.mjs";
import {
  makeReadCacheExpression,
  makeWriteCacheEffect,
  cacheConstant,
  cacheWritable,
} from "../cache.mjs";
import { hoist } from "../annotation/index.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { makeNameExpression } from "../name.mjs";
import { cacheKey, convertKey, makeKeyExpression } from "../key.mjs";
import {
  incorporateExpression,
  incorporateStatement,
  incorporateSegmentBlock,
  incorporateRoutineBlock,
  initSyntaxErrorExpression,
} from "../prelude/index.mjs";
import { INITIAL_STATEMENT_LABELING } from "../labeling.mjs";
import {
  extendConstructorRoutine,
  extendIllegalVariable,
  extendMethodRoutine,
  extendNormalRegularVariable,
  extendPrivate,
  extendProxyVariable,
  extendStaticBlockRoutine,
  extendStrict,
  listCallSuperEffect,
  listDefinePrivateEffect,
  listInitializePrivateEffect,
  listRegisterCollectionPrivateEffect,
  listRegisterSingletonPrivateEffect,
  makeCallSuperOperation,
  makeDefinePrivateOperation,
  makeFinalizeResultExpression,
  makeInitializePrivateOperation,
  makeReadInputExpression,
  makeReadThisExpression,
  makeRegisterCollectionPrivateOperation,
} from "../scope/index.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

const ARGUMENTS = /** @type {import("estree-sentry").VariableName} */ (
  "arguments"
);

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").ClassEntry<import("../../hash").HashProp>
 *   ),
 * ) => node is (
 *   | import("estree-sentry").MethodDefinition<import("../../hash").HashProp>
 *   | import("estree-sentry").PropertyDefinition<import("../../hash").HashProp>
 * )}
 */
const isDefinition = (node) =>
  node.type === "PropertyDefinition" || node.type === "MethodDefinition";

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").StaticBlock<import("../../hash").HashProp>
 *     | import("estree-sentry").PropertyDefinition<import("../../hash").HashProp>
 *     | import("estree-sentry").MethodDefinition<import("../../hash").HashProp>
 *   ),
 * ) => node is import("estree-sentry").ConstructorMethodDefinition<import("../../hash").HashProp>}
 */
const isConstructor = (node) =>
  node.type === "MethodDefinition" && node.kind === "constructor";

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").ClassEntry<import("../../hash").HashProp>
 *   ),
 * ) => node is (
 *   | import("estree-sentry").PlainMethodDefinition<import("../../hash").HashProp>
 *   | import("estree-sentry").GetterMethodDefinition<import("../../hash").HashProp>
 *   | import("estree-sentry").SetterMethodDefinition<import("../../hash").HashProp>
 * )}
 */
const isMethodDefinition = (node) =>
  node.type === "MethodDefinition" && node.kind !== "constructor";

/**
 * @type {(
 *   node: import("estree-sentry").ClassEntry<import("../../hash").HashProp>,
 * ) => node is import("../estree").StaticPrelude<import("../../hash").HashProp>}
 */
const isStaticPrelude = (node) =>
  node.type === "StaticBlock" ||
  (node.type === "PropertyDefinition" && node.static);

/**
 * @type {(
 *   node: import("estree-sentry").ClassEntry<import("../../hash").HashProp>,
 * ) => node is import("../estree").InstancePropertyDefinition<import("../../hash").HashProp>}
 */
const isInstancePrelude = (node) =>
  node.type === "PropertyDefinition" && !node.static;

//////////////
// Key Pass //
//////////////

/**
 * @type {(
 *   node: import("estree-sentry").ClassBody<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 * ) => import("../../util/sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *   ),
 *   { [k in import("../../hash").Hash] ?: import("../key").Key },
 * >}
 */
const unbuildKeyPass = (node, meta, scope) =>
  mapSequence(
    flatSequence(
      map(filterNarrow(node.body, isDefinition), (node) =>
        mapSequence(
          bindSequence(
            unbuildKey(
              node.key,
              forkMeta((meta = nextMeta(meta))),
              scope,
              node.computed,
            ),
            (key) =>
              cacheKey(
                node._hash,
                forkMeta((meta = nextMeta(meta))),
                convertKey(node._hash, key),
              ),
          ),
          (key) => tuple2(node._hash, key),
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
 *   node: import("estree-sentry").ClassEntry<import("../../hash").HashProp>,
 * ) => [
 *   import("estree-sentry").PrivateKeyName,
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
            node.key.name,
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
            node.key.name,
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
 *   node: import("estree-sentry").ClassBody<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 * ) => import("../../util/sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *   ),
 *   import("../scope").Scope,
 * >}
 */
const unbuildPrivatePass = (node, meta, scope) =>
  extendPrivate(node._hash, meta, flatMap(node.body, listPrivateEntry), scope);

//////////////////////
// Constructor Pass //
//////////////////////

/**
 * @type {(
 *   hash: import("../../hash").Hash,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   options: {
 *     derived: boolean,
 *     field: import("../cache").Cache,
 *     name: import("../name").Name,
 *   },
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
const makeDefaultConstructor = (hash, meta, scope, { derived, field, name }) =>
  bindSequence(
    cacheWritable(forkMeta((meta = nextMeta(meta))), "aran.deadzone"),
    (self) =>
      liftSequenceX__(
        makeSequenceExpression,
        liftSequenceX_X_(
          concat____,
          liftSequence_X_(
            makeWriteCacheEffect,
            self,
            // no yield|await here
            liftSequence__X_(
              makeClosureExpression,
              "function",
              false,
              incorporateRoutineBlock(
                bindSequence(
                  extendConstructorRoutine(
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    { derived, field, self },
                    scope,
                  ),
                  (scope) =>
                    liftSequence__XX_(
                      makeRoutineBlock,
                      EMPTY,
                      null,
                      liftSequenceX(
                        flatenTree,
                        derived
                          ? liftSequenceX_(
                              listEffectStatement,
                              callSequence___X(
                                listCallSuperEffect,
                                hash,
                                forkMeta((meta = nextMeta(meta))),
                                scope,
                                liftSequenceX(
                                  makeCallSuperOperation,
                                  makeReadInputExpression(
                                    hash,
                                    forkMeta((meta = nextMeta(meta))),
                                    scope,
                                    {},
                                  ),
                                ),
                              ),
                              hash,
                            )
                          : NULL_SEQUENCE,
                      ),
                      makeFinalizeResultExpression(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        { result: null },
                      ),
                      hash,
                    ),
                ),
                hash,
              ),
              hash,
            ),
            hash,
          ),
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.defineProperty", hash),
              makeIntrinsicExpression("undefined", hash),
              [
                makeReadCacheExpression(self, hash),
                makePrimitiveExpression("length", hash),
                makeDataDescriptorExpression(
                  {
                    value: makePrimitiveExpression(0, hash),
                    writable: false,
                    enumerable: false,
                    configurable: true,
                  },
                  hash,
                ),
              ],
              hash,
            ),
            hash,
          ),
          liftSequenceX_(
            makeExpressionEffect,
            liftSequence__X_(
              makeApplyExpression,
              makeIntrinsicExpression("Reflect.defineProperty", hash),
              makeIntrinsicExpression("undefined", hash),
              liftSequence__X(
                concat___,
                makeReadCacheExpression(self, hash),
                makePrimitiveExpression("name", hash),
                liftSequenceX_(
                  makeDataDescriptorExpression,
                  liftSequenceX___(
                    makeDataDescriptor,
                    makeNameExpression(
                      hash,
                      forkMeta((meta = nextMeta(meta))),
                      name,
                    ),
                    false,
                    false,
                    true,
                  ),
                  hash,
                ),
              ),
              hash,
            ),
            hash,
          ),
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.defineProperty", hash),
              makeIntrinsicExpression("undefined", hash),
              [
                makeReadCacheExpression(self, hash),
                makePrimitiveExpression("prototype", hash),
                makeDataDescriptorExpression(
                  {
                    value: makeApplyExpression(
                      makeIntrinsicExpression("Object.defineProperty", hash),
                      makeIntrinsicExpression("undefined", hash),
                      [
                        makeApplyExpression(
                          makeIntrinsicExpression("Object.create", hash),
                          makeIntrinsicExpression("undefined", hash),
                          [makeIntrinsicExpression("Object.prototype", hash)],
                          hash,
                        ),
                        makePrimitiveExpression("constructor", hash),
                        makeDataDescriptorExpression(
                          {
                            value: makeReadCacheExpression(self, hash),
                            writable: true,
                            enumerable: false,
                            configurable: true,
                          },
                          hash,
                        ),
                      ],
                      hash,
                    ),
                    writable: false,
                    enumerable: false,
                    configurable: false,
                  },
                  hash,
                ),
              ],
              hash,
            ),
            hash,
          ),
        ),
        makeReadCacheExpression(self, hash),
        hash,
      ),
  );

/**
 * @type {(
 *   node: import("estree-sentry").ClassBody<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   options: {
 *     derived: boolean,
 *     name: import("../name").Name,
 *     field: import("../cache").Cache,
 *   },
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
const unbuildConstructorPass = (
  node,
  meta,
  scope,
  { derived, name, field },
) => {
  const { _hash: hash } = node;
  const constructor_node_array = filterNarrow(node.body, isConstructor);
  if (constructor_node_array.length === 0) {
    return makeDefaultConstructor(hash, meta, scope, {
      derived,
      name,
      field,
    });
  } else if (constructor_node_array.length === 1) {
    return unbuildFunction(
      constructor_node_array[0].value,
      meta,
      scope,
      { type: "constructor", derived, field },
      name,
    );
  } else {
    return initSyntaxErrorExpression("Multiple constructor definitions", hash);
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
 *   node: (
 *     | import("estree-sentry").PlainMethodDefinition<import("../../hash").HashProp>
 *     | import("estree-sentry").GetterMethodDefinition<import("../../hash").HashProp>
 *     | import("estree-sentry").SetterMethodDefinition<import("../../hash").HashProp>
 *   ),
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   options: {
 *     key: import("../key").Key,
 *     konstructor: import("../cache").Cache,
 *     prototype: import("../cache").Cache,
 *   },
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../../util/tree").Tree<import("../atom").Effect>,
 * >}
 */
const unbuildMethod = (node, meta, scope, { key, konstructor, prototype }) => {
  const { _hash: hash } = node;
  const method = unbuildFunction(
    node.value,
    meta,
    scope,
    {
      type: "method",
      proto: node.static ? konstructor : prototype,
    },
    {
      type: "property",
      kind: METHOD_KIND[node.kind],
      key,
    },
  );
  switch (key.access) {
    case "private": {
      return callSequence___X(
        listInitializePrivateEffect,
        hash,
        meta,
        scope,
        liftSequence__X(
          makeInitializePrivateOperation,
          PRIVATE_KIND[node.kind],
          key.data,
          method,
        ),
      );
    }
    case "public": {
      return liftSequenceX(
        concat_,
        liftSequenceX___(
          makeConditionalEffect,
          liftSequence__X_(
            makeApplyExpression,
            makeIntrinsicExpression("Reflect.defineProperty", hash),
            makeIntrinsicExpression("undefined", hash),
            liftSequence__X(
              concat___,
              makeReadCacheExpression(
                node.static ? konstructor : prototype,
                hash,
              ),
              makeKeyExpression(hash, key),
              node.kind === "method"
                ? liftSequenceX_(
                    makeDataDescriptorExpression,
                    liftSequenceX___(
                      makeDataDescriptor,
                      method,
                      true,
                      false,
                      true,
                    ),
                    hash,
                  )
                : liftSequenceX_(
                    makeAccessorDescriptorExpression,
                    liftSequenceXX__(
                      makeAccessorDescriptor,
                      node.kind === "get" ? method : zeroSequence(null),
                      node.kind === "set" ? method : zeroSequence(null),
                      false,
                      true,
                    ),
                    hash,
                  ),
            ),
            hash,
          ),
          EMPTY,
          [
            makeExpressionEffect(
              makeThrowErrorExpression(
                "TypeError",
                "Cannot assign method",
                hash,
              ),
              hash,
            ),
          ],
          hash,
        ),
      );
    }
    default: {
      throw new AranTypeError(key);
    }
  }
};

/**
 * @type {(
 *   node: import("estree-sentry").ClassBody<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   options: {
 *     keys: {
 *       [k in import("../../hash").Hash] ?: import("../key").Key
 *     },
 *     konstructor: import("../cache").Cache,
 *     prototype: import("../cache").Cache,
 *   },
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../../util/tree").Tree<import("../atom").Effect>,
 * >}
 */
const unbuildMethodPass = (
  node,
  meta,
  scope,
  { keys, konstructor, prototype },
) =>
  flatSequence(
    map(filterNarrow(node.body, isMethodDefinition), (node) => {
      const { _hash: hash } = node;
      if (hasOwn(keys, hash)) {
        return unbuildMethod(node, forkMeta((meta = nextMeta(meta))), scope, {
          key: keys[hash],
          konstructor,
          prototype,
        });
      } else {
        throw new AranExecError("missing key", { hash, keys });
      }
    }),
  );

///////////////////
// Property Pass //
///////////////////

/**
 * @type {(
 *   node: import("estree-sentry").PropertyDefinition<import("../../hash").HashProp>,
 * ) => node is import("estree-sentry").PropertyDefinition<import("../../hash").HashProp> & {
 *   value: import("estree-sentry").Expression<import("../../hash").HashProp>,
 * }}
 */
const hasPropertyValue = (node) => node.value != null;

/**
 * @type {(
 *   node: import("estree-sentry").PropertyDefinition<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   key: import("../key").Key,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../../util/tree").Tree<import("../atom").Effect>,
 * >}
 */
const unbuildProperty = (node, meta, scope, key) => {
  const { _hash: hash } = node;
  const value = hasPropertyValue(node)
    ? unbuildNameExpression(
        node.value,
        forkMeta((meta = nextMeta(meta))),
        scope,
        { type: "property", kind: "init", key },
      )
    : zeroSequence(makeIntrinsicExpression("undefined", hash));
  switch (key.access) {
    case "private": {
      return callSequence___X(
        listDefinePrivateEffect,
        hash,
        forkMeta((meta = nextMeta(meta))),
        scope,
        liftSequenceX_X(
          makeDefinePrivateOperation,
          makeReadThisExpression(
            hash,
            forkMeta((meta = nextMeta(meta))),
            scope,
            {},
          ),
          key.data,
          value,
        ),
      );
    }
    case "public": {
      return liftSequenceX(
        concat_,
        liftSequenceX___(
          makeConditionalEffect,
          liftSequence__X_(
            makeApplyExpression,
            makeIntrinsicExpression("Reflect.defineProperty", hash),
            makeIntrinsicExpression("undefined", hash),
            liftSequenceX_X(
              concat___,
              makeReadThisExpression(
                hash,
                forkMeta((meta = nextMeta(meta))),
                scope,
                {},
              ),
              makeKeyExpression(hash, key),
              liftSequenceX_(
                makeDataDescriptorExpression,
                liftSequenceX___(makeDataDescriptor, value, true, true, true),
                hash,
              ),
            ),
            hash,
          ),
          [],
          [
            makeExpressionEffect(
              makeThrowErrorExpression(
                "TypeError",
                "Cannot assign instance property",
                hash,
              ),
              hash,
            ),
          ],
          hash,
        ),
      );
    }
    default: {
      throw new AranTypeError(key);
    }
  }
};

/**
 * @type {(
 *   node: import("../estree").StaticPrelude<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   keys: {[k in import("../../hash").Hash] ?: import("../key").Key },
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../../util/tree").Tree<import("../atom").Statement>,
 * >}
 */
const unbuildClassPrelude = (node, meta, scope, keys) => {
  const { _hash: hash } = node;
  switch (node.type) {
    case "StaticBlock": {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeBlockStatement,
          incorporateSegmentBlock(
            liftSequence__X_(
              makeTreeSegmentBlock,
              EMPTY,
              EMPTY,
              incorporateStatement(
                callSequence__X_(
                  unbuildBody,
                  node.body,
                  forkMeta((meta = nextMeta(meta))),
                  callSequence___X(
                    extendStaticBlockRoutine,
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    {},
                    callSequence___X(
                      extendIllegalVariable,
                      hash,
                      forkMeta((meta = nextMeta(meta))),
                      {
                        record: { [ARGUMENTS]: "static property initializer" },
                      },
                      extendNormalRegularVariable(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        { bindings: hoist(hash, scope.annotation) },
                        scope,
                      ),
                    ),
                  ),
                  INITIAL_STATEMENT_LABELING,
                ),
                hash,
              ),
              hash,
            ),
            hash,
          ),
          hash,
        ),
      );
    }
    case "PropertyDefinition": {
      if (hasOwn(keys, hash)) {
        return liftSequenceX_(
          listEffectStatement,
          unbuildProperty(node, meta, scope, keys[hash]),
          hash,
        );
      } else {
        throw new AranExecError("missing key", { hash, keys });
      }
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   node: import("estree-sentry").ClassBody<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   options: {
 *     keys: {
 *       [k in import("../../hash").Hash] ?: import("../key").Key
 *     },
 *     konstructor: import("../cache").Cache,
 *   },
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
const unbuildClassPreludePass = (node, meta, scope, { keys, konstructor }) => {
  const { _hash: hash } = node;
  return liftSequence__X_(
    makeClosureExpression,
    "function",
    false,
    incorporateRoutineBlock(
      bindSequence(
        callSequence___X(
          extendMethodRoutine,
          hash,
          forkMeta((meta = nextMeta(meta))),
          { proto: konstructor },
          extendIllegalVariable(
            hash,
            forkMeta((meta = nextMeta(meta))),
            { record: { [ARGUMENTS]: "class property initializer" } },
            scope,
          ),
        ),
        (scope) =>
          liftSequence__X__(
            makeTreeRoutineBlock,
            [],
            null,
            flatSequence(
              map(filterNarrow(node.body, isStaticPrelude), (node) =>
                unbuildClassPrelude(
                  node,
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                  keys,
                ),
              ),
            ),
            makeIntrinsicExpression("undefined", hash),
            hash,
          ),
      ),
      hash,
    ),
    hash,
  );
};

/**
 * @type {(
 *   node: import("estree-sentry").ClassBody<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   options: {
 *     keys: {[k in import("../../hash").Hash] ?: import("../key").Key},
 *     prototype: import("../cache").Cache,
 *   },
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
const unbuildInstancePreludePass = (
  node,
  meta,
  scope,
  { keys, prototype }, // await|yield forbidden here
) => {
  const { _hash: hash } = node;
  return liftSequence__X_(
    makeClosureExpression,
    "function",
    false,
    incorporateRoutineBlock(
      bindSequence(
        callSequence___X(
          extendMethodRoutine,
          hash,
          forkMeta((meta = nextMeta(meta))),
          { proto: prototype },
          extendIllegalVariable(
            hash,
            forkMeta((meta = nextMeta(meta))),
            { record: { [ARGUMENTS]: "instance property initializer" } },
            scope,
          ),
        ),
        (scope) =>
          liftSequence__X__(
            makeRoutineBlock,
            [],
            null,
            liftSequenceXX(
              concatXX,
              liftSequenceX_(
                listEffectStatement,
                callSequence___X(
                  listRegisterCollectionPrivateEffect,
                  hash,
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                  liftSequenceX(
                    makeRegisterCollectionPrivateOperation,
                    makeReadThisExpression(
                      hash,
                      forkMeta((meta = nextMeta(meta))),
                      scope,
                      {},
                    ),
                  ),
                ),
                hash,
              ),
              liftSequenceX(
                flat,
                flatSequence(
                  map(filterNarrow(node.body, isInstancePrelude), (node) => {
                    const { _hash: hash } = node;
                    if (hasOwn(keys, hash)) {
                      return liftSequenceX_(
                        listEffectStatement,
                        unbuildProperty(
                          node,
                          forkMeta((meta = nextMeta(meta))),
                          scope,
                          keys[hash],
                        ),
                        hash,
                      );
                    } else {
                      throw new AranExecError("missing key", { hash, keys });
                    }
                  }),
                ),
              ),
            ),
            makeIntrinsicExpression("undefined", hash),
            hash,
          ),
      ),
      hash,
    ),
    hash,
  );
};

//////////
// Main //
//////////

/**
 * @type {(
 *   node: import("estree-sentry").ClassBody<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   options: {
 *     zuper: import("../cache").Cache | null,
 *     keys: {
 *       [k in import("../../hash").Hash] ?: import("../key").Key
 *     },
 *     field: import("../cache").WritableCache,
 *     konstructor: import("../cache").Cache,
 *     prototype: import("../cache").Cache,
 *   },
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../../util/tree").Tree<import("../atom").Effect>,
 * >}
 */
const unbuildClassInner = (
  node,
  meta,
  scope,
  { zuper, keys, field, konstructor, prototype },
) => {
  const { _hash: hash } = node;
  return flatSequence([
    listRegisterSingletonPrivateEffect(
      hash,
      forkMeta((meta = nextMeta(meta))),
      scope,
      { target: makeReadCacheExpression(konstructor, hash) },
    ),
    zeroSequence(
      zuper === null
        ? null
        : makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.setPrototypeOf", hash),
              makeIntrinsicExpression("undefined", hash),
              [
                makeReadCacheExpression(prototype, hash),
                makeConditionalExpression(
                  makeBinaryExpression(
                    "==",
                    makeReadCacheExpression(zuper, hash),
                    makePrimitiveExpression(null, hash),
                    hash,
                  ),
                  makePrimitiveExpression(null, hash),
                  makeGetExpression(
                    makeReadCacheExpression(zuper, hash),
                    makePrimitiveExpression("prototype", hash),
                    hash,
                  ),
                  hash,
                ),
              ],
              hash,
            ),
            hash,
          ),
    ),
    zeroSequence(
      makeExpressionEffect(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.setPrototypeOf", hash),
          makeIntrinsicExpression("undefined", hash),
          [
            makeReadCacheExpression(konstructor, hash),
            zuper === null
              ? makeIntrinsicExpression("Function.prototype", hash)
              : makeConditionalExpression(
                  makeBinaryExpression(
                    "===",
                    makeReadCacheExpression(zuper, hash),
                    makePrimitiveExpression(null, hash),
                    hash,
                  ),
                  makeIntrinsicExpression("Function.prototype", hash),
                  makeReadCacheExpression(zuper, hash),
                  hash,
                ),
          ],
          hash,
        ),
        hash,
      ),
    ),
    unbuildMethodPass(node, forkMeta((meta = nextMeta(meta))), scope, {
      keys,
      konstructor,
      prototype,
    }),
    liftSequenceX_(
      makeExpressionEffect,
      liftSequenceX___(
        makeApplyExpression,
        unbuildClassPreludePass(
          node,
          forkMeta((meta = nextMeta(meta))),
          scope,
          { keys, konstructor },
        ),
        makeReadCacheExpression(konstructor, hash),
        [],
        hash,
      ),
      hash,
    ),
    liftSequence_X_(
      makeWriteCacheEffect,
      field,
      unbuildInstancePreludePass(
        node,
        forkMeta((meta = nextMeta(meta))),
        scope,
        { keys, prototype },
      ),
      hash,
    ),
  ]);
};

/**
 * @type {(
 *   node: import("estree-sentry").ClassBody<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   options: {
 *     zuper: import("../cache").Cache | null,
 *     self: import("../cache").WritableCache,
 *     name: import("../name").Name,
 *   },
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
const unbuildClassBody = (node, meta, scope, { name, self, zuper }) => {
  const { _hash: hash } = node;
  return incorporateExpression(
    bindSequence(
      unbuildPrivatePass(node, forkMeta((meta = nextMeta(meta))), scope),
      (scope) =>
        bindSequence(
          unbuildKeyPass(node, forkMeta((meta = nextMeta(meta))), scope),
          (keys) =>
            bindSequence(
              cacheWritable(forkMeta((meta = nextMeta(meta))), "undefined"),
              (field) =>
                bindSequence(
                  callSequence_X_(
                    cacheConstant,
                    forkMeta((meta = nextMeta(meta))),
                    unbuildConstructorPass(
                      node,
                      forkMeta((meta = nextMeta(meta))),
                      scope,
                      { name, derived: zuper !== null, field },
                    ),
                    hash,
                  ),
                  (konstructor) =>
                    bindSequence(
                      cacheConstant(
                        forkMeta((meta = nextMeta(meta))),
                        makeGetExpression(
                          makeReadCacheExpression(konstructor, hash),
                          makePrimitiveExpression("prototype", hash),
                          hash,
                        ),
                        hash,
                      ),
                      (prototype) =>
                        liftSequenceX__(
                          makeSequenceExpression,
                          liftSequenceX(
                            flatenTree,
                            liftSequence_X(
                              concat__,
                              makeWriteCacheEffect(
                                self,
                                makeReadCacheExpression(konstructor, hash),
                                hash,
                              ),
                              unbuildClassInner(
                                node,
                                forkMeta((meta = nextMeta(meta))),
                                scope,
                                { zuper, keys, field, konstructor, prototype },
                              ),
                            ),
                          ),
                          makeReadCacheExpression(konstructor, hash),
                          hash,
                        ),
                    ),
                ),
            ),
        ),
    ),
    hash,
  );
};

/**
 * @type {(
 *   node: import("estree-sentry").Class<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   name: import("../name").Name,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
export const unbuildClass = (node, meta, parent_scope, name) => {
  const { _hash: hash } = node;
  const scope = extendStrict(parent_scope);
  return incorporateExpression(
    bindSequence(
      cacheWritable(forkMeta((meta = nextMeta(meta))), "aran.deadzone"),
      (self) =>
        bindSequence(
          node.type === "ClassExpression" && node.id != null
            ? extendProxyVariable(
                hash,
                forkMeta((meta = nextMeta(meta))),
                {
                  bindings: [
                    {
                      proxy: self,
                      binding: {
                        duplicable: false,
                        variable: node.id.name,
                        initial: "self-class",
                        write: "report",
                        sloppy_function_away: 0,
                        sloppy_function_near: 0,
                      },
                    },
                  ],
                },
                extendStrict(scope),
              )
            : zeroSequence(extendStrict(scope)),
          (scope) =>
            node.superClass != null
              ? bindSequence(
                  callSequence_X_(
                    cacheConstant,
                    forkMeta((meta = nextMeta(meta))),
                    unbuildExpression(
                      node.superClass,
                      forkMeta((meta = nextMeta(meta))),
                      scope,
                    ),
                    hash,
                  ),
                  (zuper) =>
                    liftSequence_X__(
                      makeConditionalExpression,
                      makeConditionalExpression(
                        makeBinaryExpression(
                          "===",
                          makeReadCacheExpression(zuper, hash),
                          makePrimitiveExpression(null, hash),
                          hash,
                        ),
                        makePrimitiveExpression(true, hash),
                        makeApplyExpression(
                          makeIntrinsicExpression("aran.isConstructor", hash),
                          makeIntrinsicExpression("undefined", hash),
                          [makeReadCacheExpression(zuper, hash)],
                          hash,
                        ),
                        hash,
                      ),
                      unbuildClassBody(
                        node.body,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        { name, self, zuper },
                      ),
                      makeThrowErrorExpression(
                        "TypeError",
                        "parent class should be a constructor",
                        hash,
                      ),
                      hash,
                    ),
                )
              : unbuildClassBody(
                  node.body,
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                  { name, self, zuper: null },
                ),
        ),
    ),
    hash,
  );
};
