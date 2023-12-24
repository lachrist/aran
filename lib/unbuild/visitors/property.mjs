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
import { drillSite, nextSite } from "../site.mjs";

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.ProtoProperty>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildProtoProperty = (site, scope, _options) =>
  unbuildExpression(drillSite((site = nextSite(site)), "value"), scope, null);

/**
 * @type {(
 *   site: import("../site.d.ts").Site<
 *      estree.Property & { value: estree.Expression },
 *   >,
 *   scope: import("../scope").Scope,
 *   options: {
 *     self: import("../cache.d.ts").Cache | null,
 *   },
 * ) => import("../sequence.d.ts").EffectSequence<[
 *   aran.Expression<unbuild.Atom>,
 *   aran.Expression<unbuild.Atom>,
 * ]>}
 */
const unbuildCommonProperty = (site, scope, { self }) => {
  const {
    node: {
      computed,
      value: { type: value_type },
    },
    path,
  } = site;
  if (
    value_type === "ClassExpression" ||
    value_type === "FunctionExpression" ||
    value_type === "ArrowFunctionExpression"
  ) {
    return mapSequence(
      unbuildKey(drillSite((site = nextSite(site)), "key"), scope, {
        computed,
      }),
      (key) => {
        const name = makeNameKeyExpression(key, node.kind, path);
        return [
          makeReadKeyExpression(key, path),
          (node.method || node.kind !== "init") &&
          isFunctionExpressionSite(sites.value)
            ? unbuildFunction(sites.value, scope, {
                type: "method",
                name,
                proto: fromJust(self, "self should have been provided"),
              })
            : unbuildNameExpression(TS_NARROW, scope, { name }),
        ];
      },
    );
  } else {
    return zeroSequence([
      unbuildKeyExpression(sites.key, scope, { convert: false, computed }),
      unbuildExpression(sites.value, scope, {}),
    ]);
  }
};

/**
 * @type {(
 *   site: import("../site.d.ts").Site<
 *     estree.Property & { kind: "init", value: estree.Expression },
 *   >,
 *   scope: import("../scope").Scope,
 *   options: {
 *     self: import("../cache.d.ts").Cache | null,
 *   },
 * ) => import("../sequence.d.ts").EffectSequence<[
 *   aran.Expression<unbuild.Atom>,
 *   aran.Expression<unbuild.Atom>,
 * ]>}
 */
export const unbuildInitProperty = ({ node, path, meta }, scope, { self }) =>
  // TODO: make ts flag null self when method is true
  // TODO: make ts flag proto property
  unbuildCommonProperty({ node, path, meta }, scope, { self });

/**
 * @type {(
 *   site: import("../site.d.ts").Site<
 *     estree.Property | estree.SpreadElement,
 *   >,
 *   scope: import("../scope").Scope,
 *   options: {
 *     self: import("../cache.d.ts").Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildProperty = ({ node, path, meta }, scope, { self }) => {
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
              unbuildExpression(sites.argument, scope, {}),
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
                    scope,
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
              unbuildCommonProperty({ node, path, meta }, scope, { self }),
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
