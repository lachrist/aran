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
 *   origin: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listDeclarePrivateEffect = (_context, object, origin) => [
  makeExpressionEffect(
    makeApplyExpression(
      makeIntrinsicExpression("WeakMap.prototype.set", origin),
      makeIntrinsicExpression("aran.private", origin),
      [
        makeReadExpression(object, origin),
        makeObjectExpression(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.getPrototypeOf", origin),
            makePrimitiveExpression({ undefined: null }, origin),
            [makeReadExpression(object, origin)],
            origin,
          ),
          [],
          origin,
        ),
      ],
      origin,
    ),
    origin,
  ),
];

/**
 * @type {(
 *   context: { private: Private },
 *   object: aran.Parameter | unbuild.Variable,
 *   key: estree.PrivateKey,
 *   descriptor: aran.Expression<unbuild.Atom>,
 *   origin: unbuild.Path,
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
    throw new SyntaxAranError("invalid private definition", null);
  }
  return [
    makeExpressionEffect(
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.defineProperty", origin),
        makePrimitiveExpression({ undefined: null }, origin),
        [
          makeApplyExpression(
            makeIntrinsicExpression("WeakMap.prototype.get", origin),
            makePrimitiveExpression({ undefined: null }, origin),
            [
              makeIntrinsicExpression("aran.private", origin),
              makeReadExpression(object, origin),
            ],
            origin,
          ),
          makeReadExpression(
            /** @type {unbuild.Variable} */ (context.private[key]),
            origin,
          ),
          descriptor,
        ],
        origin,
      ),
      origin,
    ),
  ];
};

/**
 * @type {(
 *   context: { private: Private },
 *   object: unbuild.Variable,
 *   key: estree.PrivateKey,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGetPrivateExpression = (context, object, key, origin) =>
  hasOwn(context.private, key)
    ? makeConditionalExpression(
        makeConditionalExpression(
          makeApplyExpression(
            makeIntrinsicExpression("WeakMap.prototype.has", origin),
            makeIntrinsicExpression("aran.private", origin),
            [makeReadExpression(object, origin)],
            origin,
          ),
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.has", origin),
            makePrimitiveExpression({ undefined: null }, origin),
            [
              makeApplyExpression(
                makeIntrinsicExpression("WeakMap.prototype.get", origin),
                makeIntrinsicExpression("aran.private", origin),
                [makeReadExpression(object, origin)],
                origin,
              ),
              makeReadExpression(
                /** @type {unbuild.Variable} */ (context.private[key]),
                origin,
              ),
            ],
            origin,
          ),
          makePrimitiveExpression(false, origin),
          origin,
        ),
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.get", origin),
          makePrimitiveExpression({ undefined: null }, origin),
          [
            makeApplyExpression(
              makeIntrinsicExpression("WeakMap.prototype.get", origin),
              makeIntrinsicExpression("aran.private", origin),
              [makeReadExpression(object, origin)],
              origin,
            ),
            makeReadExpression(
              /** @type {unbuild.Variable} */ (context.private[key]),
              origin,
            ),
            makeReadExpression(object, origin),
          ],
          origin,
        ),
        makeThrowErrorExpression(
          "TypeError",
          `Cannot read private member #${key}`,
          origin,
        ),
        origin,
      )
    : makeApplyExpression(
        makeReadExpression("private.get", origin),
        makePrimitiveExpression({ undefined: null }, origin),
        [
          makeReadExpression(object, origin),
          makePrimitiveExpression(key, origin),
        ],
        origin,
      );

/**
 * @type {(
 *   context: { private: Private },
 *   object: unbuild.Variable,
 *   key: estree.PrivateKey,
 *   value: unbuild.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSetPrivateExpression = (
  context,
  object,
  key,
  value,
  origin,
) =>
  hasOwn(context.private, key)
    ? makeConditionalExpression(
        makeConditionalExpression(
          makeApplyExpression(
            makeIntrinsicExpression("WeakMap.prototype.has", origin),
            makeIntrinsicExpression("aran.private", origin),
            [makeReadExpression(object, origin)],
            origin,
          ),
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.has", origin),
            makePrimitiveExpression({ undefined: null }, origin),
            [
              makeApplyExpression(
                makeIntrinsicExpression("WeakMap.prototype.get", origin),
                makeIntrinsicExpression("aran.private", origin),
                [makeReadExpression(object, origin)],
                origin,
              ),
              makeReadExpression(
                /** @type {unbuild.Variable} */ (context.private[key]),
                origin,
              ),
            ],
            origin,
          ),
          makePrimitiveExpression(false, origin),
          origin,
        ),
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.set", origin),
          makePrimitiveExpression({ undefined: null }, origin),
          [
            makeApplyExpression(
              makeIntrinsicExpression("WeakMap.prototype.get", origin),
              makeIntrinsicExpression("aran.private", origin),
              [makeReadExpression(object, origin)],
              origin,
            ),
            makeReadExpression(
              /** @type {unbuild.Variable} */ (context.private[key]),
              origin,
            ),
            makeReadExpression(value, origin),
            makeReadExpression(object, origin),
          ],
          origin,
        ),
        makeThrowErrorExpression(
          "TypeError",
          `Cannot read private member #${key}`,
          origin,
        ),
        origin,
      )
    : makeApplyExpression(
        makeReadExpression("private.set", origin),
        makePrimitiveExpression({ undefined: null }, origin),
        [
          makeReadExpression(object, origin),
          makePrimitiveExpression(key, origin),
          makeReadExpression(value, origin),
        ],
        origin,
      );
