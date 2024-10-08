import {
  EMPTY,
  concatXX,
  concat_,
  concat_X,
  concat___,
  concat____,
  filterNarrow,
  findFirstIndex,
  findLastIndex,
  flat,
  flatMap,
  hasOwn,
  map,
  mapIndex,
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
import { hasFreeVariable, hoist, listBinding } from "../query/index.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  callSequence_X_,
  callSequence__X,
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
  prependSequence,
  zeroSequence,
} from "../../sequence.mjs";
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
  makeSyntaxErrorPrelude,
} from "../prelude/index.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

const ARGUMENTS = /** @type {import("../../estree").Variable} */ ("arguments");

/**
 * @type {(
 *   node: (
 *     | import("../../estree").MethodDefinition
 *     | import("../../estree").PropertyDefinition
 *     | import("../../estree").StaticBlock
 *   ),
 * ) => node is (
 *   | import("../../estree").MethodDefinition
 *   | import("../../estree").PropertyDefinition
 * )}
 */
export const isDefinitionNode = (node) =>
  node.type === "PropertyDefinition" || node.type === "MethodDefinition";

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | import("../../estree").MethodDefinition
 *     | import("../../estree").PropertyDefinition
 *     | import("../../estree").StaticBlock
 *   )>,
 * ) => site is import("../site").Site<(
 *   | import("../../estree").MethodDefinition
 *   | import("../../estree").PropertyDefinition
 * )>}
 */
export const isDefinitionSite = (site) => isDefinitionNode(site.node);

//////////////
// Key Pass //
//////////////

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {},
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *   ),
 *   { [k in import("../../path").Path] ?: import("../key").Key },
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
            bindSequence(
              unbuildKey(
                drillSite(node, path, forkMeta((meta = nextMeta(meta))), "key"),
                scope,
                { computed: node.computed },
              ),
              (key) =>
                cacheKey(
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  convertKey({ path }, key),
                ),
            ),
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
 *     | import("../../estree").StaticBlock
 *     | import("../../estree").PropertyDefinition
 *     | import("../../estree").MethodDefinition
 *   ),
 * ) => [
 *   import("../../estree").PrivateKey,
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
            /** @type {import("../../estree").PrivateKey} */ (node.key.name),
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
            /** @type {import("../../estree").PrivateKey} */ (node.key.name),
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
 *   site: import("../site").Site<import("../../estree").ClassBody>,
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *   ),
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
 *   site: import("../site").Site<import("../../estree").ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     derived: boolean,
 *     field: import("../cache").Cache,
 *     name: import("../name").Name,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
