import {
  EMPTY,
  concatXX,
  concat_,
  concat_X,
  concat___,
  concat____,
  filterNarrow,
  flat,
  flatMap,
  hasOwn,
  map,
  pairup,
} from "../../util/index.mjs";
import { AranExecError, AranTypeError } from "../../report.mjs";
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
  makeControlBlock,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeSequenceExpression,
  makeClosureExpression,
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
import { hasFreeVariable } from "../query/index.mjs";
import { hoist } from "../annotation/index.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  callSequence_X_,
  callSequence__X,
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
  liftSequence_X_X,
  liftSequence_X__,
  liftSequence__X,
  liftSequence__XX_,
  liftSequence__X_,
  liftSequence__X__,
  liftSequence___X,
  mapSequence,
  zeroSequence,
} from "../../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  extendScope,
  getMode,
  listScopeSaveEffect,
  makeIllegalFrame,
  makeScopeLoadExpression,
  setupRoutineFrame,
  setupPrivateFrame,
  setupRegularFrame,
  makeCallSuperOperation,
  makeDefinePrivateOperation,
  makeInitializePrivateOperation,
  makeRegisterPrivateCollectionOperation,
} from "../scope/index.mjs";
import { makeNameExpression } from "../name.mjs";
import { cacheKey, convertKey, makeKeyExpression } from "../key.mjs";
import {
  incorporateExpression,
  incorporateStatement,
  incorporateControlBlock,
  incorporateRoutineBlock,
  initSyntaxErrorExpression,
} from "../prelude/index.mjs";

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
export const isDefinition = (node) =>
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
 *   context: import("../context").Context,
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *   ),
 *   { [k in import("../../hash").Hash] ?: import("../key").Key },
 * >}
 */
const unbuildKeyPass = (node, meta, { scope, annotation }) => {
  const { _hash: hash } = node;
  return mapSequence(
    flatSequence(
      map(filterNarrow(node.body, isDefinition), (node) =>
        mapSequence(
          bindSequence(
            unbuildKey(node.key, forkMeta((meta = nextMeta(meta))), {
              scope,
              annotation,
              computed: node.computed,
            }),
            (key) =>
              cacheKey(
                hash,
                forkMeta((meta = nextMeta(meta))),
                convertKey(hash, key),
              ),
          ),
          (key) => pairup(hash, key),
        ),
      ),
    ),
    reduceEntry,
  );
};

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
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *   ),
 *   import("../scope/private").PrivateFrame
 * >}
 */
const unbuildPrivatePass = (node, meta) =>
  setupPrivateFrame(node._hash, meta, flatMap(node.body, listPrivateEntry));

//////////////////////
// Constructor Pass //
//////////////////////

