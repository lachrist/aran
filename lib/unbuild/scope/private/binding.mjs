import { AranError, AranTypeError } from "../../../error.mjs";
import { listWriteCacheEffect, makeReadCacheExpression } from "../../cache.mjs";
import { makeIsProperObjectExpression } from "../../helper.mjs";
import { makeThrowErrorExpression } from "../../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
} from "../../node.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   binding: import(".").PrivateBinding,
 *   operation: (
 *     | import("..").HasPrivateOperation
 *     | import("..").GetPrivateOperation
 *   ),
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeBindingLoadExpression = ({ path }, binding, operation) => {
  if (operation.type === "get-private") {
    if (binding.type === "accessor") {
      if (binding.getter === null) {
        return makeThrowErrorExpression(
          "TypeError",
          `Cannot get private accessor #${operation.key}`,
          path,
        );
      } else {
        return makeConditionalExpression(
          makeApplyExpression(
            makeIntrinsicExpression("WeakSet.prototype.has", path),
            makeReadCacheExpression(binding.weakset, path),
            [makeReadCacheExpression(operation.target, path)],
            path,
          ),
          makeApplyExpression(
            makeReadCacheExpression(binding.getter, path),
            makeReadCacheExpression(operation.target, path),
            [],
            path,
          ),
          makeThrowErrorExpression(
            "TypeError",
            `Cannot get private accessor #${operation.key}`,
            path,
          ),
          path,
        );
      }
    } else if (binding.type === "method") {
      return makeConditionalExpression(
        makeApplyExpression(
          makeIntrinsicExpression("WeakSet.prototype.has", path),
          makeReadCacheExpression(binding.weakset, path),
          [makeReadCacheExpression(operation.target, path)],
          path,
        ),
        makeReadCacheExpression(binding.method, path),
        makeThrowErrorExpression(
          "TypeError",
          `Cannot get private accessor #${operation.key}`,
          path,
        ),
        path,
      );
    } else if (binding.type === "property") {
      return makeConditionalExpression(
        makeApplyExpression(
          makeIntrinsicExpression("WeakMap.prototype.has", path),
          makeReadCacheExpression(binding.weakmap, path),
          [makeReadCacheExpression(operation.target, path)],
          path,
        ),
        makeApplyExpression(
          makeIntrinsicExpression("WeakMap.prototype.get", path),
          makeReadCacheExpression(binding.weakmap, path),
          [makeReadCacheExpression(operation.target, path)],
          path,
        ),
        makeThrowErrorExpression(
          "TypeError",
          `Cannot get private property #${operation.key}`,
          path,
        ),
        path,
      );
    } else {
      throw new AranTypeError("invalid binding", binding);
    }
  } else if (operation.type === "has-private") {
    if (binding.type === "accessor" || binding.type === "method") {
      return makeConditionalExpression(
        makeIsProperObjectExpression({ path }, { value: operation.target }),
        makeApplyExpression(
          makeIntrinsicExpression("WeakSet.prototype.has", path),
          makeReadCacheExpression(binding.weakset, path),
          [makeReadCacheExpression(operation.target, path)],
          path,
        ),
        makeThrowErrorExpression(
          "TypeError",
          "Cannot query private property of non-object",
          path,
        ),
        path,
      );
    } else if (binding.type === "property") {
      return makeConditionalExpression(
        makeIsProperObjectExpression({ path }, { value: operation.target }),
        makeApplyExpression(
          makeIntrinsicExpression("WeakMap.prototype.has", path),
          makeReadCacheExpression(binding.weakmap, path),
          [makeReadCacheExpression(operation.target, path)],
          path,
        ),
        makeThrowErrorExpression(
          "TypeError",
          "Cannot query private property of non-object",
          path,
        ),
        path,
      );
    } else {
      throw new AranTypeError("invalid binding", binding);
    }
  } else {
    throw new AranTypeError("invalid operation", operation);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   binding: import(".").PrivateBinding,
 *   operation: (
 *     | import("..").DefinePrivateOperation
 *     | import("..").InitializePrivateOperation
 *     | import("..").SetPrivateOperation
 *   ),
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listBindingSaveEffect = ({ path }, binding, operation) => {
  if (operation.type === "define-private") {
    if (binding.type === "property") {
      return [
        makeConditionalEffect(
          makeApplyExpression(
            makeIntrinsicExpression("WeakMap.prototype.has", path),
            makeReadCacheExpression(binding.weakmap, path),
            [makeReadCacheExpression(operation.target, path)],
            path,
          ),
          [
            makeExpressionEffect(
              makeThrowErrorExpression(
                "TypeError",
                `Duplicate definition of private property #${operation.key}`,
                path,
              ),
              path,
            ),
          ],
          [
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("WeakMap.prototype.set", path),
                makeReadCacheExpression(binding.weakmap, path),
                [
                  makeReadCacheExpression(operation.target, path),
                  makeReadCacheExpression(operation.value, path),
                ],
                path,
              ),
              path,
            ),
          ],
          path,
        ),
      ];
    } else if (binding.type === "method" || binding.type === "accessor") {
      throw new AranError("cannot define method|accessor binding", binding);
    } else {
      throw new AranTypeError("invalid binding", binding);
    }
  } else if (operation.type === "initialize-private") {
    if (binding.type === "method") {
      if (operation.kind === "method") {
        return listWriteCacheEffect(
          binding.method,
          makeReadCacheExpression(operation.value, path),
          path,
        );
      } else if (operation.kind === "getter" || operation.kind === "setter") {
        throw new AranError("initialize method kind mismatch", {
          binding,
          operation,
        });
      } else {
        throw new AranTypeError("invalid operation.kind", operation.kind);
      }
    } else if (binding.type === "accessor") {
      if (operation.kind === "getter" || operation.kind === "setter") {
        const cache = binding[operation.kind];
        if (cache === null) {
          throw new AranError("cannot initialize missing accessor", {
            binding,
            operation,
          });
        } else {
          return listWriteCacheEffect(
            cache,
            makeReadCacheExpression(operation.value, path),
            path,
          );
        }
      } else if (operation.kind === "method") {
        throw new AranError("initialize accessor kind mismatch", {
          binding,
          operation,
        });
      } else {
        throw new AranTypeError("invalid operation.kind", operation.kind);
      }
    } else if (binding.type === "property") {
      throw new AranError("cannot initialize property binding", binding);
    } else {
      throw new AranTypeError("invalid binding", binding);
    }
  } else if (operation.type === "set-private") {
    if (binding.type === "method") {
      return [
        makeExpressionEffect(
          makeThrowErrorExpression(
            "TypeError",
            `Cannot set private method #${operation.key}`,
            path,
          ),
          path,
        ),
      ];
    } else if (binding.type === "accessor") {
      if (binding.setter === null) {
        return [
          makeExpressionEffect(
            makeThrowErrorExpression(
              "TypeError",
              `Cannot set private accessor #${operation.key}`,
              path,
            ),
            path,
          ),
        ];
      } else {
        return [
          makeConditionalEffect(
            makeApplyExpression(
              makeIntrinsicExpression("WeakSet.prototype.has", path),
              makeReadCacheExpression(binding.weakset, path),
              [makeReadCacheExpression(operation.target, path)],
              path,
            ),
            [
              makeExpressionEffect(
                makeApplyExpression(
                  makeReadCacheExpression(binding.setter, path),
                  makeReadCacheExpression(operation.target, path),
                  [makeReadCacheExpression(operation.value, path)],
                  path,
                ),
                path,
              ),
            ],
            [
              makeExpressionEffect(
                makeThrowErrorExpression(
                  "TypeError",
                  `Cannot set private accessor #${operation.key}`,
                  path,
                ),
                path,
              ),
            ],
            path,
          ),
        ];
      }
    } else if (binding.type === "property") {
      return [
        makeConditionalEffect(
          makeApplyExpression(
            makeIntrinsicExpression("WeakMap.prototype.has", path),
            makeReadCacheExpression(binding.weakmap, path),
            [makeReadCacheExpression(operation.target, path)],
            path,
          ),
          [
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("WeakMap.prototype.set", path),
                makeReadCacheExpression(binding.weakmap, path),
                [
                  makeReadCacheExpression(operation.target, path),
                  makeReadCacheExpression(operation.value, path),
                ],
                path,
              ),
              path,
            ),
          ],
          [
            makeExpressionEffect(
              makeThrowErrorExpression(
                "TypeError",
                `Cannot set private accessor #${operation.key}`,
                path,
              ),
              path,
            ),
          ],
          path,
        ),
      ];
    } else {
      throw new AranTypeError("invalid binding", binding);
    }
  } else {
    throw new AranTypeError("invalid operation", operation);
  }
};
