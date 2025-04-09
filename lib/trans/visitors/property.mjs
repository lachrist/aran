import { AranExecError, AranTypeError } from "../../error.mjs";
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
import { transExpression, transNameExpression } from "./expression.mjs";
import { transFunction } from "./function.mjs";
import { transKey } from "./key.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  convertKey,
  duplicateKey,
  makeKeyExpression,
  makePublicKeyExpression,
} from "../key.mjs";
import {
  concat__,
  concat___,
  tuple2,
  bindSequence,
  callSequence_X_,
  liftSequenceXX,
  liftSequenceX_,
  liftSequence_X,
  liftSequence_XX,
  liftSequence_X_,
  liftSequence__X,
  liftSequence__X_,
  mapSequence,
} from "../../util/index.mjs";

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").ObjectProperty<import("../hash.d.ts").HashProp>
 *     | import("estree-sentry").SpreadElement<import("../hash.d.ts").HashProp>
 *   ),
 * ) => node is import("../estree.d.ts").ProtoObjectProperty<import("../hash.d.ts").HashProp>}
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
 *   node: import("../estree.d.ts").ProtoObjectProperty<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   import("../atom.d.ts").Expression,
 * >}
 */
export const transProtoProperty = (node, meta, scope) => {
  const { _hash: hash } = node;
  return incorporateExpression(
    mapSequence(
      callSequence_X_(
        cacheConstant,
        forkMeta((meta = nextMeta(meta))),
        // __proto__ is anonymous:
        // Reflect.getPrototypeOf({__proto__: () => {} }).name === ""
        transExpression(node.value, forkMeta((meta = nextMeta(meta))), scope),
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
 *   node: import("estree-sentry").ObjectProperty<import("../hash.d.ts").HashProp> & {
 *     kind: "init",
 *     method: false,
 *   },
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   [
 *     import("../atom.d.ts").Expression,
 *     import("../atom.d.ts").Expression,
 *   ],
 * >}
 */
export const transInitProperty = (node, meta, scope) => {
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
          transKey(
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
                transNameExpression(
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
        transKey(
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
      transExpression(node.value, forkMeta((meta = nextMeta(meta))), scope),
    );
  }
};

/**
 * @type {(
 *   kind: "init",
 *   data: import("../atom.d.ts").Expression,
 *   hash: import("../hash.d.ts").Hash,
 * ) => import("../atom.d.ts").Expression}
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
 *   method: import("../atom.d.ts").Expression,
 *   hash: import("../hash.d.ts").Hash,
 * ) => import("../atom.d.ts").Expression}
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
 *     | import("estree-sentry").ObjectProperty<import("../hash.d.ts").HashProp>
 *     | import("estree-sentry").SpreadElement<import("../hash.d.ts").HashProp>
 *   ),
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 *   self: import("../cache.d.ts").Cache,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   import("../../util/tree.d.ts").Tree<import("../atom.d.ts").Effect>,
 * >}
 */
export const transProperty = (node, meta, scope, self) => {
  const { _hash: hash } = node;
  switch (node.type) {
    case "SpreadElement": {
      return liftSequenceX_(
        makeExpressionEffect,
        liftSequence__X_(
          makeApplyExpression,
          makeIntrinsicExpression("Object.assign", hash),
          makeIntrinsicExpression("undefined", hash),
          liftSequence_X(
            concat__,
            makeReadCacheExpression(self, hash),
            transExpression(
              node.argument,
              forkMeta((meta = nextMeta(meta))),
              scope,
            ),
          ),
          hash,
        ),
        hash,
      );
    }
    case "Property": {
      if (isProtoProperty(node)) {
        return liftSequenceX_(
          makeExpressionEffect,
          liftSequence__X_(
            makeApplyExpression,
            makeIntrinsicExpression("Reflect.setPrototypeOf", hash),
            makeIntrinsicExpression("undefined", hash),
            liftSequence_X(
              concat__,
              makeReadCacheExpression(self, hash),
              transProtoProperty(node, meta, scope),
            ),
            hash,
          ),
          hash,
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
                transKey(
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
                    liftSequenceX_(
                      makeExpressionEffect,
                      liftSequence__X_(
                        makeApplyExpression,
                        makeIntrinsicExpression("Reflect.defineProperty", hash),
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
                              ? transFunction(
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
                              : transNameExpression(
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
            hash,
          );
        } else {
          return liftSequenceX_(
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
                  transKey(
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
                  transExpression(
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
          );
        }
      }
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
