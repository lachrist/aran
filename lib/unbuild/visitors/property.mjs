import { AranExecError, AranTypeError } from "../../report.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import {
  makeAccessorDescriptorExpression,
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
  incorporateEffect,
  incorporateExpression,
  incorporateExpressionPair,
} from "../prelude/index.mjs";
import { unbuildExpression, unbuildNameExpression } from "./expression.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildKey } from "./key.mjs";
import {
  bindSequence,
  callSequence_X_,
  liftSequenceX,
  liftSequenceXX,
  liftSequenceX_,
  liftSequence_X,
  liftSequence_XX,
  liftSequence_X_,
  liftSequence__X,
  liftSequence__X_,
  mapSequence,
} from "../../sequence.mjs";
import { drillSite } from "../site.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  convertKey,
  duplicateKey,
  makeKeyExpression,
  makePublicKeyExpression,
} from "../key.mjs";
import { concat_, concat__, concat___, pairup } from "../../util/index.mjs";

/**
 * @type {(
 *   node: import("../../estree").ObjectProperty,
 * ) => node is import("../../estree").ObjectProperty & {
 *   value: import("../../estree").FunctionExpression
 * }}
 */
const isFunctionProperty = (node) => node.value.type === "FunctionExpression";

/**
 * @type {(
 *   node: import("../../estree").ObjectProperty,
 * ) => node is import("../../estree").ObjectProperty & {
 *   value: (
 *     | import("../../estree").ClassDeclaration
 *     | import("../../estree").FunctionExpression
 *     | import("../../estree").ArrowFunctionExpression
 *   ),
 * }}
 */
const isNameProperty = (node) =>
  node.value.type === "ClassExpression" ||
  node.value.type === "FunctionExpression" ||
  node.value.type === "ArrowFunctionExpression";

/**
 * @type {(
 *   node: (
 *     | import("../../estree").ObjectProperty
 *     | import("../../estree").SpreadElement
 *   ),
 * ) => node is import("../../estree").ProtoObjectProperty}
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
 *   site: import("../site").Site<
 *     import("../../estree").ProtoObjectProperty
 *   >,
 *   scope: import("../scope").Scope,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
export const unbuildProtoProperty = ({ node, path, meta }, scope) =>
  incorporateExpression(
    mapSequence(
      callSequence_X_(
        cacheConstant,
        forkMeta((meta = nextMeta(meta))),
        // __proto__ is anonymous:
        // Reflect.getPrototypeOf({__proto__: () => {} }).name === ""
        unbuildExpression(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "value"),
          scope,
          null,
        ),
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
    ),
    path,
  );

/**
 * @type {(
 *   site: import("../site").Site<
 *     import("../../estree").ObjectProperty & {
 *       kind: "init",
 *       method: false,
 *     }
 *   >,
 *   scope: import("../scope").Scope,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   [
 *     import("../atom").Expression,
 *     import("../atom").Expression,
 *   ],
 * >}
 */
export const unbuildInitProperty = ({ node, path, meta }, scope) => {
  if (isProtoProperty(node)) {
    throw new AranExecError("unexpected proto property", { node, path });
  } else if (isNameProperty(node)) {
    return incorporateExpressionPair(
      bindSequence(
        liftSequence_X(
          convertKey,
          { path },
          unbuildKey(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "key"),
            scope,
            { computed: node.computed },
          ),
        ),
        (key) =>
          bindSequence(
            duplicateKey(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              key,
            ),
            ([key1, key2]) =>
              liftSequence_X(
                pairup,
                makeKeyExpression({ path }, key1),
                unbuildNameExpression(
                  drillSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "value",
                  ),
                  scope,
                  {
                    name: { type: "property", kind: node.kind, key: key2 },
                  },
                ),
              ),
          ),
      ),
      path,
    );
  } else {
    return liftSequenceXX(
      pairup,
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
    );
  }
};

/**
 * @type {(
 *   kind: "init",
 *   data: import("../atom").Expression,
 *   path: import("../../path").Path,
 * ) => import("../atom").Expression}
 */
