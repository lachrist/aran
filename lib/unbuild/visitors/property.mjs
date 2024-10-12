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
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  convertKey,
  duplicateKey,
  makeKeyExpression,
  makePublicKeyExpression,
} from "../key.mjs";
import { concat_, concat__, concat___, tuple2 } from "../../util/index.mjs";

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").ObjectProperty<import("../../hash").HashProp>
 *     | import("estree-sentry").SpreadElement<import("../../hash").HashProp>
 *   ),
 * ) => node is import("../estree").ProtoObjectProperty<import("../../hash").HashProp>}
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
 *   node: import("../estree").ProtoObjectProperty<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
export const unbuildProtoProperty = (node, meta, scope) => {
  const { _hash: hash } = node;
  return incorporateExpression(
    mapSequence(
      callSequence_X_(
        cacheConstant,
        forkMeta((meta = nextMeta(meta))),
        // __proto__ is anonymous:
        // Reflect.getPrototypeOf({__proto__: () => {} }).name === ""
        unbuildExpression(node.value, forkMeta((meta = nextMeta(meta))), scope),
        hash,
      ),
      (proto) =>
        makeConditionalExpression(
          makeBinaryExpression(
            "===",
            makeUnaryExpression(
              "typeof",
              makeReadCacheExpression(proto, hash),
              hash,
            ),
            makePrimitiveExpression("object", hash),
            hash,
          ),
          makeReadCacheExpression(proto, hash),
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeUnaryExpression(
                "typeof",
                makeReadCacheExpression(proto, hash),
                hash,
              ),
              makePrimitiveExpression("function", hash),
              hash,
            ),
            makeReadCacheExpression(proto, hash),
            makeIntrinsicExpression("Object.prototype", hash),
            hash,
          ),
          hash,
        ),
    ),
    hash,
  );
};

/**
 * @type {(
 *   node: import("estree-sentry").ObjectProperty<import("../../hash").HashProp> & {
 *     kind: "init",
 *     method: false,
 *   },
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   [
 *     import("../atom").Expression,
 *     import("../atom").Expression,
 *   ],
 * >}
 */
export const unbuildInitProperty = (node, meta, scope) => {
  const { _hash: hash } = node;
  if (isProtoProperty(node)) {
    throw new AranExecError("unexpected proto property", { node, meta });
  } else if (
    node.value.type === "ClassExpression" ||
    node.value.type === "FunctionExpression" ||
    node.value.type === "ArrowFunctionExpression"
  ) {
    return incorporateExpressionPair(
      bindSequence(
        liftSequence_X(
          convertKey,
          hash,
          unbuildKey(
            node.key,
            forkMeta((meta = nextMeta(meta))),
            scope,
            node.computed,
          ),
        ),
        (key) =>
          bindSequence(
            duplicateKey(hash, forkMeta((meta = nextMeta(meta))), key),
            ([key1, key2]) =>
              liftSequence_X(
                tuple2,
                makeKeyExpression(hash, key1),
                unbuildNameExpression(
                  node.value,
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                  { type: "property", kind: node.kind, key: key2 },
                ),
              ),
          ),
      ),
      hash,
    );
  } else {
    return liftSequenceXX(
      tuple2,
      bindSequence(
        unbuildKey(
          node.key,
          forkMeta((meta = nextMeta(meta))),
          scope,
          node.computed,
        ),
        (key) =>
          makePublicKeyExpression(hash, key, {
            message: "Illegal private key in object property",
          }),
      ),
      unbuildExpression(node.value, forkMeta((meta = nextMeta(meta))), scope),
    );
  }
};

/**
 * @type {(
 *   kind: "init",
 *   data: import("../atom").Expression,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").Expression}
 */
const makeDataDescriptor = (_kind, data, hash) =>
  makeDataDescriptorExpression(
    {
      value: data,
      writable: true,
      enumerable: true,
      configurable: true,
    },
    hash,
  );

/**
 * @type {(
 *   kind: "init" | "get" | "set",
 *   method: import("../atom").Expression,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").Expression}
 */
