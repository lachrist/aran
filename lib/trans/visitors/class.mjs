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
  liftSequence_X_,
  liftSequence_X__,
  liftSequence__X,
  liftSequence__XX_,
  liftSequence__X_,
  liftSequence__X__,
  mapSequence,
  zeroSequence,
  reduceEntry,
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
import { transExpression, transNameExpression } from "./expression.mjs";
import { transFunction } from "./function.mjs";
import { transKey } from "./key.mjs";
import { transBody } from "./statement.mjs";
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
  extendClosureRoutine,
  extendIllegalVariable,
  extendNormalRegularVariable,
  extendPrivate,
  extendProxyVariable,
  extendStaticBlockRoutine,
  extendStrict,
  listCallSuperEffect,
  listDefinePrivateEffect,
  listInitializePrivateEffect,
  listInitializeVariableEffect,
  listRegisterCollectionPrivateEffect,
  listRegisterSingletonPrivateEffect,
  makeCallSuperOperation,
  makeDefinePrivateOperation,
  makeFinalizeResultExpression,
  makeInitializePrivateOperation,
  makeInitVariableOperation,
  makeReadInputExpression,
  makeReadThisExpression,
  makeRegisterCollectionPrivateOperation,
} from "../scope/index.mjs";

const ARGUMENTS = /** @type {import("estree-sentry").VariableName} */ (
  "arguments"
);

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").ClassEntry<import("../hash.d.ts").HashProp>
 *   ),
 * ) => node is (
 *   | import("estree-sentry").MethodDefinition<import("../hash.d.ts").HashProp>
 *   | import("estree-sentry").PropertyDefinition<import("../hash.d.ts").HashProp>
 * )}
 */
const isDefinition = (node) =>
  node.type === "PropertyDefinition" || node.type === "MethodDefinition";

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").StaticBlock<import("../hash.d.ts").HashProp>
 *     | import("estree-sentry").PropertyDefinition<import("../hash.d.ts").HashProp>
 *     | import("estree-sentry").MethodDefinition<import("../hash.d.ts").HashProp>
 *   ),
 * ) => node is import("estree-sentry").ConstructorMethodDefinition<import("../hash.d.ts").HashProp>}
 */
const isConstructor = (node) =>
  node.type === "MethodDefinition" && node.kind === "constructor";

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").ClassEntry<import("../hash.d.ts").HashProp>
 *   ),
 * ) => node is (
 *   | import("estree-sentry").PlainMethodDefinition<import("../hash.d.ts").HashProp>
 *   | import("estree-sentry").GetterMethodDefinition<import("../hash.d.ts").HashProp>
 *   | import("estree-sentry").SetterMethodDefinition<import("../hash.d.ts").HashProp>
 * )}
 */
const isMethodDefinition = (node) =>
  node.type === "MethodDefinition" && node.kind !== "constructor";

/**
 * @type {(
 *   node: import("estree-sentry").ClassEntry<import("../hash.d.ts").HashProp>,
 * ) => node is import("../estree.d.ts").StaticPrelude<import("../hash.d.ts").HashProp>}
 */
const isStaticPrelude = (node) =>
  node.type === "StaticBlock" ||
  (node.type === "PropertyDefinition" && node.static);

/**
 * @type {(
 *   node: import("estree-sentry").ClassEntry<import("../hash.d.ts").HashProp>,
 * ) => node is import("../estree.d.ts").InstancePropertyDefinition<import("../hash.d.ts").HashProp>}
 */
const isInstancePrelude = (node) =>
  node.type === "PropertyDefinition" && !node.static;

//////////////
// Key Pass //
//////////////

/**
 * @type {(
 *   node: import("estree-sentry").ClassBody<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   (
 *     | import("../prelude/index.d.ts").BodyPrelude
 *     | import("../prelude/index.d.ts").PrefixPrelude
 *   ),
 *   { [k in import("../hash.d.ts").Hash] ?: import("../key.d.ts").Key },
 * >}
 */
