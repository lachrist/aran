import { drill } from "../site.mjs";
import { fromJust } from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import { makeReadCacheExpression } from "../cache.mjs";
import {
  makeAccessorDescriptorExpression,
  makeDataDescriptorExpression,
} from "../intrinsic.mjs";
import { splitMeta } from "../mangle.mjs";
import {
  makeApplyExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";
import {
  isFunctionExpressionSite,
  isNameSite,
  isObjectProperty,
  isProtoProperty,
} from "../predicate.mjs";
import { makeSyntaxErrorExpression } from "../syntax-error.mjs";
import { unbuildExpression, unbuildNameExpression } from "./expression.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildKeyExpression, unbuildKey } from "./key.mjs";
import { makeNameKeyExpression, makeReadKeyExpression } from "../key.mjs";
import {
  bindSequence,
  listenSequence,
  mapSequence,
  tellSequence,
  zeroSequence,
} from "../sequence.mjs";

/**
 * @template X
 * @typedef {import("../sequence.d.ts").EffectSequence<X>} EffectSequence
 */

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.ProtoProperty>,
 *   context: import("../context.js").Context,
 *   options: {},
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildProtoProperty = ({ node, path, meta }, context, {}) => {
  const sites = drill({ node, path, meta }, ["value"]);
  return unbuildExpression(sites.value, context, {});
};

/**
 * @type {(
 *   site: import("../site.mjs").Site<
 *      estree.Property & { value: estree.Expression },
 *   >,
 *   context: import("../context.js").Context,
 *   options: {
 *     self: import("../cache.mjs").Cache | null,
 *   },
 * ) => EffectSequence<[
 *   aran.Expression<unbuild.Atom>,
 *   aran.Expression<unbuild.Atom>,
 * ]>}
 */
const unbuildCommonProperty = ({ node, path, meta }, context, { self }) => {
  const metas = splitMeta(meta, ["drill", "key"]);
  const { computed } = node;
  const sites = drill({ node, path, meta: metas.drill }, ["key", "value"]);
  if (isNameSite(sites.value)) {
    const TS_NARROW = sites.value;
    return mapSequence(unbuildKey(sites.key, context, { computed }), (key) => {
      const name = makeNameKeyExpression(key, node.kind, path);
      return [
        makeReadKeyExpression(key, path),
        isFunctionExpressionSite(sites.value)
          ? unbuildFunction(sites.value, context, {
              type: "method",
              name,
              proto: fromJust(self, "self should have been provided"),
            })
          : unbuildNameExpression(TS_NARROW, context, { name }),
      ];
    });
  } else {
    return zeroSequence([
      unbuildKeyExpression(sites.key, context, { convert: false, computed }),
      unbuildExpression(sites.value, context, {}),
    ]);
  }
};

/**
 * @type {(
 *   site: import("../site.mjs").Site<
 *     estree.Property & { kind: "init", value: estree.Expression },
 *   >,
 *   context: import("../context.js").Context,
 *   options: {
 *     self: import("../cache.mjs").Cache | null,
 *   },
 * ) => EffectSequence<[
 *   aran.Expression<unbuild.Atom>,
 *   aran.Expression<unbuild.Atom>,
 * ]>}
 */
export const unbuildInitProperty = ({ node, path, meta }, context, { self }) =>
  // TODO: make ts flag null self when method is true
  // TODO: make ts flag proto property
  unbuildCommonProperty({ node, path, meta }, context, { self });

/**
 * @type {(
 *   site: import("../site.mjs").Site<
 *     estree.Property | estree.SpreadElement,
 *   >,
 *   context: import("../context.js").Context,
 *   options: {
 *     self: import("../cache.mjs").Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildProperty = ({ node, path, meta }, context, { self }) => {
  switch (node.type) {
    case "SpreadElement": {
      const sites = drill({ node, path, meta }, ["argument"]);
      return [
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Object.assign", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeReadCacheExpression(self, path),
              unbuildExpression(sites.argument, context, {}),
            ],
            path,
          ),
          path,
        ),
      ];
    }
    case "Property": {
      if (isObjectProperty(node)) {
        if (isProtoProperty(node)) {
          return [
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.setPrototypeOf", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeReadCacheExpression(self, path),
                  // __proto__ is anonymous:
                  // Reflect.getPrototypeOf({__proto__: () => {} }).name === ""
                  unbuildExpression(
                    drill({ node, path, meta }, ["value"]).value,
                    context,
                    {},
                  ),
                ],
                path,
              ),
              path,
            ),
          ];
        } else {
          return listenSequence(
            bindSequence(
              unbuildCommonProperty({ node, path, meta }, context, { self }),
              ([key, value]) =>
                tellSequence([
                  makeExpressionEffect(
                    makeApplyExpression(
                      makeIntrinsicExpression("Reflect.defineProperty", path),
                      makePrimitiveExpression({ undefined: null }, path),
                      [
                        makeReadCacheExpression(self, path),
                        key,
                        node.kind === "init"
                          ? makeDataDescriptorExpression(
                              {
                                value,
                                writable: true,
                                enumerable: true,
                                configurable: true,
                              },
                              path,
                            )
                          : makeAccessorDescriptorExpression(
                              {
                                get: node.kind === "get" ? value : null,
                                set: node.kind === "set" ? value : null,
                                enumerable: true,
                                configurable: true,
                              },
                              path,
                            ),
                      ],
                      path,
                    ),
                    path,
                  ),
                ]),
            ),
          );
        }
      } else {
        return [
          makeExpressionEffect(
            makeSyntaxErrorExpression(
              "Illegal pattern in object property",
              path,
            ),
            path,
          ),
        ];
      }
    }
    default: {
      throw new AranTypeError("invalid property", node);
    }
  }
};
