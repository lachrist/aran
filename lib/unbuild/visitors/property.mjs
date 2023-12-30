import { fromJust } from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import { makeReadCacheExpression } from "../cache.mjs";
import {
  makeAccessorDescriptorExpression,
  makeDataDescriptorExpression,
} from "../intrinsic.mjs";
import {
  makeApplyExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";
import { makeEarlyErrorExpression } from "../early-error.mjs";
import { unbuildExpression, unbuildNameExpression } from "./expression.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildKeyExpression, unbuildKey } from "./key.mjs";
import {
  bindSequence,
  listenSequence,
  mapSequence,
  tellSequence,
  zeroSequence,
} from "../sequence.mjs";
import { drillSite } from "../site.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { makeKeyExpression } from "../member.mjs";

/**
 * @type {(
 *   node: estree.Property,
 * ) => node is estree.Property & {
 *   value: (
 *     | estree.ClassDeclaration
 *     | estree.FunctionExpression
 *     | estree.ArrowFunctionExpression
 *   ),
 * }}
 */
const isNameProperty = (node) =>
  node.value.type === "ClassExpression" ||
  node.value.type === "FunctionExpression" ||
  node.value.type === "ArrowFunctionExpression";

/**
 * @type {(
 *   node: estree.Property,
 * ) => node is estree.Property & { value: estree.Expression }}
 */
export const isObjectProperty = (node) =>
  node.value.type !== "ArrayPattern" &&
  node.value.type !== "ObjectPattern" &&
  node.value.type !== "AssignmentPattern" &&
  node.value.type !== "RestElement";

/**
 * @type {(
 *   node: estree.Property | estree.SpreadElement,
 * ) => node is estree.ProtoProperty}
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
 *   site: import("../site.d.ts").Site<estree.ProtoProperty>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildProtoProperty = ({ node, path, meta }, scope, _options) =>
  unbuildExpression(drillSite(node, path, meta, "value"), scope, null);

/**
 * @type {(
 *   node: estree.Property,
 * ) => node is estree.Property & {
 *   value: estree.FunctionExpression
 * }}
 */
const isFunctionProperty = (node) => node.value.type === "FunctionExpression";

/**
 * @type {(
 *   site: import("../site").Site<estree.Property>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     self: import("../cache.d.ts").Cache | null,
 *   },
 * ) => import("../sequence").EffectSequence<[
 *   aran.Expression<unbuild.Atom>,
 *   aran.Expression<unbuild.Atom>,
 * ]>}
 */
const unbuildCommonProperty = ({ node, path, meta }, scope, { self }) => {
  if (isNameProperty(node)) {
    return mapSequence(
      unbuildKey(
        drillSite(node, path, forkMeta((meta = nextMeta(meta))), "key"),
        scope,
        { computed: node.computed },
      ),
      (key) => [
        makeKeyExpression({ path }, key),
        (node.method || node.kind !== "init") && isFunctionProperty(node)
          ? unbuildFunction(
              drillSite(node, path, forkMeta((meta = nextMeta(meta))), "value"),
              scope,
              {
                type: "method",
                name: { type: "property", kind: node.kind, key },
                proto: fromJust(self, "self should have been provided"),
              },
            )
          : unbuildNameExpression(
              drillSite(node, path, forkMeta((meta = nextMeta(meta))), "value"),
              scope,
              { name: { type: "property", kind: node.kind, key } },
            ),
      ],
    );
  } else {
    return zeroSequence([
      unbuildKeyExpression(
        drillSite(node, path, forkMeta((meta = nextMeta(meta))), "key"),
        scope,
        { convert: false, computed: node.computed },
      ),
      isObjectProperty(node)
        ? unbuildExpression(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "value"),
            scope,
            null,
          )
        : makeEarlyErrorExpression("Illegal pattern in object property", path),
    ]);
  }
};

/**
 * @type {(
 *   site: import("../site").Site<
 *     estree.Property & {
 *       kind: "init",
 *     },
 *   >,
 *   scope: import("../scope").Scope,
 *   options: {
 *     self: import("../cache").Cache,
 *   },
 * ) => import("../sequence.d.ts").EffectSequence<[
 *   aran.Expression<unbuild.Atom>,
 *   aran.Expression<unbuild.Atom>,
 * ]>}
 */
export const unbuildInitProperty = ({ node, path, meta }, scope, { self }) =>
  unbuildCommonProperty({ node, path, meta }, scope, { self });

/**
 * @type {(
 *   site: import("../site").Site<
 *     estree.Property & {
 *       kind: "init",
 *       method: false,
 *     },
 *   >,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../sequence").EffectSequence<[
 *   aran.Expression<unbuild.Atom>,
 *   aran.Expression<unbuild.Atom>,
 * ]>}
 */
export const unbuildInitNonMethodProperty = (
  { node, path, meta },
  scope,
  _options,
) => unbuildCommonProperty({ node, path, meta }, scope, { self: null });

/**
 * @type {(
 *   site: import("../site").Site<
 *     estree.Property | estree.SpreadElement,
 *   >,
 *   scope: import("../scope").Scope,
 *   options: {
 *     self: import("../cache").Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildProperty = ({ node, path, meta }, scope, { self }) => {
  switch (node.type) {
    case "SpreadElement": {
      return [
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Object.assign", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
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
                    drillSite(
                      node,
                      path,
                      forkMeta((meta = nextMeta(meta))),
                      "value",
                    ),
                    scope,
                    null,
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
            makeEarlyErrorExpression(
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
