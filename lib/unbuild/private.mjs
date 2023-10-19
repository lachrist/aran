import { makeSyntaxErrorExpression } from "./report.mjs";
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
 *   object: unbuild.Variable,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listDeclarePrivateEffect = (_context, object, path) => [
  makeExpressionEffect(
    makeApplyExpression(
      makeIntrinsicExpression("WeakMap.prototype.set", path),
      makeIntrinsicExpression("aran.private", path),
      [
        makeReadExpression(object, path),
        makeObjectExpression(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.getPrototypeOf", path),
            makePrimitiveExpression({ undefined: null }, path),
            [makeReadExpression(object, path)],
            path,
          ),
          [],
          path,
        ),
      ],
      path,
    ),
    path,
  ),
];

/**
 * @type {(
 *   context: { private: Private },
 *   object: unbuild.Variable,
 *   key: estree.PrivateKey,
 *   descriptor: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listDefinePrivateEffect = (
  context,
  object,
  key,
  descriptor,
  path,
) =>
  hasOwn(context.private, key)
    ? [
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.defineProperty", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeApplyExpression(
                makeIntrinsicExpression("WeakMap.prototype.get", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeIntrinsicExpression("aran.private", path),
                  makeReadExpression(object, path),
                ],
                path,
              ),
              makeReadExpression(
                /** @type {unbuild.Variable} */ (context.private[key]),
                path,
              ),
              descriptor,
            ],
            path,
          ),
          path,
        ),
      ]
    : [
        makeExpressionEffect(
          makeSyntaxErrorExpression(
            `Cannot define private member #${key}`,
            path,
          ),
          path,
        ),
      ];

/**
 * @type {(
 *   context: { private: Private },
 *   object: unbuild.Variable,
 *   key: estree.PrivateKey,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGetPrivateExpression = (context, object, key, path) =>
  hasOwn(context.private, key)
    ? makeConditionalExpression(
        makeConditionalExpression(
          makeApplyExpression(
            makeIntrinsicExpression("WeakMap.prototype.has", path),
            makeIntrinsicExpression("aran.private", path),
            [makeReadExpression(object, path)],
            path,
          ),
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.has", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeApplyExpression(
                makeIntrinsicExpression("WeakMap.prototype.get", path),
                makeIntrinsicExpression("aran.private", path),
                [makeReadExpression(object, path)],
                path,
              ),
              makeReadExpression(
                /** @type {unbuild.Variable} */ (context.private[key]),
                path,
              ),
            ],
            path,
          ),
          makePrimitiveExpression(false, path),
          path,
        ),
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.get", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeApplyExpression(
              makeIntrinsicExpression("WeakMap.prototype.get", path),
              makeIntrinsicExpression("aran.private", path),
              [makeReadExpression(object, path)],
              path,
            ),
            makeReadExpression(
              /** @type {unbuild.Variable} */ (context.private[key]),
              path,
            ),
            makeReadExpression(object, path),
          ],
          path,
        ),
        makeThrowErrorExpression(
          "TypeError",
          `Cannot read private member #${key}`,
          path,
        ),
        path,
      )
    : makeApplyExpression(
        makeReadExpression("private.get", path),
        makePrimitiveExpression({ undefined: null }, path),
        [makeReadExpression(object, path), makePrimitiveExpression(key, path)],
        path,
      );

/**
 * @type {(
 *   context: { private: Private },
 *   object: unbuild.Variable,
 *   key: estree.PrivateKey,
 *   value: unbuild.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSetPrivateExpression = (context, object, key, value, path) =>
  hasOwn(context.private, key)
    ? makeConditionalExpression(
        makeConditionalExpression(
          makeApplyExpression(
            makeIntrinsicExpression("WeakMap.prototype.has", path),
            makeIntrinsicExpression("aran.private", path),
            [makeReadExpression(object, path)],
            path,
          ),
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.has", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeApplyExpression(
                makeIntrinsicExpression("WeakMap.prototype.get", path),
                makeIntrinsicExpression("aran.private", path),
                [makeReadExpression(object, path)],
                path,
              ),
              makeReadExpression(
                /** @type {unbuild.Variable} */ (context.private[key]),
                path,
              ),
            ],
            path,
          ),
          makePrimitiveExpression(false, path),
          path,
        ),
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.set", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeApplyExpression(
              makeIntrinsicExpression("WeakMap.prototype.get", path),
              makeIntrinsicExpression("aran.private", path),
              [makeReadExpression(object, path)],
              path,
            ),
            makeReadExpression(
              /** @type {unbuild.Variable} */ (context.private[key]),
              path,
            ),
            makeReadExpression(value, path),
            makeReadExpression(object, path),
          ],
          path,
        ),
        makeThrowErrorExpression(
          "TypeError",
          `Cannot read private member #${key}`,
          path,
        ),
        path,
      )
    : makeApplyExpression(
        makeReadExpression("private.set", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeReadExpression(object, path),
          makePrimitiveExpression(key, path),
          makeReadExpression(value, path),
        ],
        path,
      );
