import { AranError, AranTypeError } from "../../error.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import {
  makeAccessorDescriptorExpression,
  makeArrayExpression,
  makeBinaryExpression,
  makeDataDescriptorExpression,
  makeUnaryExpression,
} from "../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";
import {
  listEarlyErrorEffect,
  makeEarlyErrorExpression,
} from "../early-error.mjs";
import { unbuildExpression, unbuildNameExpression } from "./expression.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildKey } from "./key.mjs";
import { bindSequence, mapSequence } from "../sequence.mjs";
import { drillSite } from "../site.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  convertKey,
  duplicateKey,
  makeKeyExpression,
  makePublicKeyExpression,
} from "../key.mjs";

/**
 * @type {(
 *   node: estree.Property,
 * ) => node is estree.Property & {
 *   value: estree.FunctionExpression
 * }}
 */
const isFunctionProperty = (node) => node.value.type === "FunctionExpression";

/**
 * @type {(
 *   node: estree.Property,
 * ) => node is estree.Property & {
 *   value: (
 *     | estree.ClassDeclaration
 *     | estree.FunctionExpression
 *     | estree.ArrowFunctionExpression
 *   ),
 * }}
 */
const isNameProperty = (node) =>
  node.value.type === "ClassExpression" ||
  node.value.type === "FunctionExpression" ||
  node.value.type === "ArrowFunctionExpression";

/**
 * @type {(
 *   node: estree.Property,
 * ) => node is estree.Property & { value: estree.Expression }}
 */
export const isObjectProperty = (node) =>
  node.value.type !== "ArrayPattern" &&
  node.value.type !== "ObjectPattern" &&
  node.value.type !== "AssignmentPattern" &&
  node.value.type !== "RestElement";

/**
 * @type {(
 *   node: estree.Property | estree.SpreadElement,
 * ) => node is estree.ProtoProperty}
 */
export const isProtoProperty = (node) =>
  node.type === "Property" &&
  node.kind === "init" &&
  !node.method &&
  !node.computed &&
  !node.shorthand &&
  ((node.key.type === "Identifier" && node.key.name === "__proto__") ||
    (node.key.type === "Literal" && node.key.value === "__proto__"));

/**
 * @type {(
 *   site: import("../site").Site<estree.ProtoProperty>,
 *   scope: import("../scope").Scope,
 * ) => import("../sequence").ExpressionSequence}
 */
export const unbuildProtoProperty = ({ node, path, meta }, scope) =>
  bindSequence(
    cacheConstant(
      forkMeta((meta = nextMeta(meta))),
      // __proto__ is anonymous:
      // Reflect.getPrototypeOf({__proto__: () => {} }).name === ""
      unbuildExpression(drillSite(node, path, meta, "value"), scope, null),
      path,
    ),
    (proto) =>
      makeConditionalExpression(
        makeBinaryExpression(
          "===",
          makeUnaryExpression(
            "typeof",
            makeReadCacheExpression(proto, path),
            path,
          ),
          makePrimitiveExpression("object", path),
          path,
        ),
        makeReadCacheExpression(proto, path),
        makeConditionalExpression(
          makeBinaryExpression(
            "===",
            makeUnaryExpression(
              "typeof",
              makeReadCacheExpression(proto, path),
              path,
            ),
            makePrimitiveExpression("function", path),
            path,
          ),
          makeReadCacheExpression(proto, path),
          makeIntrinsicExpression("Object.prototype", path),
          path,
        ),
        path,
      ),
  );

/**
 * @type {(
 *   site: import("../site").Site<estree.Property & {
 *     kind: "init",
 *     method: false,
 *   }>,
 *   scope: import("../scope").Scope,
 * ) => import("../sequence").ExpressionSequence}
 */
export const unbuildInitProperty = ({ node, path, meta }, scope) => {
  if (isObjectProperty(node)) {
    if (isProtoProperty(node)) {
      throw new AranError("unexpected proto property", { node, path });
    } else if (isNameProperty(node)) {
      return bindSequence(
        mapSequence(
          unbuildKey(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "key"),
            scope,
            { computed: node.computed },
          ),
          (key) => convertKey({ path }, key),
        ),
        (key) =>
          bindSequence(
            duplicateKey(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              key,
            ),
            ([key1, key2]) =>
              makeArrayExpression(
                [
                  makeKeyExpression({ path }, key1),
                  unbuildNameExpression(
                    drillSite(
                      node,
                      path,
                      forkMeta((meta = nextMeta(meta))),
                      "value",
                    ),
                    scope,
                    { name: { type: "property", kind: node.kind, key: key2 } },
                  ),
                ],
                path,
              ),
          ),
      );
    } else {
      return makeArrayExpression(
        [
          bindSequence(
            unbuildKey(
              drillSite(node, path, forkMeta((meta = nextMeta(meta))), "key"),
              scope,
              { computed: node.computed },
            ),
            (key) =>
              makePublicKeyExpression({ path }, key, {
                message: "Illegal private key in object property",
              }),
          ),
          unbuildExpression(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "value"),
            scope,
            null,
          ),
        ],
        path,
      );
    }
  } else {
    return makeEarlyErrorExpression("Illegal pattern in object property", path);
  }
};