const transKeyPass = (node, meta, scope) =>
  mapSequence(
    flatSequence(
      map(filterNarrow(node.body, isDefinition), (node) =>
        mapSequence(
          bindSequence(
            transKey(
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
 *   node: import("estree-sentry").ClassEntry<import("../hash.d.ts").HashProp>,
 * ) => [
 *   import("estree-sentry").PrivateKeyName,
 *   import("../scope/private/index.d.ts").PrivateKind,
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
 *   node: import("estree-sentry").ClassBody<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   (
 *     | import("../prelude/index.d.ts").BodyPrelude
 *     | import("../prelude/index.d.ts").PrefixPrelude
 *   ),
 *   import("../scope/index.d.ts").Scope,
 * >}
 */
const transPrivatePass = (node, meta, scope) =>
  extendPrivate(node._hash, meta, flatMap(node.body, listPrivateEntry), scope);

//////////////////////
// Constructor Pass //
//////////////////////

/**
 * @type {(
 *   hash: import("../hash.d.ts").Hash,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 *   options: {
 *     derived: boolean,
 *     field: import("../cache.d.ts").Cache,
 *     name: import("../name.d.ts").Name,
 *   },
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   import("../atom.d.ts").Expression,
 * >}
 */
const makeDefaultConstructor = (hash, meta, scope, { derived, field, name }) =>
  bindSequence(
    cacheWritable(forkMeta((meta = nextMeta(meta))), "aran.deadzone_symbol"),
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
                  extendClosureRoutine(
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    {
                      type: "constructor",
                      generator: false,
                      asynchronous: false,
                      derived,
                      field,
                      self,
                    },
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
 *   node: import("estree-sentry").ClassBody<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 *   options: {
 *     derived: boolean,
 *     name: import("../name.d.ts").Name,
 *     field: import("../cache.d.ts").Cache,
 *   },
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   import("../atom.d.ts").Expression,
 * >}
 */
const transConstructorPass = (node, meta, scope, { derived, name, field }) => {
  const { _hash: hash } = node;
  const constructor_node_array = filterNarrow(node.body, isConstructor);
  if (constructor_node_array.length === 0) {
    return makeDefaultConstructor(hash, meta, scope, {
      derived,
      name,
      field,
    });
  } else if (constructor_node_array.length === 1) {
    return transFunction(
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
 *     | import("estree-sentry").PlainMethodDefinition<import("../hash.d.ts").HashProp>
 *     | import("estree-sentry").GetterMethodDefinition<import("../hash.d.ts").HashProp>
 *     | import("estree-sentry").SetterMethodDefinition<import("../hash.d.ts").HashProp>
 *   ),
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 *   options: {
 *     key: import("../key.d.ts").Key,
 *     konstructor: import("../cache.d.ts").Cache,
 *     prototype: import("../cache.d.ts").Cache,
 *   },
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   import("../../util/tree.d.ts").Tree<import("../atom.d.ts").Effect>,
 * >}
 */
const transMethod = (node, meta, scope, { key, konstructor, prototype }) => {
  const { _hash: hash } = node;
  const method = transFunction(
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
 *   node: import("estree-sentry").ClassBody<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 *   options: {
 *     keys: {
 *       [k in import("../hash.d.ts").Hash] ?: import("../key.d.ts").Key
 *     },
 *     konstructor: import("../cache.d.ts").Cache,
 *     prototype: import("../cache.d.ts").Cache,
 *   },
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   import("../../util/tree.d.ts").Tree<import("../atom.d.ts").Effect>,
 * >}
 */
const transMethodPass = (node, meta, scope, { keys, konstructor, prototype }) =>
  flatSequence(
    map(filterNarrow(node.body, isMethodDefinition), (node) => {
      const { _hash: hash } = node;
      if (hasOwn(keys, hash)) {
        return transMethod(node, forkMeta((meta = nextMeta(meta))), scope, {
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
 *   node: import("estree-sentry").PropertyDefinition<import("../hash.d.ts").HashProp>,
 * ) => node is import("estree-sentry").PropertyDefinition<import("../hash.d.ts").HashProp> & {
 *   value: import("estree-sentry").Expression<import("../hash.d.ts").HashProp>,
 * }}
 */
const hasPropertyValue = (node) => node.value != null;

/**
 * @type {(
 *   node: import("estree-sentry").PropertyDefinition<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 *   key: import("../key.d.ts").Key,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   import("../../util/tree.d.ts").Tree<import("../atom.d.ts").Effect>,
 * >}
 */
const transProperty = (node, meta, scope, key) => {
  const { _hash: hash } = node;
  const value = hasPropertyValue(node)
    ? transNameExpression(
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
 *   node: import("../estree.d.ts").StaticPrelude<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 *   keys: {[k in import("../hash.d.ts").Hash] ?: import("../key.d.ts").Key },
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   import("../../util/tree.d.ts").Tree<import("../atom.d.ts").Statement>,
 * >}
 */
const transClassPrelude = (node, meta, scope, keys) => {
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
                  transBody,
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
          transProperty(node, meta, scope, keys[hash]),
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
 *   node: import("estree-sentry").ClassBody<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 *   options: {
 *     keys: {
 *       [k in import("../hash.d.ts").Hash] ?: import("../key.d.ts").Key
 *     },
 *     konstructor: import("../cache.d.ts").Cache,
 *   },
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   import("../atom.d.ts").Expression,
 * >}
 */
const transClassPreludePass = (node, meta, scope, { keys, konstructor }) => {
  const { _hash: hash } = node;
  return liftSequence__X_(
    makeClosureExpression,
    "function",
    false,
    incorporateRoutineBlock(
      bindSequence(
        callSequence___X(
          extendClosureRoutine,
          hash,
          forkMeta((meta = nextMeta(meta))),
          {
            type: /** @type {"method"} */ ("method"),
            proto: konstructor,
            asynchronous: false,
            generator: false,
          },
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
                transClassPrelude(
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
 *   node: import("estree-sentry").ClassBody<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 *   options: {
 *     keys: {[k in import("../hash.d.ts").Hash] ?: import("../key.d.ts").Key},
 *     prototype: import("../cache.d.ts").Cache,
 *   },
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   import("../atom.d.ts").Expression,
 * >}
 */
const transInstancePreludePass = (
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
          extendClosureRoutine,
          hash,
          forkMeta((meta = nextMeta(meta))),
          {
            type: /** @type {"method"} */ ("method"),
            proto: prototype,
            asynchronous: false,
            generator: false,
          },
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
                        transProperty(
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
 *   node: import("estree-sentry").ClassBody<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 *   options: {
 *     zuper: import("../cache.d.ts").Cache | null,
 *     keys: {
 *       [k in import("../hash.d.ts").Hash] ?: import("../key.d.ts").Key
 *     },
 *     field: import("../cache.d.ts").WritableCache,
 *     konstructor: import("../cache.d.ts").Cache,
 *     prototype: import("../cache.d.ts").Cache,
 *   },
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   import("../../util/tree.d.ts").Tree<import("../atom.d.ts").Effect>,
 * >}
 */
const transClassInner = (
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
    transMethodPass(node, forkMeta((meta = nextMeta(meta))), scope, {
      keys,
      konstructor,
      prototype,
    }),
    liftSequenceX_(
      makeExpressionEffect,
      liftSequenceX___(
        makeApplyExpression,
        transClassPreludePass(node, forkMeta((meta = nextMeta(meta))), scope, {
          keys,
          konstructor,
        }),
        makeReadCacheExpression(konstructor, hash),
        [],
        hash,
      ),
      hash,
    ),
    liftSequence_X_(
      makeWriteCacheEffect,
      field,
      transInstancePreludePass(node, forkMeta((meta = nextMeta(meta))), scope, {
        keys,
        prototype,
      }),
      hash,
    ),
  ]);
};

/**
 * @type {(
 *   node: import("estree-sentry").ClassBody<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 *   options: {
 *     id: null | import("estree-sentry").VariableIdentifier<unknown>,
 *     zuper: import("../cache.d.ts").Cache | null,
 *     name: import("../name.d.ts").Name,
 *   },
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   import("../atom.d.ts").Expression,
 * >}
 */
const transClassBody = (node, meta, scope, { id, name, zuper }) => {
  const { _hash: hash } = node;
  return incorporateExpression(
    bindSequence(
      transPrivatePass(node, forkMeta((meta = nextMeta(meta))), scope),
      (scope) =>
        bindSequence(
          transKeyPass(node, forkMeta((meta = nextMeta(meta))), scope),
          (keys) =>
            bindSequence(
              cacheWritable(forkMeta((meta = nextMeta(meta))), "undefined"),
              (field) =>
                bindSequence(
                  callSequence_X_(
                    cacheConstant,
                    forkMeta((meta = nextMeta(meta))),
                    transConstructorPass(
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
                            liftSequenceXX(
                              concat__,
                              id == null
                                ? NULL_SEQUENCE
                                : mapSequence(
                                    callSequence___X(
                                      listInitializeVariableEffect,
                                      hash,
                                      forkMeta((meta = nextMeta(meta))),
                                      scope,
                                      makeInitVariableOperation(
                                        hash,
                                        scope.mode,
                                        id.name,
                                        makeReadCacheExpression(
                                          konstructor,
                                          hash,
                                        ),
                                      ),
                                    ),
                                    (pair) => {
                                      // eslint-disable-next-line local/no-impure
                                      scope = pair[1];
                                      return pair[0];
                                    },
                                  ),
                              transClassInner(
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
 *   frame: import("../annotation/hoisting.d.ts").FrameEntry[],
 * ) => import("estree-sentry").VariableName | null}
 */
const getSelfVariable = (bindings) => {
  if (bindings.length === 0) {
    return null;
  } else if (bindings.length === 1) {
    const { 0: variable, 1: kinds } = bindings[0];
    if (kinds.length !== 1) {
      throw new AranExecError("Self class binding should only have one kind", {
        bindings,
      });
    }
    const kind = kinds[0];
    if (kind !== "class-self") {
      throw new AranExecError(
        "Self class binding should be of kind class-self",
        { bindings },
      );
    }
    return variable;
  } else {
    throw new AranExecError(
      "Class frame should only have one entry (the self binding)",
      { bindings },
    );
  }
};

/**
 * @type {(
 *   node: import("estree-sentry").Class<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 *   name: import("../name.d.ts").Name,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   import("../atom.d.ts").Expression,
 * >}
 */
export const transClass = (node, meta, parent_scope, name) => {
  const { _hash: hash } = node;
  const scope = extendStrict(parent_scope);
  const self_variable = getSelfVariable(hoist(hash, scope.annotation));
  return incorporateExpression(
    bindSequence(
      cacheWritable(forkMeta((meta = nextMeta(meta))), "aran.deadzone_symbol"),
      (self) =>
        bindSequence(
          extendProxyVariable(
            hash,
            forkMeta((meta = nextMeta(meta))),
            {
              bindings:
                self_variable === null
                  ? []
                  : [[self_variable, { proxy: self, kind: "class-self" }]],
            },
            extendStrict(scope),
          ),
          (scope) =>
            node.superClass != null
              ? bindSequence(
                  callSequence_X_(
                    cacheConstant,
                    forkMeta((meta = nextMeta(meta))),
                    transExpression(
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
                      transClassBody(
                        node.body,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        { id: node.id, name, zuper },
                      ),
                      makeThrowErrorExpression(
                        "TypeError",
                        "parent class should be a constructor",
                        hash,
                      ),
                      hash,
                    ),
                )
              : transClassBody(
                  node.body,
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                  { id: node.id, name, zuper: null },
                ),
        ),
    ),
    hash,
  );
};