const makeMethodDescriptor = (kind, method, hash) => {
  switch (kind) {
    case "init": {
      return makeDataDescriptorExpression(
        {
          value: method,
          writable: true,
          enumerable: true,
          configurable: true,
        },
        hash,
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
        hash,
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
        hash,
      );
    }
    default: {
      throw new AranTypeError(kind);
    }
  }
};

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").ObjectProperty<import("../../hash").HashProp>
 *     | import("estree-sentry").SpreadElement<import("../../hash").HashProp>
 *   ),
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   self: import("../cache").Cache,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
export const unbuildProperty = (node, meta, scope, self) => {
  const { _hash: hash } = node;
  switch (node.type) {
    case "SpreadElement": {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          liftSequence__X_(
            makeApplyExpression,
            makeIntrinsicExpression("Object.assign", hash),
            makeIntrinsicExpression("undefined", hash),
            liftSequence_X(
              concat__,
              makeReadCacheExpression(self, hash),
              unbuildExpression(
                node.argument,
                forkMeta((meta = nextMeta(meta))),
                scope,
              ),
            ),
            hash,
          ),
          hash,
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
              makeIntrinsicExpression("Reflect.setPrototypeOf", hash),
              makeIntrinsicExpression("undefined", hash),
              liftSequence_X(
                concat__,
                makeReadCacheExpression(self, hash),
                unbuildProtoProperty(node, meta, scope),
              ),
              hash,
            ),
            hash,
          ),
        );
      } else {
        if (
          node.value.type === "ClassExpression" ||
          node.value.type === "FunctionExpression" ||
          node.value.type === "ArrowFunctionExpression"
        ) {
          return incorporateEffect(
            bindSequence(
              liftSequence_X(
                convertKey,
                hash,
                unbuildKey(
                  node.key,
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                  node.computed,
                ),
              ),
              (key) =>
                bindSequence(
                  duplicateKey(hash, forkMeta((meta = nextMeta(meta))), key),
                  ([key1, key2]) =>
                    liftSequenceX(
                      concat_,
                      liftSequenceX_(
                        makeExpressionEffect,
                        liftSequence__X_(
                          makeApplyExpression,
                          makeIntrinsicExpression(
                            "Reflect.defineProperty",
                            hash,
                          ),
                          makeIntrinsicExpression("undefined", hash),
                          liftSequence__X(
                            concat___,
                            makeReadCacheExpression(self, hash),
                            makeKeyExpression(hash, key1),
                            liftSequence_X_(
                              makeMethodDescriptor,
                              node.kind,
                              (node.method ||
                                node.kind === "get" ||
                                node.kind === "set") &&
                                node.value.type === "FunctionExpression"
                                ? unbuildFunction(
                                    node.value,
                                    forkMeta((meta = nextMeta(meta))),
                                    scope,
                                    { type: "method", proto: self },
                                    {
                                      type: "property",
                                      kind: node.kind,
                                      key: key2,
                                    },
                                  )
                                : unbuildNameExpression(
                                    node.value,
                                    forkMeta((meta = nextMeta(meta))),
                                    scope,
                                    {
                                      type: "property",
                                      kind: node.kind,
                                      key: key2,
                                    },
                                  ),
                              hash,
                            ),
                          ),
                          hash,
                        ),
                        hash,
                      ),
                    ),
                ),
            ),
            hash,
          );
        } else {
          return liftSequenceX(
            concat_,
            liftSequenceX_(
              makeExpressionEffect,
              liftSequence__X_(
                makeApplyExpression,
                makeIntrinsicExpression("Reflect.defineProperty", hash),
                makeIntrinsicExpression("undefined", hash),
                liftSequence_XX(
                  concat___,
                  makeReadCacheExpression(self, hash),
                  callSequence_X_(
                    makePublicKeyExpression,
                    hash,
                    unbuildKey(
                      node.key,
                      forkMeta((meta = nextMeta(meta))),
                      scope,
                      node.computed,
                    ),
                    { message: "Illegal private key in object property" },
                  ),
                  liftSequence_X_(
                    makeDataDescriptor,
                    "init",
                    unbuildExpression(
                      node.value,
                      forkMeta((meta = nextMeta(meta))),
                      scope,
                    ),
                    hash,
                  ),
                ),
                hash,
              ),
              hash,
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
