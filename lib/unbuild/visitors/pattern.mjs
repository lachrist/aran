/* eslint-disable no-use-before-define */

import {
  EMPTY,
  concat_,
  concat_X,
  concat_XX,
  concat___,
  everyNarrow,
  flat,
  mapReduceIndex,
  some,
} from "../../util/index.mjs";
import { AranTypeError } from "../../report.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";
import {
  makeArrayExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeThrowErrorExpression,
} from "../intrinsic.mjs";
import { getMode, listScopeSaveEffect } from "../scope/index.mjs";
import { unbuildNameExpression } from "./expression.mjs";
import { unbuildKey } from "./key.mjs";
import {
  cacheConstant,
  cacheWritable,
  makeWriteCacheEffect,
  makeReadCacheExpression,
} from "../cache.mjs";
import { listSetMemberEffect } from "../member.mjs";
import {
  listNextIteratorEffect,
  listReturnIteratorEffect,
  makeNextIteratorExpression,
} from "../helper.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  callSequence_X,
  callSequence_X_,
  flatSequence,
  liftSequenceX,
  liftSequenceXX,
  liftSequenceX_,
  liftSequence_X,
  liftSequence_XX,
  liftSequence_X_,
  liftSequence_X__,
  liftSequence__X_,
  liftSequence___X,
  mapSequence,
} from "../../sequence.mjs";
import { unbuildObject } from "./object.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { drillDeepSite, drillSite } from "../site.mjs";
import { incorporateEffect, initErrorExpression } from "../prelude/index.mjs";
import { convertKey, duplicateKey, makePublicKeyExpression } from "../key.mjs";
import { lookupDeadzone, updateDeadzonePattern } from "../deadzone.mjs";

/**
 * @type {(
 *   node: (
 *     | import("../../estree").PatternProperty
 *     | import("../../estree").RestElement
 *   ),
 * ) => node is import("../../estree").PatternProperty}
 */
const isAssignmentProperty = (node) => node.type === "Property";

/**
 * @type {(
 *   node: import("../../estree").Pattern | null,
 * ) => node is import("../../estree").RestElement}
 */
const isRestElement = (node) => node != null && node.type === "RestElement";

/**
 * @type {(
 *    scope: import("../scope").Scope,
 *    deadzone: import("../deadzone").Deadzone,
 *    kind: "var" | "let" | "const" | null,
 *    right: import("../atom").Expression,
 * ) => {
 *   scope: import("../scope").Scope,
 *   deadzone: import("../deadzone").Deadzone,
 *   kind: "var" | "let" | "const" | null,
 *   right: import("../atom").Expression,
 * }}
 */
export const makePatternContext = (scope, deadzone, kind, right) => ({
  scope,
  deadzone,
  kind,
  right,
});

/**
 * @type {(
 *   node: import("../../estree").ObjectPattern,
 * ) => node is import("../../estree").ObjectPattern & {
 *   properties: import("../../estree").PatternProperty[],
 * }}
 */
const hasNoRestProperty = (node) =>
  everyNarrow(node.properties, isAssignmentProperty);