/**
 * @type {(
 *   kind: "init" | "get" | "set",
 *   method: import("../sequence").ExpressionSequence,
 *   path: unbuild.Path,
 * ) => import("../sequence").ExpressionSequence}
 */
const makeMethodDescriptor = (kind, method, path) => {
  if (kind === "init") {
    return makeDataDescriptorExpression(
      {
        value: method,
        writable: true,
        enumerable: true,
        configurable: true,
      },
      path,
    );
  } else {
    return makeAccessorDescriptorExpression(
      {
        get: kind === "get" ? method : null,
        set: kind === "set" ? method : null,
        enumerable: true,
        configurable: true,
      },
      path,
    );
  }
};

/**
 * @type {(
 *   site: import("../site").Site<
 *     estree.Property | estree.SpreadElement,
 *   >,
 *   scope: import("../scope").Scope,
 *   options: {
 *     self: import("../cache").Cache,
 *   },
 * ) => import("../sequence").EffectSequence}
 */
export const unbuildProperty = ({ node, path, meta }, scope, { self }) => {
  switch (node.type) {
    case "SpreadElement": {
      return makeExpressionEffect(
        makeApplyExpression(
          makeIntrinsicExpression("Object.assign", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeReadCacheExpression(self, path),
            unbuildExpression(
              drillSite(
                node,
                path,
                forkMeta((meta = nextMeta(meta))),
                "argument",
              ),
              scope,
              null,
            ),
          ],
          path,
        ),
        path,
      );
    }
    case "Property": {
      if (isObjectProperty(node)) {
        if (isProtoProperty(node)) {
          return makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.setPrototypeOf", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeReadCacheExpression(self, path),
                unbuildProtoProperty({ node, path, meta }, scope),
              ],
              path,
            ),
            path,
          );
        } else {
          if (isNameProperty(node)) {
            return bindSequence(
              mapSequence(
                unbuildKey(
                  drillSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "key",
                  ),
                  scope,
                  { computed: node.computed },
                ),
                (key) => convertKey({ path }, key),
              ),
              (key) =>
                bindSequence(
                  duplicateKey(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    key,
                  ),
                  ([key1, key2]) =>
                    makeExpressionEffect(
                      makeApplyExpression(
                        makeIntrinsicExpression("Reflect.defineProperty", path),
                        makePrimitiveExpression({ undefined: null }, path),
                        [
                          makeReadCacheExpression(self, path),
                          makeKeyExpression({ path }, key1),
                          makeMethodDescriptor(
                            node.kind,
                            (node.method ||
                              node.kind === "get" ||
                              node.kind === "set") &&
                              isFunctionProperty(node)
                              ? unbuildFunction(
                                  drillSite(
                                    node,
                                    path,
                                    forkMeta((meta = nextMeta(meta))),
                                    "value",
                                  ),
                                  scope,
                                  {
                                    type: "method",
                                    name: {
                                      type: "property",
                                      kind: node.kind,
                                      key: key2,
                                    },
                                    proto: self,
                                  },
                                )
                              : unbuildNameExpression(
                                  drillSite(
                                    node,
                                    path,
                                    forkMeta((meta = nextMeta(meta))),
                                    "value",
                                  ),
                                  scope,
                                  {
                                    name: {
                                      type: "property",
                                      kind: node.kind,
                                      key: key2,
                                    },
                                  },
                                ),
                            path,
                          ),
                        ],
                        path,
                      ),
                      path,
                    ),
                ),
            );
          } else {
            return makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.defineProperty", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeReadCacheExpression(self, path),
                  bindSequence(
                    unbuildKey(
                      drillSite(
                        node,
                        path,
                        forkMeta((meta = nextMeta(meta))),
                        "key",
                      ),
                      scope,
                      { computed: node.computed },
                    ),
                    (key) =>
                      makePublicKeyExpression({ path }, key, {
                        message: "Illegal private key in object property",
                      }),
                  ),
                  makeDataDescriptorExpression(
                    {
                      value: unbuildExpression(
                        drillSite(
                          node,
                          path,
                          forkMeta((meta = nextMeta(meta))),
                          "value",
                        ),
                        scope,
                        null,
                      ),
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
            );
          }
        }
      } else {
        return listEarlyErrorEffect("Illegal pattern in object property", path);
      }
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