const makeDefaultConstructor = (
  { path, meta },
  scope,
  { derived, field, name },
) =>
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
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        {
                          type: "routine",
                          kind: "constructor",
                          derived,
                          self,
                          field,
                          result: null,
                        },
                        { mode: getMode(scope) },
                      ),
                    ),
                    setupRegularFrame(
                      { path, meta: forkMeta((meta = nextMeta(meta))) },
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
                            callSequence__X(
                              listScopeSaveEffect,
                              {
                                path,
                                meta: forkMeta((meta = nextMeta(meta))),
                              },
                              scope,
                              liftSequence_X(
                                makeCallSuperOperation,
                                getMode(scope),
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
                              ),
                            ),
                            path,
                          )
                        : EMPTY_SEQUENCE,
                      makeScopeLoadExpression(
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        scope,
                        {
                          type: "finalize-result",
                          mode: getMode(scope),
                          result: null,
                        },
                      ),
                      path,
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
              makeIntrinsicExpression("undefined", path),
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
          liftSequenceX_(
            makeExpressionEffect,
            liftSequence__X_(
              makeApplyExpression,
              makeIntrinsicExpression("Reflect.defineProperty", path),
              makeIntrinsicExpression("undefined", path),
              liftSequence__X(
                concat___,
                makeReadCacheExpression(self, path),
                makePrimitiveExpression("name", path),
                liftSequenceX_(
                  makeDataDescriptorExpression,
                  liftSequenceX___(
                    makeDataDescriptor,
                    makeNameExpression(
                      { path, meta: forkMeta((meta = nextMeta(meta))) },
                      name,
                    ),
                    false,
                    false,
                    true,
                  ),
                  path,
                ),
              ),
              path,
            ),
            path,
          ),
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.defineProperty", path),
              makeIntrinsicExpression("undefined", path),
              [
                makeReadCacheExpression(self, path),
                makePrimitiveExpression("prototype", path),
                makeDataDescriptorExpression(
                  {
                    value: makeApplyExpression(
                      makeIntrinsicExpression("Object.defineProperty", path),
                      makeIntrinsicExpression("undefined", path),
                      [
                        makeApplyExpression(
                          makeIntrinsicExpression("Object.create", path),
                          makeIntrinsicExpression("undefined", path),
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
        ),
        makeReadCacheExpression(self, path),
        path,
      ),
  );

/**
 * @type {(
 *   node: (
 *     | import("../../estree").StaticBlock
 *     | import("../../estree").PropertyDefinition
 *     | import("../../estree").MethodDefinition
 *   ),
 * ) => boolean}
 */
const isConstructor = (node) =>
  node.type === "MethodDefinition" && node.kind === "constructor";

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {
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
        /** @type {{body: import("../../estree").MethodDefinition[]}} */ (node),
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
    return initSyntaxErrorExpression("Multiple constructor definitions", path);
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
 *   site: import("../site").Site<import("../../estree").MethodDefinition & {
 *     kind: "method" | "get" | "set",
 *   }>,
 *   scope: import("../scope").Scope,
 *   options: {
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
      return callSequence__X(
        listScopeSaveEffect,
        { path, meta },
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
            makeIntrinsicExpression("Reflect.defineProperty", path),
            makeIntrinsicExpression("undefined", path),
            liftSequence__X(
              concat___,
              makeReadCacheExpression(
                node.static ? konstructor : prototype,
                path,
              ),
              makeKeyExpression({ path }, key),
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
                    path,
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
                    path,
                  ),
            ),
            path,
          ),
          EMPTY,
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
 *     | import("../../estree").MethodDefinition
 *     | import("../../estree").PropertyDefinition
 *     | import("../../estree").StaticBlock
 *   )>,
 * ) => site is import("../site").Site<import("../../estree").MethodDefinition & {
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
 *   site: import("../site").Site<import("../../estree").ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     keys: { [k in import("../../path").Path] ?: import("../key").Key },
 *     konstructor: import("../cache").Cache,
 *     prototype: import("../cache").Cache,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
export const unbuildMethodPass = (
  { node, path, meta },
  scope,
  { keys, konstructor, prototype },
) =>
  liftSequenceX(
    flat,
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
            throw new AranExecError("missing key", { path, keys });
          }
        },
      ),
    ),
  );

///////////////////
// Property Pass //
///////////////////

/**
 * @type {(
 *   node: import("../../estree").PropertyDefinition,
 * ) => node is import("../../estree").PropertyDefinition & {
 *   value: import("../../estree").Expression,
 * }}
 */