/**
 * @type {(
 *   site: import("../site").Site<
 *     import("../../estree").Pattern
 *   >,
 *   context: {
 *     scope: import("../scope").Scope,
 *     deadzone: import("../deadzone").Deadzone,
 *     kind: "var" | "let" | "const" | null,
 *     iterator: import("../cache").Cache,
 *     next: import("../cache").Cache,
 *     done: import("../cache").WritableCache,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
const unbuildItem = (
  { node, path, meta },
  { scope, deadzone, kind, iterator, next, done },
) => {
  if (node.type === "RestElement") {
    return unbuildPattern(drillSite(node, path, meta, "argument"), {
      scope,
      deadzone,
      kind,
      right: makeConditionalExpression(
        makeReadCacheExpression(done, path),
        makeArrayExpression([], path),
        makeApplyExpression(
          makeIntrinsicExpression("aran.listRest", path),
          makeIntrinsicExpression("undefined", path),
          [
            makeReadCacheExpression(iterator, path),
            makeReadCacheExpression(next, path),
          ],
          path,
        ),
        path,
      ),
    });
  } else {
    return callSequence_X(
      unbuildPattern,
      { node, path, meta: forkMeta((meta = nextMeta(meta))) },
      liftSequence___X(
        makePatternContext,
        scope,
        deadzone,
        kind,
        makeNextIteratorExpression(
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          { asynchronous: false, iterator, next, done },
        ),
      ),
    );
  }
};

/**
 * @type {(
 *   site: import("../site").Site<
 *     import("../../estree").PatternProperty
 *   >,
 *   context: {
 *     scope: import("../scope").Scope,
 *     deadzone: import("../deadzone").Deadzone,
 *     kind: "var" | "let" | "const" | null,
 *     object: import("../cache").Cache,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
const unbuildProperty = (
  { node, path, meta },
  { scope, deadzone, kind, object },
) =>
  incorporateEffect(
    bindSequence(
      callSequence_X_(
        cacheConstant,
        forkMeta((meta = nextMeta(meta))),
        bindSequence(
          unbuildKey(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "key"),
            { scope, deadzone, computed: node.computed },
          ),
          (key) =>
            makePublicKeyExpression({ path }, convertKey({ path }, key), {
              message: "Illegal private key in destructuring pattern",
            }),
        ),
        path,
      ),
      (key) =>
        unbuildPattern(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "value"),
          {
            scope,
            deadzone,
            kind,
            right: makeGetExpression(
              makeReadCacheExpression(object, path),
              makeReadCacheExpression(key, path),
              path,
            ),
          },
        ),
    ),
    path,
  );

/**
 * @type {(
 *   site: import("../site").Site<
 *     import("../../estree").PatternProperty
 *   >,
 *   context: {
 *     scope: import("../scope").Scope,
 *     deadzone: import("../deadzone").Deadzone,
 *     kind: "var" | "let" | "const" | null,
 *     object: import("../cache").Cache,
 *     keys: import("../cache").Cache,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
// https://262.ecma-international.org/14.0#sec-destructuring-binding-patterns-runtime-semantics-restbindinginitialization
const unbuildRestProperty = (
  { node, path, meta },
  { scope, deadzone, kind, object, keys },
) =>
  incorporateEffect(
    bindSequence(
      bindSequence(
        mapSequence(
          unbuildKey(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "key"),
            { scope, deadzone, computed: node.computed },
          ),
          (key) => convertKey({ path }, key),
        ),
        (key) =>
          duplicateKey({ path, meta: forkMeta((meta = nextMeta(meta))) }, key),
      ),
      ([key1, key2]) =>
        liftSequenceXX(
          concat_X,
          liftSequenceX_(
            makeExpressionEffect,
            liftSequence__X_(
              makeApplyExpression,
              makeIntrinsicExpression("Reflect.set", path),
              makeIntrinsicExpression("undefined", path),
              liftSequence_X_(
                concat___,
                makeReadCacheExpression(keys, path),
                makePublicKeyExpression({ path }, key1, {
                  message: "Illegal private key in destructuring pattern",
                }),
                makePrimitiveExpression(null, path),
              ),
              path,
            ),
            path,
          ),
          callSequence_X(
            unbuildPattern,
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "value"),
            liftSequence___X(
              makePatternContext,
              scope,
              deadzone,
              kind,
              liftSequence_X_(
                makeGetExpression,
                makeReadCacheExpression(object, path),
                makePublicKeyExpression({ path }, key2, {
                  message: "Illegal private key in destructuring pattern",
                }),
                path,
              ),
            ),
          ),
        ),
    ),
    path,
  );

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").RestElement>,
 *   context: {
 *     scope: import("../scope").Scope,
 *     deadzone: import("../deadzone").Deadzone,
 *     kind: "var" | "let" | "const" | null,
 *     object: import("../cache").Cache,
 *     keys: import("../cache").Cache,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
// https://262.ecma-international.org/14.0#sec-destructuring-binding-patterns-runtime-semantics-restbindinginitialization
const unbuildRestObject = (
  { node, path, meta },
  { scope, deadzone, kind, object, keys },
) =>
  unbuildPattern(drillSite(node, path, meta, "argument"), {
    scope,
    deadzone,
    kind,
    right: makeApplyExpression(
      makeIntrinsicExpression("aran.sliceObject", path),
      makeIntrinsicExpression("undefined", path),
      [
        makeApplyExpression(
          makeIntrinsicExpression("Object", path),
          makeIntrinsicExpression("undefined", path),
          [makeReadCacheExpression(object, path)],
          path,
        ),
        makeReadCacheExpression(keys, path),
      ],
      path,
    ),
  });

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").Pattern>,
 *   context: {
 *     scope: import("../scope").Scope,
 *     deadzone: import("../deadzone").Deadzone,
 *     kind: "var" | "let" | "const" | null,
 *     right: import("../atom").Expression,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
export const unbuildPattern = (
  { node, path, meta },
  { scope, deadzone, right, kind },
) => {
  const mode = getMode(scope);
  switch (node.type) {
    case "Identifier": {
      return listScopeSaveEffect(
        { path, meta },
        scope,
        kind === null
          ? {
              type: "write",
              mode,
              variable: /** @type {import("../../estree").Variable} */ (
                node.name
              ),
              status: lookupDeadzone(deadzone, node.name),
              right,
            }
          : {
              type: "initialize",
              mode,
              variable: /** @type {import("../../estree").Variable} */ (
                node.name
              ),
              right,
            },
      );
    }
    case "MemberExpression": {
      return bindSequence(
        unbuildObject(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "object"),
          { scope, deadzone },
        ),
        (object) =>
          bindSequence(
            unbuildKey(
              drillSite(
                node,
                path,
                forkMeta((meta = nextMeta(meta))),
                "property",
              ),
              { scope, deadzone, computed: node.computed },
            ),
            (key) =>
              listSetMemberEffect(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                { scope, object, key, value: right },
              ),
          ),
      );
    }
    case "AssignmentPattern": {
      return incorporateEffect(
        bindSequence(
          cacheConstant(forkMeta((meta = nextMeta(meta))), right, path),
          (right) =>
            callSequence_X(
              unbuildPattern,
              drillSite(node, path, forkMeta((meta = nextMeta(meta))), "left"),
              liftSequence___X(
                makePatternContext,
                scope,
                deadzone,
                kind,
                liftSequence_X__(
                  makeConditionalExpression,
                  makeBinaryExpression(
                    "===",
                    makeReadCacheExpression(right, path),
                    makeIntrinsicExpression("undefined", path),
                    path,
                  ),
                  unbuildNameExpression(
                    drillSite(
                      node,
                      path,
                      forkMeta((meta = nextMeta(meta))),
                      "right",
                    ),
                    {
                      scope,
                      deadzone,
                      name:
                        node.left.type === "Identifier"
                          ? {
                              type: "assignment",
                              variable:
                                /** @type {import("../../estree").Variable} */ (
                                  node.left.name
                                ),
                            }
                          : { type: "anonymous" },
                    },
                  ),
                  makeReadCacheExpression(right, path),
                  path,
                ),
              ),
            ),
        ),
        path,
      );
    }
    case "ArrayPattern": {
      return incorporateEffect(
        bindSequence(
          cacheConstant(forkMeta((meta = nextMeta(meta))), right, path),
          (right) =>
            bindSequence(
              cacheConstant(
                forkMeta((meta = nextMeta(meta))),
                makeApplyExpression(
                  makeGetExpression(
                    makeReadCacheExpression(right, path),
                    makeIntrinsicExpression("Symbol.iterator", path),
                    path,
                  ),
                  makeReadCacheExpression(right, path),
                  [],
                  path,
                ),
                path,
              ),
              (iterator) =>
                bindSequence(
                  cacheConstant(
                    forkMeta((meta = nextMeta(meta))),
                    makeGetExpression(
                      makeReadCacheExpression(iterator, path),
                      makePrimitiveExpression("next", path),
                      path,
                    ),
                    path,
                  ),
                  (next) =>
                    bindSequence(
                      cacheWritable(
                        forkMeta((meta = nextMeta(meta))),
                        "aran.deadzone",
                      ),
                      (done) =>
                        liftSequence_XX(
                          concat_XX,
                          makeWriteCacheEffect(
                            done,
                            makePrimitiveExpression(false, path),
                            path,
                          ),
                          liftSequenceX(
                            flat,
                            flatSequence(
                              mapReduceIndex(
                                node.elements.length,
                                (deadzone, index) => {
                                  if (node.elements[index] == null) {
                                    return listNextIteratorEffect(
                                      {
                                        path,
                                        meta: forkMeta((meta = nextMeta(meta))),
                                      },
                                      {
                                        asynchronous: false,
                                        iterator,
                                        next,
                                        done,
                                      },
                                    );
                                  } else {
                                    return unbuildItem(
                                      /** @type {import("../site").Site<import("../../estree").Pattern>} */ (
                                        drillDeepSite(
                                          node,
                                          path,
                                          forkMeta((meta = nextMeta(meta))),
                                          "elements",
                                          index,
                                        )
                                      ),
                                      {
                                        scope,
                                        deadzone,
                                        kind,
                                        iterator,
                                        next,
                                        done,
                                      },
                                    );
                                  }
                                },
                                (deadzone, index) =>
                                  node.elements[index] == null
                                    ? deadzone
                                    : updateDeadzonePattern(
                                        deadzone,
                                        kind,
                                        node.elements[index],
                                      ),
                                deadzone,
                              ),
                            ),
                          ),
                          // Not only it is not necessary to return the iterator
                          // But the 'next' variable will be outdated and `next.done`
                          // might be false which would cause the iterator to return.
                          some(node.elements, isRestElement)
                            ? EMPTY_SEQUENCE
                            : liftSequenceX(
                                concat_,
                                liftSequence__X_(
                                  makeConditionalEffect,
                                  makeReadCacheExpression(done, path),
                                  EMPTY,
                                  listReturnIteratorEffect(
                                    {
                                      path,
                                      meta: forkMeta((meta = nextMeta(meta))),
                                    },
                                    { iterator },
                                  ),
                                  path,
                                ),
                              ),
                        ),
                    ),
                ),
            ),
        ),
        path,
      );
    }
    case "ObjectPattern": {
      return incorporateEffect(
        bindSequence(
          cacheConstant(forkMeta((meta = nextMeta(meta))), right, path),
          (right) =>
            liftSequence_X(
              concat_X,
              makeConditionalEffect(
                makeBinaryExpression(
                  "==",
                  makeReadCacheExpression(right, path),
                  makePrimitiveExpression(null, path),
                  path,
                ),
                [
                  makeExpressionEffect(
                    makeThrowErrorExpression(
                      "TypeError",
                      "Cannot destructure nullish value",
                      path,
                    ),
                    path,
                  ),
                ],
                EMPTY,
                path,
              ),
              hasNoRestProperty(node)
                ? liftSequenceX(
                    flat,
                    flatSequence(
                      mapReduceIndex(
                        node.properties.length,
                        (deadzone, index) =>
                          unbuildProperty(
                            drillDeepSite(
                              node,
                              path,
                              forkMeta((meta = nextMeta(meta))),
                              "properties",
                              index,
                            ),
                            {
                              scope,
                              deadzone,
                              kind,
                              object: right,
                            },
                          ),
                        (deadzone, index) =>
                          updateDeadzonePattern(
                            deadzone,
                            kind,
                            node.properties[index],
                          ),
                        deadzone,
                      ),
                    ),
                  )
                : incorporateEffect(
                    bindSequence(
                      cacheConstant(
                        forkMeta((meta = nextMeta(meta))),
                        makeApplyExpression(
                          makeIntrinsicExpression("aran.createObject", path),
                          makeIntrinsicExpression("undefined", path),
                          [makePrimitiveExpression(null, path)],
                          path,
                        ),
                        path,
                      ),
                      (keys) =>
                        liftSequenceX(
                          flat,
                          flatSequence(
                            mapReduceIndex(
                              node.properties.length,
                              (deadzone, index) => {
                                const {
                                  node: deep_node,
                                  path: deep_path,
                                  meta: deep_meta,
                                } = drillDeepSite(
                                  node,
                                  path,
                                  forkMeta((meta = nextMeta(meta))),
                                  "properties",
                                  index,
                                );
                                if (deep_node.type === "Property") {
                                  return unbuildRestProperty(
                                    {
                                      node: deep_node,
                                      path: deep_path,
                                      meta: deep_meta,
                                    },
                                    {
                                      scope,
                                      deadzone,
                                      kind,
                                      object: right,
                                      keys,
                                    },
                                  );
                                } else if (deep_node.type === "RestElement") {
                                  return unbuildRestObject(
                                    {
                                      node: deep_node,
                                      path: deep_path,
                                      meta: deep_meta,
                                    },
                                    {
                                      scope,
                                      deadzone,
                                      kind,
                                      object: right,
                                      keys,
                                    },
                                  );
                                } else {
                                  throw new AranTypeError(deep_node);
                                }
                              },
                              (deadzone, index) =>
                                updateDeadzonePattern(
                                  deadzone,
                                  kind,
                                  node.properties[index],
                                ),
                              deadzone,
                            ),
                          ),
                        ),
                    ),
                    path,
                  ),
            ),
        ),
        path,
      );
    }
    case "RestElement": {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          initErrorExpression("Illegal rest element", path),
          path,
        ),
      );
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