/**
 * @type {(
 *   hash: import("../../hash").Hash,
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context & {
 *     derived: boolean,
 *     field: import("../cache").Cache,
 *     name: import("../name").Name,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
const makeDefaultConstructor = (hash, meta, { scope, derived, field, name }) =>
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
                  liftSequenceXX(
                    extendScope,
                    liftSequence_X(
                      extendScope,
                      scope,
                      setupRoutineFrame(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        {
                          type: "routine",
                          kind: "constructor",
                          derived,
                          self,
                          field,
                          result: null,
                        },
                        getMode(scope),
                      ),
                    ),
                    setupRegularFrame(
                      hash,
                      forkMeta((meta = nextMeta(meta))),
                      EMPTY,
                    ),
                  ),
                  (scope) =>
                    liftSequence__XX_(
                      makeRoutineBlock,
                      EMPTY,
                      null,
                      derived
                        ? liftSequenceX_(
                            listEffectStatement,
                            callSequence___X(
                              listScopeSaveEffect,
                              hash,
                              forkMeta((meta = nextMeta(meta))),
                              scope,
                              liftSequence_X(
                                makeCallSuperOperation,
                                getMode(scope),
                                makeScopeLoadExpression(
                                  hash,
                                  forkMeta((meta = nextMeta(meta))),
                                  scope,
                                  {
                                    type: "read-input",
                                    mode: getMode(scope),
                                  },
                                ),
                              ),
                            ),
                            hash,
                          )
                        : EMPTY_SEQUENCE,
                      makeScopeLoadExpression(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        {
                          type: "finalize-result",
                          mode: getMode(scope),
                          result: null,
                        },
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
 *   context: import("../context").Context & {
 *     derived: boolean,
 *     name: import("../name").Name,
 *     field: import("../cache").Cache,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
const unbuildConstructorPass = (
  node,
  meta,
  { scope, annotation, derived, name, field },
) => {
  const { _hash: hash } = node;
  const constructor_node_array = filterNarrow(node.body, isConstructor);
  if (constructor_node_array.length === 0) {
    return makeDefaultConstructor(hash, meta, {
      scope,
      annotation,
      derived,
      name,
      field,
    });
  } else if (constructor_node_array.length === 1) {
    return unbuildFunction(constructor_node_array[0].value, meta, {
      scope,
      annotation,
      type: "constructor",
      derived,
      name,
      field,
    });
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
 *   context: import("../context").Context & {
 *     key: import("../key").Key,
 *     konstructor: import("../cache").Cache,
 *     prototype: import("../cache").Cache,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
export const unbuildMethod = (
  node,
  meta,
  { scope, annotation, key, konstructor, prototype },
) => {
  const { _hash: hash } = node;
  const method = unbuildFunction(node.value, meta, {
    scope,
    annotation,
    type: "method",
    name: {
      type: "property",
      kind: METHOD_KIND[node.kind],
      key,
    },
    proto: node.static ? konstructor : prototype,
  });
  switch (key.access) {
    case "private": {
      return callSequence___X(
        listScopeSaveEffect,
        hash,
        meta,
        scope,
        liftSequence___X(
          makeInitializePrivateOperation,
          getMode(scope),
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
 *   context: import("../context").Context & {
 *     keys: {
 *       [k in import("../../hash").Hash] ?: import("../key").Key
 *     },
 *     konstructor: import("../cache").Cache,
 *     prototype: import("../cache").Cache,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
export const unbuildMethodPass = (
  node,
  meta,
  { scope, annotation, keys, konstructor, prototype },
) => {
  const { _hash: hash } = node;
  return liftSequenceX(
    flat,
    flatSequence(
      map(filterNarrow(node.body, isMethodDefinition), (node) => {
        if (hasOwn(keys, hash)) {
          return unbuildMethod(node, forkMeta((meta = nextMeta(meta))), {
            scope,
            annotation,
            key: keys[hash],
            konstructor,
            prototype,
          });
        } else {
          throw new AranExecError("missing key", { hash, keys });
        }
      }),
    ),
  );
};

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
 *   context: import("../context").Context & {
 *     key: import("../key").Key,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
const unbuildProperty = (node, meta, { scope, annotation, key }) => {
  const { _hash: hash } = node;
  const value = hasPropertyValue(node)
    ? unbuildNameExpression(node.value, forkMeta((meta = nextMeta(meta))), {
        scope,
        annotation,
        name: { type: "property", kind: "init", key },
      })
    : zeroSequence(makeIntrinsicExpression("undefined", hash));
  switch (key.access) {
    case "private": {
      return callSequence___X(
        listScopeSaveEffect,
        hash,
        forkMeta((meta = nextMeta(meta))),
        scope,
        liftSequence_X_X(
          makeDefinePrivateOperation,
          getMode(scope),
          makeScopeLoadExpression(
            hash,
            forkMeta((meta = nextMeta(meta))),
            scope,
            { type: "read-this", mode: getMode(scope) },
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
              makeScopeLoadExpression(
                hash,
                forkMeta((meta = nextMeta(meta))),
                scope,
                { type: "read-this", mode: getMode(scope) },
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
 *   context: import("../context").Context & {
 *     keys: {[k in import("../../hash").Hash] ?: import("../key").Key },
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
const unbuildClassPrelude = (node, meta, { scope, annotation, keys }) => {
  const { _hash: hash } = node;
  switch (node.type) {
    case "StaticBlock": {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeBlockStatement,
          incorporateControlBlock(
            liftSequence__X_(
              makeControlBlock,
              EMPTY,
              EMPTY,
              incorporateStatement(
                callSequence__X(
                  unbuildBody,
                  node.body,
                  forkMeta((meta = nextMeta(meta))),
                  mapSequence(
                    liftSequenceX_(
                      extendScope,
                      liftSequence_X(
                        extendScope,
                        scope,
                        setupRegularFrame(
                          hash,
                          forkMeta((meta = nextMeta(meta))),
                          hoist(hash, annotation),
                        ),
                      ),
                      makeIllegalFrame({
                        [ARGUMENTS]: "static property initializer",
                      }),
                    ),
                    (scope) => ({
                      scope,
                      annotation,
                      origin: /** @type {"closure"} */ ("closure"),
                      labels: [],
                      loop: {
                        break: null,
                        continue: null,
                      },
                    }),
                  ),
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
          unbuildProperty(node, meta, {
            scope,
            annotation,
            key: keys[hash],
          }),
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
 *   context: import("vm").Context & {
 *     keys: {
 *       [k in import("../../hash").Hash] ?: import("../key").Key
 *     },
 *     konstructor: import("../cache").Cache,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
const unbuildClassPreludePass = (
  node,
  meta,
  { scope, annotation, keys, konstructor },
) => {
  const { _hash: hash } = node;
  return liftSequence__X_(
    makeClosureExpression,
    "function",
    false,
    incorporateRoutineBlock(
      bindSequence(
        liftSequenceX_(
          extendScope,
          liftSequenceXX(
            extendScope,
            liftSequence_X(
              extendScope,
              scope,
              setupRoutineFrame(
                hash,
                forkMeta((meta = nextMeta(meta))),
                {
                  type: "routine",
                  kind: "method",
                  proto: konstructor,
                  result: null,
                },
                getMode(scope),
              ),
            ),
            setupRegularFrame(hash, forkMeta((meta = nextMeta(meta))), EMPTY),
          ),
          makeIllegalFrame({
            [ARGUMENTS]: "class property initializer",
          }),
        ),
        (scope) =>
          liftSequence__X__(
            makeRoutineBlock,
            [],
            null,
            liftSequenceX(
              flat,
              flatSequence(
                map(filterNarrow(node.body, isStaticPrelude), (node) =>
                  unbuildClassPrelude(node, forkMeta((meta = nextMeta(meta))), {
                    scope,
                    annotation,
                    keys,
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

/**
 * @type {(
 *   node: import("estree-sentry").ClassBody<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context & {
 *     keys: {[k in import("../../hash").Hash] ?: import("../key").Key},
 *     prototype: import("../cache").Cache,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
const unbuildInstancePreludePass = (
  node,
  meta,
  { scope, annotation, keys, prototype }, // await|yield forbidden here
) => {
  const { _hash: hash } = node;
  return liftSequence__X_(
    makeClosureExpression,
    "function",
    false,
    incorporateRoutineBlock(
      bindSequence(
        liftSequenceX_(
          extendScope,
          liftSequenceXX(
            extendScope,
            liftSequence_X(
              extendScope,
              scope,
              setupRoutineFrame(
                hash,
                forkMeta((meta = nextMeta(meta))),
                {
                  type: "routine",
                  kind: "method",
                  proto: prototype,
                  result: null,
                },
                getMode(scope),
              ),
            ),
            setupRegularFrame(hash, forkMeta((meta = nextMeta(meta))), EMPTY),
          ),
          makeIllegalFrame({
            [ARGUMENTS]: "instance property initializer",
          }),
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
                  listScopeSaveEffect,
                  hash,
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                  liftSequence_X(
                    makeRegisterPrivateCollectionOperation,
                    getMode(scope),
                    makeScopeLoadExpression(
                      hash,
                      forkMeta((meta = nextMeta(meta))),
                      scope,
                      { type: "read-this", mode: getMode(scope) },
                    ),
                  ),
                ),
                hash,
              ),
              liftSequenceX(
                flat,
                flatSequence(
                  map(filterNarrow(node.body, isInstancePrelude), (node) => {
                    if (hasOwn(keys, hash)) {
                      return liftSequenceX_(
                        listEffectStatement,
                        unbuildProperty(
                          node,
                          forkMeta((meta = nextMeta(meta))),
                          {
                            scope,
                            annotation,
                            key: keys[hash],
                          },
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
 *   context: import("../context").Context & {
 *     zuper: import("../cache").Cache | null,
 *     keys: {
 *       [k in import("../../hash").Hash] ?: import("../key").Key
 *     },
 *     field: import("../cache").WritableCache,
 *     konstructor: import("../cache").Cache,
 *     prototype: import("../cache").Cache,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
const unbuildClassInner = (
  node,
  meta,
  { scope, annotation, zuper, keys, field, konstructor, prototype },
) => {
  const { _hash: hash } = node;
  return liftSequenceX(
    flat,
    flatSequence([
      listScopeSaveEffect(hash, forkMeta((meta = nextMeta(meta))), scope, {
        type: "register-private-singleton",
        mode: getMode(scope),
        target: makeReadCacheExpression(konstructor, hash),
      }),
      zeroSequence(
        zuper === null
          ? EMPTY
          : [
              makeExpressionEffect(
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
            ],
      ),
      zeroSequence([
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
      ]),
      unbuildMethodPass(node, forkMeta((meta = nextMeta(meta))), {
        scope,
        annotation,
        keys,
        konstructor,
        prototype,
      }),
      liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          liftSequenceX___(
            makeApplyExpression,
            unbuildClassPreludePass(node, forkMeta((meta = nextMeta(meta))), {
              scope,
              annotation,
              keys,
              konstructor,
            }),
            makeReadCacheExpression(konstructor, hash),
            [],
            hash,
          ),
          hash,
        ),
      ),
      liftSequenceX(
        concat_,
        liftSequence_X_(
          makeWriteCacheEffect,
          field,
          unbuildInstancePreludePass(node, forkMeta((meta = nextMeta(meta))), {
            scope,
            annotation,
            keys,
            prototype,
          }),
          hash,
        ),
      ),
    ]),
  );
};

/**
 * @type {(
 *   node: import("estree-sentry").ClassBody<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context & {
 *     zuper: import("../cache").Cache | null,
 *     self: import("../cache").WritableCache,
 *     name: import("../name").Name,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
const unbuildClassBody = (
  node,
  meta,
  { scope, annotation, name, self, zuper },
) => {
  const { _hash: hash } = node;
  return incorporateExpression(
    bindSequence(
      mapSequence(
        unbuildPrivatePass(node, forkMeta((meta = nextMeta(meta)))),
        (frame) => extendScope(scope, frame),
      ),
      (scope) =>
        bindSequence(
          unbuildKeyPass(node, forkMeta((meta = nextMeta(meta))), {
            scope,
            annotation,
          }),
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
                      {
                        scope,
                        annotation,
                        name,
                        derived: zuper !== null,
                        field,
                      },
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
                          liftSequence_X(
                            concat_X,
                            makeWriteCacheEffect(
                              self,
                              makeReadCacheExpression(konstructor, hash),
                              hash,
                            ),
                            unbuildClassInner(
                              node,
                              forkMeta((meta = nextMeta(meta))),
                              {
                                scope,
                                annotation,
                                zuper,
                                keys,
                                field,
                                konstructor,
                                prototype,
                              },
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
 *   context: {
 *     scope: import("../scope").Scope,
 *     annotation: import("../annotation").Annotation,
 *     name: import("../name").Name,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
export const unbuildClass = (
  node,
  meta,
  { scope: parent_scope, annotation, name },
) => {
  const { _hash: hash } = node;
  const scope = extendScope(parent_scope, { type: "mode-use-strict" });
  return incorporateExpression(
    bindSequence(
      mapSequence(
        cacheWritable(forkMeta((meta = nextMeta(meta))), "aran.deadzone"),
        (cache) => ({
          self: cache,
          scope:
            node.id != null && hasFreeVariable([node], node.id.name)
              ? extendScope(scope, {
                  type: "fake",
                  record: {
                    [node.id.name]: {
                      write: "report",
                      baseline: "dead",
                      proxy: cache,
                    },
                  },
                })
              : scope,
        }),
      ),
      ({ self, scope }) =>
        node.superClass != null
          ? bindSequence(
              callSequence_X_(
                cacheConstant,
                forkMeta((meta = nextMeta(meta))),
                unbuildExpression(
                  node.superClass,
                  forkMeta((meta = nextMeta(meta))),
                  { scope, annotation },
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
                    { scope, annotation, name, self, zuper },
                  ),
                  makeThrowErrorExpression(
                    "TypeError",
                    "parent class should be a constructor",
                    hash,
                  ),
                  hash,
                ),
            )
          : unbuildClassBody(node.body, forkMeta((meta = nextMeta(meta))), {
              scope,
              annotation,
              name,
              self,
              zuper: null,
            }),
    ),
    hash,
  );
};
