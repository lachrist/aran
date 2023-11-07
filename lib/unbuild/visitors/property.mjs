import { drill } from "../site.mjs";
import { AranTypeError } from "../../util/error.mjs";
import { fromJust } from "../../util/index.mjs";
import { makeInitCacheUnsafe, makeReadCacheExpression } from "../cache.mjs";
import {
  makeAccessorDescriptorExpression,
  makeBinaryExpression,
  makeDataDescriptorExpression,
  makeLongSequenceExpression,
} from "../intrinsic.mjs";
import { splitMeta } from "../mangle.mjs";
import {
  makeApplyExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";
import {
  isNameSite,
  isObjectProperty,
  isProtoProperty,
} from "../predicate.mjs";
import { makeSyntaxErrorExpression } from "../report.mjs";
import { unbuildClass } from "./class.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildKeyExpression } from "./key.mjs";

/**
 * @typedef {{
 *   type: "static",
 *   value: estree.Variable
 * } | {
 *   type: "dynamic",
 *   value: unbuild.Variable
 * }} FunctionName
 */

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.Property & ({
 *     kind: "init",
 *     method: false,
 *     computed: false,
 *     key: estree.Identifier & { name: "__proto__" },
 *   } | {
 *     kind: "init",
 *     method: false,
 *     computed: true,
 *     key: estree.Literal & { value: "__proto__" },
 *   })>,
 *   context: import("../context.js").Context,
 *   options: {},
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildProtoProperty = ({ node, path, meta }, context, {}) => {
  if (isObjectProperty(node)) {
    const sites = drill({ node, path, meta }, ["value"]);
    return unbuildExpression(sites.value, context, {});
  } else {
    return makeSyntaxErrorExpression(
      "Illegal pattern in object property",
      path,
    );
  }
};

const PREFIXES = {
  init: "",
  get: "get ",
  set: "set ",
};

/**
 * @type {(
 *   key: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeStringKeyExpression = (key, path) =>
  makeApplyExpression(
    makeIntrinsicExpression("String", path),
    makePrimitiveExpression({ undefined: null }, path),
    [key],
    path,
  );

/**
 * @type {(
 *   site: import("../site.mjs").Site<(
 *     | estree.ClassExpression
 *     | estree.FunctionExpression
 *     | estree.ArrowFunctionExpression
 *   )>,
 *   context: import("../context.js").Context,
 *   options: {
 *     method: boolean,
 *     self: import("../cache.mjs").Cache | null,
 *     name: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const unbuildNamePropertyValue = (
  { node, path, meta },
  context,
  { method, self, name },
) => {
  switch (node.type) {
    case "ArrowFunctionExpression": {
      return unbuildFunction({ node, path, meta }, context, {
        type: "arrow",
        name,
      });
    }
    case "FunctionExpression": {
      return unbuildFunction(
        { node, path, meta },
        context,
        method
          ? {
              type: "method",
              name,
              proto: fromJust(self, "self should have been provided"),
            }
          : { type: "function", name },
      );
    }
    case "ClassExpression": {
      return unbuildClass({ node, path, meta }, context, { name });
    }
    default: {
      throw new AranTypeError("invalid name property value", node);
    }
  }
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
 * ) => [
 *   aran.Expression<unbuild.Atom>,
 *   aran.Expression<unbuild.Atom>,
 * ]}
 */
const unbuildCommonProperty = ({ node, path, meta }, context, { self }) => {
  const metas = splitMeta(meta, ["drill", "key"]);
  const { computed } = node;
  const sites = drill({ node, path, meta: metas.drill }, ["key", "value"]);
  if (isNameSite(sites.value)) {
    // ts shinanigans: preserve type narrowing through callback
    const sites_value = sites.value;
    return makeInitCacheUnsafe(
      "constant",
      unbuildKeyExpression(sites.key, context, { computed }),
      { path, meta: metas.key },
      (setup, key) => [
        makeLongSequenceExpression(
          setup,
          makeReadCacheExpression(key, path),
          path,
        ),
        unbuildNamePropertyValue(sites_value, context, {
          method: node.method || node.kind !== "init",
          self,
          name:
            node.kind === "init"
              ? makeStringKeyExpression(
                  makeReadCacheExpression(key, path),
                  path,
                )
              : makeBinaryExpression(
                  "+",
                  makePrimitiveExpression(PREFIXES[node.kind], path),
                  makeStringKeyExpression(
                    makeReadCacheExpression(key, path),
                    path,
                  ),
                  path,
                ),
        }),
      ],
    );
  } else {
    return [
      unbuildKeyExpression(sites.key, context, { computed }),
      unbuildExpression(sites.value, context, {}),
    ];
  }
};

/**
 * @type {(
 *   site: import("../site.mjs").Site<
 *     estree.Property & { kind: "init" },
 *   >,
 *   context: import("../context.js").Context,
 *   options: {
 *     self: import("../cache.mjs").Cache | null,
 *   },
 * ) => [
 *   aran.Expression<unbuild.Atom>,
 *   aran.Expression<unbuild.Atom>,
 * ]}
 */
export const unbuildInitProperty = (
  { node, path, meta },
  context,
  { self },
) => {
  if (isObjectProperty(node)) {
    return unbuildCommonProperty({ node, path, meta }, context, { self });
  } else {
    const { computed } = node;
    const sites = drill({ node, path, meta }, ["key"]);
    return [
      unbuildKeyExpression(sites.key, context, { computed }),
      makeSyntaxErrorExpression("Illegal pattern in object property", path),
    ];
  }
};

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
          const [key, value] = unbuildCommonProperty(
            { node, path, meta },
            context,
            { self },
          );
          return [
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
          ];
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
