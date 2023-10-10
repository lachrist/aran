import { SyntaxAranError } from "../error.mjs";
import { hasOwn } from "../util/index.mjs";
import {
  makeObjectExpression,
  makeThrowErrorExpression,
} from "./intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
} from "./node.mjs";

/**
 * @typedef {{[key in estree.PrivateKey]?: unbuild.Variable}} Private
 */

/**
 * @type {(
 *   context: {},
 *   object: aran.Parameter | unbuild.Variable,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listDeclarePrivateEffect = (_context, object) => [
  makeExpressionEffect(
    makeApplyExpression(
      makeIntrinsicExpression("WeakMap.prototype.set"),
      makeIntrinsicExpression("aran.private"),
      [
        makeReadExpression(object),
        makeObjectExpression(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.getPrototypeOf"),
            makePrimitiveExpression({ undefined: null }),
            [makeReadExpression(object)],
          ),
          [],
        ),
      ],
    ),
  ),
];

/**
 * @type {(
 *   context: { private: Private },
 *   object: aran.Parameter | unbuild.Variable,
 *   key: estree.PrivateKey,
 *   descriptor: aran.Expression<unbuild.Atom>,
 *   origin: estree.Node,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listDefinePrivateEffect = (
  context,
  object,
  key,
  descriptor,
  origin,
) => {
  if (!hasOwn(context.private, key)) {
    throw new SyntaxAranError("invalid private definition", origin);
  }
  return [
    makeExpressionEffect(
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.defineProperty"),
        makePrimitiveExpression({ undefined: null }),
        [
          makeApplyExpression(
            makeIntrinsicExpression("WeakMap.prototype.get"),
            makePrimitiveExpression({ undefined: null }),
            [
              makeIntrinsicExpression("aran.private"),
              makeReadExpression(object),
            ],
          ),
          makeReadExpression(
            /** @type {unbuild.Variable} */ (context.private[key]),
          ),
          descriptor,
        ],
      ),
    ),
  ];
};

/**
 * @type {(
 *   context: { private: Private },
 *   object: unbuild.Variable,
 *   key: estree.PrivateKey,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGetPrivateExpression = (context, object, key) =>
  hasOwn(context.private, key)
    ? makeConditionalExpression(
        makeConditionalExpression(
          makeApplyExpression(
            makeIntrinsicExpression("WeakMap.prototype.has"),
            makeIntrinsicExpression("aran.private"),
            [makeReadExpression(object)],
          ),
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.has"),
            makePrimitiveExpression({ undefined: null }),
            [
              makeApplyExpression(
                makeIntrinsicExpression("WeakMap.prototype.get"),
                makeIntrinsicExpression("aran.private"),
                [makeReadExpression(object)],
              ),
              makeReadExpression(
                /** @type {unbuild.Variable} */ (context.private[key]),
              ),
            ],
          ),
          makePrimitiveExpression(false),
        ),
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.get"),
          makePrimitiveExpression({ undefined: null }),
          [
            makeApplyExpression(
              makeIntrinsicExpression("WeakMap.prototype.get"),
              makeIntrinsicExpression("aran.private"),
              [makeReadExpression(object)],
            ),
            makeReadExpression(
              /** @type {unbuild.Variable} */ (context.private[key]),
            ),
            makeReadExpression(object),
          ],
        ),
        makeThrowErrorExpression(
          "TypeError",
          `Cannot read private member #${key}`,
        ),
      )
    : makeApplyExpression(
        makeReadExpression("private.get"),
        makePrimitiveExpression({ undefined: null }),
        [makeReadExpression(object), makePrimitiveExpression(key)],
      );

/**
 * @type {(
 *   context: { private: Private },
 *   object: unbuild.Variable,
 *   key: estree.PrivateKey,
 *   value: unbuild.Variable,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSetPrivateExpression = (context, object, key, value) =>
  hasOwn(context.private, key)
    ? makeConditionalExpression(
        makeConditionalExpression(
          makeApplyExpression(
            makeIntrinsicExpression("WeakMap.prototype.has"),
            makeIntrinsicExpression("aran.private"),
            [makeReadExpression(object)],
          ),
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.has"),
            makePrimitiveExpression({ undefined: null }),
            [
              makeApplyExpression(
                makeIntrinsicExpression("WeakMap.prototype.get"),
                makeIntrinsicExpression("aran.private"),
                [makeReadExpression(object)],
              ),
              makeReadExpression(
                /** @type {unbuild.Variable} */ (context.private[key]),
              ),
            ],
          ),
          makePrimitiveExpression(false),
        ),
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.set"),
          makePrimitiveExpression({ undefined: null }),
          [
            makeApplyExpression(
              makeIntrinsicExpression("WeakMap.prototype.get"),
              makeIntrinsicExpression("aran.private"),
              [makeReadExpression(object)],
            ),
            makeReadExpression(
              /** @type {unbuild.Variable} */ (context.private[key]),
            ),
            makeReadExpression(value),
            makeReadExpression(object),
          ],
        ),
        makeThrowErrorExpression(
          "TypeError",
          `Cannot read private member #${key}`,
        ),
      )
    : makeApplyExpression(
        makeReadExpression("private.set"),
        makePrimitiveExpression({ undefined: null }),
        [
          makeReadExpression(object),
          makePrimitiveExpression(key),
          makeReadExpression(value),
        ],
      );