const hasPropertyValue = (node) => node.value != null;

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").PropertyDefinition>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     key: import("../key").Key,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
const unbuildProperty = ({ node, path, meta }, scope, { key }) => {
  const value = hasPropertyValue(node)
    ? unbuildNameExpression(
        drillSite(node, path, forkMeta((meta = nextMeta(meta))), "value"),
        scope,
        { name: { type: "property", kind: "init", key } },
      )
    : zeroSequence(makeIntrinsicExpression("undefined", path));
  switch (key.access) {
    case "private": {
      return callSequence__X(
        listScopeSaveEffect,
        { path, meta: forkMeta((meta = nextMeta(meta))) },
        scope,
        liftSequence_X_X(
          makeDefinePrivateOperation,
          getMode(scope),
          makeScopeLoadExpression(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
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
            makeIntrinsicExpression("Reflect.defineProperty", path),
            makeIntrinsicExpression("undefined", path),
            liftSequenceX_X(
              concat___,
              makeScopeLoadExpression(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                { type: "read-this", mode: getMode(scope) },
              ),
              makeKeyExpression({ path }, key),
              liftSequenceX_(
                makeDataDescriptorExpression,
                liftSequenceX___(makeDataDescriptor, value, true, true, true),
                path,
              ),
            ),
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
 *     | import("../../estree").StaticBlock
 *     | import("../../estree").PropertyDefinition & { static: true }
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     keys: {[k in import("../../path").Path] ?: import("../key").Key },
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
const unbuildStatic = ({ node, path, meta }, scope, { keys }) => {
  const mode = getMode(scope);
  switch (node.type) {
    case "StaticBlock": {
      const { report, unbound, hoisting } = hoist(node, path, mode);
      if (unbound.length > 0) {
        throw new AranExecError("unbound static block binding", {
          node,
          path,
          unbound,
          report,
          hoisting,
        });
      } else {
        return prependSequence(
          map(report, makeSyntaxErrorPrelude),
          liftSequenceX(
            concat_,
            liftSequenceX_(
              makeBlockStatement,
              incorporateControlBlock(
                liftSequence__X_(
                  makeControlBlock,
                  EMPTY,
                  EMPTY,
                  incorporateStatement(
                    callSequence_X_(
                      unbuildBody,
                      drillSiteArray(
                        drillSite(
                          node,
                          path,
                          forkMeta((meta = nextMeta(meta))),
                          "body",
                        ),
                      ),
                      liftSequenceX_(
                        extendScope,
                        liftSequence_X(
                          extendScope,
                          scope,
                          setupRegularFrame(
                            { path, meta: forkMeta((meta = nextMeta(meta))) },
                            listBinding(hoisting, path),
                          ),
                        ),
                        makeIllegalFrame({
                          [ARGUMENTS]: "static property initializer",
                        }),
                      ),
                      {
                        origin: "closure",
                        hoisting,
                        labels: [],
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
                path,
              ),
              path,
            ),
          ),
        );
      }
    }
    case "PropertyDefinition": {
      if (hasOwn(keys, path)) {
        return liftSequenceX_(
          listEffectStatement,
          unbuildProperty({ node, path, meta }, scope, {
            key: keys[path],
          }),
          path,
        );
      } else {
        throw new AranExecError("missing key", { path, keys });
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
 *     | import("../../estree").MethodDefinition
 *     | import("../../estree").PropertyDefinition
 *     | import("../../estree").StaticBlock
 *   )>,
 * ) => site is import("../site").Site<(
 *   | import("../../estree").StaticBlock
 *   | import("../../estree").PropertyDefinition & { static: true }
 * )>}
 */
const isStaticSite = (site) =>
  site.node.type === "StaticBlock" ||
  (site.node.type === "PropertyDefinition" && site.node.static);

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     keys: { [k in import("../../path").Path] ?: import("../key").Key },
 *     konstructor: import("../cache").Cache,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
const unbuildClassPropertyPass = (
  { node, path, meta },
  scope,
  { keys, konstructor },
) =>
  liftSequence__X_(
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
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                {
                  type: "routine",
                  kind: "method",
                  proto: konstructor,
                  result: null,
                },
                { mode: getMode(scope) },
              ),
            ),
            setupRegularFrame(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              EMPTY,
            ),
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
                    isStaticSite,
                  ),
                  (site) => unbuildStatic(site, scope, { keys }),
                ),
              ),
            ),
            makeIntrinsicExpression("undefined", path),
            path,
          ),
      ),
      path,
    ),
    path,
  );

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | import("../../estree").MethodDefinition
 *     | import("../../estree").PropertyDefinition
 *     | import("../../estree").StaticBlock
 *   )>,
 * ) => site is import("../site").Site<(
 *   import("../../estree").PropertyDefinition & { static: false }
 * )>}
 */
const isInstanceSite = (site) =>
  site.node.type === "PropertyDefinition" && !site.node.static;

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     keys: {[k in import("../../path").Path] ?: import("../key").Key},
 *     prototype: import("../cache").Cache,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
