import { DynamicSyntaxAranError } from "../error.mjs";
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
 * @type {<S>(
 *   context: {},
 *   object: aran.Parameter | unbuild.Variable,
 *   serial: S,
 * ) => aran.Effect<unbuild.Atom<S>>[]}
 */
export const listDeclarePrivateEffect = (_context, object, serial) => [
  makeExpressionEffect(
    makeApplyExpression(
      makeIntrinsicExpression("WeakMap.prototype.set", serial),
      makeIntrinsicExpression("aran.private", serial),
      [
        makeReadExpression(object, serial),
        makeObjectExpression(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.getPrototypeOf", serial),
            makePrimitiveExpression({ undefined: null }, serial),
            [makeReadExpression(object, serial)],
            serial,
          ),
          [],
          serial,
        ),
      ],
      serial,
    ),
    serial,
  ),
];

/**
 * @type {<S>(
 *   context: { private: Private },
 *   object: aran.Parameter | unbuild.Variable,
 *   key: estree.PrivateKey,
 *   descriptor: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Effect<unbuild.Atom<S>>[]}
 */
export const listDefinePrivateEffect = (
  context,
  object,
  key,
  descriptor,
  serial,
) => {
  if (!hasOwn(context.private, key)) {
    throw new DynamicSyntaxAranError("invalid private definition");
  }
  return [
    // makeConditionalEffect(
    //   makeApplyExpression(
    //     makeIntrinsicExpression("WeakMap.prototype.has", serial),
    //     makePrimitiveExpression({ undefined: null }, serial),
    //     [
    //       makeIntrinsicExpression("aran.private", serial),
    //       makeReadExpression(object, serial),
    //     ],
    //     serial,
    //   ),
    //   [],
    //   [
    //     makeExpressionEffect(
    //       makeApplyExpression(
    //         makeIntrinsicExpression("WeakMap.prototype.set", serial),
    //         makePrimitiveExpression({ undefined: null }, serial),
    //         [
    //           makeIntrinsicExpression("aran.private", serial),
    //           makeReadExpression(object, serial),
    //           makeObjectExpression(
    //             makePrimitiveExpression(null, serial),
    //             [],
    //             serial,
    //           ),
    //         ],
    //         serial,
    //       ),
    //       serial,
    //     ),
    //   ],
    //   serial,
    // ),
    makeExpressionEffect(
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.defineProperty", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [
          makeApplyExpression(
            makeIntrinsicExpression("WeakMap.prototype.get", serial),
            makePrimitiveExpression({ undefined: null }, serial),
            [
              makeIntrinsicExpression("aran.private", serial),
              makeReadExpression(object, serial),
            ],
            serial,
          ),
          makeReadExpression(
            /** @type {unbuild.Variable} */ (context.private[key]),
            serial,
          ),
          descriptor,
        ],
        serial,
      ),
      serial,
    ),
  ];
};

/**
 * @type {<S>(
 *   context: { private: Private },
 *   object: unbuild.Variable,
 *   key: estree.PrivateKey,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeGetPrivateExpression = (context, object, key, serial) =>
  hasOwn(context.private, key)
    ? makeConditionalExpression(
        makeConditionalExpression(
          makeApplyExpression(
            makeIntrinsicExpression("WeakMap.prototype.has", serial),
            makeIntrinsicExpression("aran.private", serial),
            [makeReadExpression(object, serial)],
            serial,
          ),
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.has", serial),
            makePrimitiveExpression({ undefined: null }, serial),
            [
              makeApplyExpression(
                makeIntrinsicExpression("WeakMap.prototype.get", serial),
                makeIntrinsicExpression("aran.private", serial),
                [makeReadExpression(object, serial)],
                serial,
              ),
              makeReadExpression(
                /** @type {unbuild.Variable} */ (context.private[key]),
                serial,
              ),
            ],
            serial,
          ),
          makePrimitiveExpression(false, serial),
          serial,
        ),
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.get", serial),
          makePrimitiveExpression({ undefined: null }, serial),
          [
            makeApplyExpression(
              makeIntrinsicExpression("WeakMap.prototype.get", serial),
              makeIntrinsicExpression("aran.private", serial),
              [makeReadExpression(object, serial)],
              serial,
            ),
            makeReadExpression(
              /** @type {unbuild.Variable} */ (context.private[key]),
              serial,
            ),
            makeReadExpression(object, serial),
          ],
          serial,
        ),
        makeThrowErrorExpression(
          "TypeError",
          `Cannot read private member #${key}`,
          serial,
        ),
        serial,
      )
    : makeApplyExpression(
        makeReadExpression("private.get", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [
          makeReadExpression(object, serial),
          makePrimitiveExpression(key, serial),
        ],
        serial,
      );

/**
 * @type {<S>(
 *   context: { private: Private },
 *   object: unbuild.Variable,
 *   key: estree.PrivateKey,
 *   value: unbuild.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeSetPrivateExpression = (
  context,
  object,
  key,
  value,
  serial,
) =>
  hasOwn(context.private, key)
    ? makeConditionalExpression(
        makeConditionalExpression(
          makeApplyExpression(
            makeIntrinsicExpression("WeakMap.prototype.has", serial),
            makeIntrinsicExpression("aran.private", serial),
            [makeReadExpression(object, serial)],
            serial,
          ),
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.has", serial),
            makePrimitiveExpression({ undefined: null }, serial),
            [
              makeApplyExpression(
                makeIntrinsicExpression("WeakMap.prototype.get", serial),
                makeIntrinsicExpression("aran.private", serial),
                [makeReadExpression(object, serial)],
                serial,
              ),
              makeReadExpression(
                /** @type {unbuild.Variable} */ (context.private[key]),
                serial,
              ),
            ],
            serial,
          ),
          makePrimitiveExpression(false, serial),
          serial,
        ),
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.set", serial),
          makePrimitiveExpression({ undefined: null }, serial),
          [
            makeApplyExpression(
              makeIntrinsicExpression("WeakMap.prototype.get", serial),
              makeIntrinsicExpression("aran.private", serial),
              [makeReadExpression(object, serial)],
              serial,
            ),
            makeReadExpression(
              /** @type {unbuild.Variable} */ (context.private[key]),
              serial,
            ),
            makeReadExpression(value, serial),
            makeReadExpression(object, serial),
          ],
          serial,
        ),
        makeThrowErrorExpression(
          "TypeError",
          `Cannot read private member #${key}`,
          serial,
        ),
        serial,
      )
    : makeApplyExpression(
        makeReadExpression("private.set", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [
          makeReadExpression(object, serial),
          makePrimitiveExpression(key, serial),
          makeReadExpression(value, serial),
        ],
        serial,
      );