const makeDataDescriptor = (_kind, data, path) =>
  makeDataDescriptorExpression(
    {
      value: data,
      writable: true,
      enumerable: true,
      configurable: true,
    },
    path,
  );

/**
 * @type {(
 *   kind: "init" | "get" | "set",
 *   method: import("../atom").Expression,
 *   path: import("../../path").Path,
 * ) => import("../atom").Expression}
 */
const makeMethodDescriptor = (kind, method, path) => {
  switch (kind) {
    case "init": {
      return makeDataDescriptorExpression(
        {
          value: method,
          writable: true,
          enumerable: true,
          configurable: true,
        },
        path,
      );
    }
    case "get": {
      return makeAccessorDescriptorExpression(
        {
          get: method,
          set: null,
          enumerable: true,
          configurable: true,
        },
        path,
      );
    }
    case "set": {
      return makeAccessorDescriptorExpression(
        {
          get: null,
          set: method,
          enumerable: true,
          configurable: true,
        },
        path,
      );
    }
    default: {
      throw new AranTypeError(kind);
    }
  }
};

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | import("../../estree").ObjectProperty
 *     | import("../../estree").SpreadElement
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     self: import("../cache").Cache,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
export const unbuildProperty = ({ node, path, meta }, scope, { self }) => {
  switch (node.type) {
    case "SpreadElement": {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          liftSequence__X_(
            makeApplyExpression,
            makeIntrinsicExpression("Object.assign", path),
            makeIntrinsicExpression("undefined", path),
            liftSequence_X(
              concat__,
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
            ),
            path,
          ),
          path,
        ),
      );
    }
    case "Property": {
      if (isProtoProperty(node)) {
        return liftSequenceX(
          concat_,
          liftSequenceX_(
            makeExpressionEffect,
            liftSequence__X_(
              makeApplyExpression,
              makeIntrinsicExpression("Reflect.setPrototypeOf", path),
              makeIntrinsicExpression("undefined", path),
              liftSequence_X(
                concat__,
                makeReadCacheExpression(self, path),
                unbuildProtoProperty({ node, path, meta }, scope),
              ),
              path,
            ),
            path,
          ),
        );
      } else {
        if (isNameProperty(node)) {
          return incorporateEffect(
            bindSequence(
              liftSequence_X(
                convertKey,
                { path },
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
              ),
              (key) =>
                bindSequence(
                  duplicateKey(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    key,
                  ),
                  ([key1, key2]) =>
                    liftSequenceX(
                      concat_,
                      liftSequenceX_(
                        makeExpressionEffect,
                        liftSequence__X_(
                          makeApplyExpression,
                          makeIntrinsicExpression(
                            "Reflect.defineProperty",
                            path,
                          ),
                          makeIntrinsicExpression("undefined", path),
                          liftSequence__X(
                            concat___,
                            makeReadCacheExpression(self, path),
                            makeKeyExpression({ path }, key1),
                            liftSequence_X_(
                              makeMethodDescriptor,
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
                          ),
                          path,
                        ),
                        path,
                      ),
                    ),
                ),
            ),
            path,
          );
        } else {
          return liftSequenceX(
            concat_,
            liftSequenceX_(
              makeExpressionEffect,
              liftSequence__X_(
                makeApplyExpression,
                makeIntrinsicExpression("Reflect.defineProperty", path),
                makeIntrinsicExpression("undefined", path),
                liftSequence_XX(
                  concat___,
                  makeReadCacheExpression(self, path),
                  callSequence_X_(
                    makePublicKeyExpression,
                    { path },
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
                    {
                      message: "Illegal private key in object property",
                    },
                  ),
                  liftSequence_X_(
                    makeDataDescriptor,
                    "init",
                    unbuildExpression(
                      drillSite(
                        node,
                        path,
                        forkMeta((meta = nextMeta(meta))),
                        "value",
                      ),
                      scope,
                      null,
                    ),
                    path,
                  ),
                ),
                path,
              ),
              path,
            ),
          );
        }
      }
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
