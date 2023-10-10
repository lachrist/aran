import { drill } from "../../drill.mjs";
import { SyntaxAranError } from "../../error.mjs";
import { StaticError } from "../../util/error.mjs";
import {
  makeAccessorDescriptorExpression,
  makeDataDescriptorExpression,
  makeLongSequenceExpression,
} from "../intrinsic.mjs";
import { mangleMetaVariable } from "../mangle.mjs";
import { ANONYMOUS } from "../name.mjs";
import {
  makeApplyExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeWriteEffect,
} from "../node.mjs";
import { wrapOrigin, wrapOriginArray, wrapOriginPair } from "../origin.mjs";
import {
  isFunctionProperty,
  isMethodProperty,
  isObjectProperty,
  isPropertyNotComputed,
  isProtoProperty,
} from "../predicate.mjs";
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

const BASENAME = /** @type {__basename} */ ("property");

/** @type {(node: estree.Property & { computed: false }) => estree.Key} */
const getStaticKey = (node) => {
  switch (node.key.type) {
    case "Identifier":
      return /** @type {estree.Key} */ (node.key.name);
    case "Literal":
      return /** @type {estree.Key} */ (String(node.value));
    default:
      throw new SyntaxAranError("invalid non-computed key", node);
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
 *   options: null,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildProtoProperty = wrapOrigin(({ node, path }, context) => {
  if (isObjectProperty(node)) {
    return unbuildExpression(drill({ node, path }, "value"), context, {
      name: ANONYMOUS,
    });
  } else {
    throw new SyntaxAranError("illegal pattern in object property", node);
  }
});

/**
 * @type {(
 *   pair: {
 *     node: estree.Property & ({ method: true } | { kind: "get" | "set" }),
 *     path: unbuild.Path,
 *   },
 * ) => {
 *   node: estree.FunctionExpression,
 *   path: unbuild.Path,
 * }}
 */
const extractMethod = ({ node, path }) => {
  if (isFunctionProperty(node)) {
    return drill({ node, path }, "value");
  } else {
    throw new SyntaxAranError("invalid method/accessor property", node);
  }
};

/**
 * @type {(
 *   pair: {
 *     node: estree.Property,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     self: unbuild.Variable | null,
 *   },
 * ) => {
 *   setup: aran.Effect<unbuild.Atom>[],
 *   key: aran.Expression<unbuild.Atom>,
 *   value: aran.Expression<unbuild.Atom>,
 * }}
 */
const prepare = ({ node, path }, context, { self }) => {
  if (isObjectProperty(node)) {
    const key = mangleMetaVariable(
      BASENAME,
      /** @type {__unique} */ ("key"),
      path,
    );
    /** @type {import("../name.mjs").Name} */
    const name = isPropertyNotComputed(node)
      ? {
          type: "static",
          kind: node.kind,
          base: getStaticKey(node),
        }
      : {
          type: "dynamic",
          kind: node.kind,
          base: key,
        };
    const value = isMethodProperty(node)
      ? unbuildFunction(
          extractMethod({ node, path }),
          {
            ...context,
            record: {
              ...context.record,
              "super.prototype": self !== null ? self : ".illegal",
              "super.constructor": ".illegal",
            },
          },
          {
            kind: node.method ? "method" : "function",
            name,
          },
        )
      : unbuildExpression(drill({ node, path }, "value"), context, { name });
    return node.computed
      ? {
          setup: [
            makeWriteEffect(
              key,
              unbuildKeyExpression(drill({ node, path }, "key"), context, node),
              true,
            ),
          ],
          key: makeReadExpression(key),
          value,
        }
      : {
          setup: [],
          key: unbuildKeyExpression(
            drill({ node, path }, "key"),
            context,
            node,
          ),
          value,
        };
  } else {
    throw new SyntaxAranError("invalid pattern in object  property", node);
  }
};

/**
 * @type {(
 *   pair: {
 *     node: estree.Property & { kind: "init" },
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: { self: unbuild.Variable | null },
 * ) => [aran.Expression<unbuild.Atom>, aran.Expression<unbuild.Atom>]}
 */
export const unbuildInitProperty = wrapOriginPair(
  ({ node, path }, context, { self }) => {
    if (isObjectProperty(node)) {
      const { setup, key, value } = prepare({ node, path }, context, { self });
      return [makeLongSequenceExpression(setup, key), value];
    } else {
      throw new SyntaxAranError("illegal pattern in object property", node);
    }
  },
);

/**
 * @type {(
 *   pair: {
 *     node: estree.Property | estree.SpreadElement,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     self: unbuild.Variable,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildProperty = wrapOriginArray(
  ({ node, path }, context, { self }) => {
    switch (node.type) {
      case "SpreadElement":
        return [
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Object.assign"),
              makePrimitiveExpression({ undefined: null }),
              [
                makeReadExpression(self),
                unbuildExpression(drill({ node, path }, "argument"), context, {
                  name: ANONYMOUS,
                }),
              ],
            ),
          ),
        ];
      case "Property":
        if (isObjectProperty(node)) {
          if (isProtoProperty(node)) {
            return [
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.setPrototypeOf"),
                  makePrimitiveExpression({ undefined: null }),
                  [
                    makeReadExpression(self),
                    // __proto__ is anonymous:
                    // Reflect.getPrototypeOf({__proto__: () => {} }).name === ""
                    unbuildExpression(drill({ node, path }, "value"), context, {
                      name: ANONYMOUS,
                    }),
                  ],
                ),
              ),
            ];
          } else {
            const { setup, key, value } = prepare({ node, path }, context, {
              self,
            });
            return [
              ...setup,
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.defineProperty"),
                  makePrimitiveExpression({ undefined: null }),
                  [
                    makeReadExpression(self),
                    key,
                    node.kind === "init"
                      ? makeDataDescriptorExpression(
                          makePrimitiveExpression(true),
                          makePrimitiveExpression(true),
                          makePrimitiveExpression(true),
                          value,
                        )
                      : makeAccessorDescriptorExpression(
                          node.kind === "get" ? value : null,
                          node.kind === "set" ? value : null,
                          makePrimitiveExpression(true),
                          makePrimitiveExpression(true),
                        ),
                  ],
                ),
              ),
            ];
          }
        } else {
          throw new SyntaxAranError("illegal pattern in object property", node);
        }
      default:
        throw new StaticError("invalid property", node);
    }
  },
);
