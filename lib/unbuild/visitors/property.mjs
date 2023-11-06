import { drill } from "../../drill.mjs";
import { AranTypeError } from "../../util/error.mjs";
import { fromJust } from "../../util/index.mjs";
import { makeCachePair } from "../cache.mjs";
import {
  makeAccessorDescriptorExpression,
  makeBinaryExpression,
  makeDataDescriptorExpression,
} from "../intrinsic.mjs";
import { splitMeta } from "../mangle.mjs";
import { ANONYMOUS } from "../name.mjs";
import {
  makeApplyExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
} from "../node.mjs";
import {
  isNameProperty,
  isObjectProperty,
  isPropertyNotComputed,
  isProtoProperty,
} from "../predicate.mjs";
import { DUMMY_KEY, makeSyntaxErrorExpression } from "../report.mjs";
import { unbuildClass } from "./class.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildKeyExpression } from "./key.mjs";

const { String } = globalThis;

/**
 * @typedef {{
 *   type: "static",
 *   value: estree.Variable
 * } | {
 *   type: "dynamic",
 *   value: unbuild.Variable
 * }} FunctionName
 */

/** @type {(node: estree.Property & { computed: false }) => estree.Key} */
const getStaticKey = (node) => {
  switch (node.key.type) {
    case "Identifier": {
      return /** @type {estree.Key} */ (node.key.name);
    }
    case "Literal": {
      return /** @type {estree.Key} */ (String(node.value));
    }
    default: {
      return DUMMY_KEY;
    }
  }
};

/**
 * @type {(
 *   pair: {
 *     node: estree.Property & ({
 *       kind: "init",
 *       method: false,
 *       computed: false,
 *       key: estree.Identifier & { name: "__proto__" },
 *     } | {
 *       kind: "init",
 *       method: false,
 *       computed: true,
 *       key: estree.Literal & { value: "__proto__" },
 *     }),
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildProtoProperty = ({ node, path }, context, { meta }) => {
  if (isObjectProperty(node)) {
    return unbuildExpression(drill({ node, path }, "value"), context, {
      meta,
      name: ANONYMOUS,
    });
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
 *   pair: {
 *     node: (
 *       | estree.ClassExpression
 *       | estree.FunctionExpression
 *       | estree.ArrowFunctionExpression
 *     ),
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     method: boolean,
 *     meta: unbuild.Meta,
 *     self: unbuild.Variable | null,
 *     name: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const unbuildNamePropertyValue = (
  { node, path },
  context,
  { meta, method, self, name },
) => {
  switch (node.type) {
    case "ArrowFunctionExpression": {
      return unbuildFunction({ node, path }, context, {
        type: "arrow",
        meta,
        name,
      });
    }
    case "FunctionExpression": {
      return unbuildFunction(
        { node, path },
        context,
        method
          ? {
              type: "method",
              meta,
              self: fromJust(self, "self should have been provided"),
              name,
            }
          : { type: "function", meta, name },
      );
    }
    case "ClassExpression": {
      return unbuildClass({ node, path }, context, { meta, name });
    }
    default: {
      throw new AranTypeError("invalid name property value", node);
    }
  }
};

/**
 * @type {(
 *   pair: {
 *     node: estree.Property & { value: estree.Expression },
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *     self: unbuild.Variable | null,
 *   },
 * ) => [
 *   aran.Expression<unbuild.Atom>,
 *   aran.Expression<unbuild.Atom>,
 * ]}
 */
const unbuildCommonProperty = ({ node, path }, context, { meta, self }) => {
  if (isNameProperty(node)) {
    if (isPropertyNotComputed(node)) {
      const metas = splitMeta(meta, ["key", "value"]);
      return [
        unbuildKeyExpression(drill({ node, path }, "key"), context, {
          meta: metas.key,
          computed: node.computed,
        }),
        unbuildNamePropertyValue(drill({ node, path }, "value"), context, {
          method: node.method || node.kind !== "init",
          meta: metas.value,
          self,
          name: makePrimitiveExpression(
            `${PREFIXES[node.kind]}${getStaticKey(node)}`,
            path,
          ),
        }),
      ];
    } else {
      const metas = splitMeta(meta, ["key", "key_cache", "value"]);
      return makeCachePair(
        unbuildKeyExpression(drill({ node, path }, "key"), context, {
          meta: metas.key,
          computed: node.computed,
        }),
        path,
        metas.key_cache,
        (key) => [
          key,
          unbuildNamePropertyValue(drill({ node, path }, "value"), context, {
            method: node.method || node.kind !== "init",
            meta: metas.value,
            self,
            name:
              node.kind === "init"
                ? makeStringKeyExpression(key, path)
                : makeBinaryExpression(
                    "+",
                    makePrimitiveExpression(PREFIXES[node.kind], path),
                    makeStringKeyExpression(key, path),
                    path,
                  ),
          }),
        ],
      );
    }
  } else {
    const metas = splitMeta(meta, ["key", "value"]);
    return [
      unbuildKeyExpression(drill({ node, path }, "key"), context, {
        meta: metas.key,
        computed: node.computed,
      }),
      unbuildExpression(drill({ node, path }, "value"), context, {
        meta: metas.value,
        name: ANONYMOUS,
      }),
    ];
  }
};

/**
 * @type {(
 *   pair: {
 *     node: estree.Property & { kind: "init" },
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *     self: unbuild.Variable | null,
 *   },
 * ) => [
 *   aran.Expression<unbuild.Atom>,
 *   aran.Expression<unbuild.Atom>,
 * ]}
 */
export const unbuildInitProperty = (
  { node, path },
  context,
  { meta, self },
) => {
  if (isObjectProperty(node)) {
    return unbuildCommonProperty({ node, path }, context, { meta, self });
  } else {
    return [
      unbuildKeyExpression(drill({ node, path }, "key"), context, {
        meta,
        computed: node.computed,
      }),
      makeSyntaxErrorExpression("Illegal pattern in object property", path),
    ];
  }
};

/**
 * @type {(
 *   pair: {
 *     node: estree.Property | estree.SpreadElement,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *     self: unbuild.Variable,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildProperty = ({ node, path }, context, { meta, self }) => {
  switch (node.type) {
    case "SpreadElement": {
      return [
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Object.assign", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeReadExpression(self, path),
              unbuildExpression(drill({ node, path }, "argument"), context, {
                meta,
                name: ANONYMOUS,
              }),
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
                  makeReadExpression(self, path),
                  // __proto__ is anonymous:
                  // Reflect.getPrototypeOf({__proto__: () => {} }).name === ""
                  unbuildExpression(drill({ node, path }, "value"), context, {
                    meta,
                    name: ANONYMOUS,
                  }),
                ],
                path,
              ),
              path,
            ),
          ];
        } else {
          const [key, value] = unbuildCommonProperty({ node, path }, context, {
            meta,
            self,
          });
          return [
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.defineProperty", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeReadExpression(self, path),
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