const unbuildInstancePropertyPass = (
  { node, path, meta },
  scope,
  { keys, prototype }, // await|yield forbidden here
) =>
  liftSequence__X_(
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
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                {
                  type: "routine",
                  kind: "method",
                  proto: prototype,
                  result: null,
                },
                { mode: getMode(scope) },
              ),
            ),
            setupRegularFrame(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              EMPTY,
            ),
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
                callSequence__X(
                  listScopeSaveEffect,
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  scope,
                  liftSequence_X(
                    makeRegisterPrivateCollectionOperation,
                    getMode(scope),
                    makeScopeLoadExpression(
                      { path, meta: forkMeta((meta = nextMeta(meta))) },
                      scope,
                      { type: "read-this", mode: getMode(scope) },
                    ),
                  ),
                ),
                path,
              ),
              liftSequenceX(
                flat,
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
                      isInstanceSite,
                    ),
                    ({ node, path, meta }) => {
                      if (hasOwn(keys, path)) {
                        return liftSequenceX_(
                          listEffectStatement,
                          unbuildProperty({ node, path, meta }, scope, {
                            key: keys[path],
                          }),
                          path,
                        );
                      } else {
                        throw new AranExecError("missing key", { path, keys });
                      }
                    },
                  ),
                ),
              ),
            ),
            makeIntrinsicExpression("undefined", path),
            path,
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
 *   site: import("../site").Site<import("../../estree").ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     zuper: import("../cache").Cache | null,
 *     keys: { [k in import("../../path").Path] ?: import("../key").Key },
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
  { node, path, meta },
  scope,
  { zuper, keys, field, konstructor, prototype },
) =>
  liftSequenceX(
    flat,
    flatSequence([
      listScopeSaveEffect(
        { path, meta: forkMeta((meta = nextMeta(meta))) },
        scope,
        {
          type: "register-private-singleton",
          mode: getMode(scope),
          target: makeReadCacheExpression(konstructor, path),
        },
      ),
      zeroSequence(
        zuper === null
          ? EMPTY
          : [
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.setPrototypeOf", path),
                  makeIntrinsicExpression("undefined", path),
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
            ],
      ),
      zeroSequence([
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.setPrototypeOf", path),
            makeIntrinsicExpression("undefined", path),
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
      ]),
      unbuildMethodPass(
        { node, path, meta: forkMeta((meta = nextMeta(meta))) },
        scope,
        { keys, konstructor, prototype },
      ),
      liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          liftSequenceX___(
            makeApplyExpression,
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
      ),
      liftSequenceX(
        concat_,
        liftSequence_X_(
          makeWriteCacheEffect,
          field,
          unbuildInstancePropertyPass(
            { node, path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            { keys, prototype },
          ),
          path,
        ),
      ),
    ]),
  );

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").ClassBody>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     zuper: import("../cache").Cache | null,
 *     self: import("../cache").WritableCache,
 *     name: import("../name").Name,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
const unbuildClassBody = ({ node, path, meta }, scope, { name, self, zuper }) =>
  incorporateExpression(
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
              cacheWritable(forkMeta((meta = nextMeta(meta))), "undefined"),
              (field) =>
                bindSequence(
                  callSequence_X_(
                    cacheConstant,
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
                        liftSequenceX__(
                          makeSequenceExpression,
                          liftSequence_X(
                            concat_X,
                            makeWriteCacheEffect(
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
                          ),
                          makeReadCacheExpression(konstructor, path),
                          path,
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
 *   node: import("../../estree").Class,
 *   self: import("../../estree").Variable | null,
 * ) => import("../../estree").Variable | null}
 */
const isSelfPresent = (node, self) => {
  if (self === null) {
    return null;
  }
  return hasFreeVariable([node], self) ? self : null;
};

/**
 * @type {(
 *   node: import("../../estree").Class,
 * ) => node is import("../../estree").Class & {
 *   superClass: import("../../estree").Expression,
 * }}
 */
const hasClassSuper = (node) => node.superClass != null;

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").Class>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     name: import("../name").Name,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
export const unbuildClass = ({ node, path, meta }, parent_scope, { name }) => {
  const scope = extendScope(parent_scope, { type: "mode-use-strict" });
  const self = isSelfPresent(
    node,
    hasOwn(node, "id") && node.id != null
      ? /** @type {import("../../estree").Variable} */ (node.id.name)
      : null,
  );
  return incorporateExpression(
    bindSequence(
      mapSequence(
        cacheWritable(forkMeta((meta = nextMeta(meta))), "aran.deadzone"),
        (cache) => ({
          self: cache,
          scope:
            self === null
              ? scope
              : extendScope(scope, {
                  type: "fake",
                  record: {
                    [self]: {
                      write: "report",
                      baseline: "dead",
                      proxy: cache,
                    },
                  },
                }),
        }),
      ),
      ({ self, scope }) =>
        hasClassSuper(node)
          ? bindSequence(
              callSequence_X_(
                cacheConstant,
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
                liftSequence_X__(
                  makeConditionalExpression,
                  makeConditionalExpression(
                    makeBinaryExpression(
                      "===",
                      makeReadCacheExpression(zuper, path),
                      makePrimitiveExpression(null, path),
                      path,
                    ),
                    makePrimitiveExpression(true, path),
                    makeApplyExpression(
                      makeIntrinsicExpression("aran.isConstructor", path),
                      makeIntrinsicExpression("undefined", path),
                      [makeReadCacheExpression(zuper, path)],
                      path,
                    ),
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
    ),
    path,
  );
};
