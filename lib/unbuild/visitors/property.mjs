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

const BASENAME = /** @basename */ "property";

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
 * @type {<S>(
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
 *   context: import("../context.js").Context<S>,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const unbuildProtoProperty = ({ node, path }, context) => {
  if (isObjectProperty(node)) {
    return unbuildExpression(drill({ node, path }, "value"), context, {
      name: ANONYMOUS,
    });
  } else {
    throw new SyntaxAranError("illegal pattern in object property", node);
  }
};

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
 * @type {<S>(
 *   pair: {
 *     node: estree.Property,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context<S>,
 *   options: {
 *     serial: S,
 *     hash: unbuild.Hash,
 *     self: unbuild.Variable | null,
 *   },
 * ) => {
 *   setup: aran.Effect<unbuild.Atom<S>>[],
 *   key: aran.Expression<unbuild.Atom<S>>,
 *   value: aran.Expression<unbuild.Atom<S>>,
 * }}
 */
const prepare = ({ node, path }, context, { serial, hash, self }) => {
  if (isObjectProperty(node)) {
    const key = mangleMetaVariable(hash, BASENAME, "key");
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
              serial,
              true,
            ),
          ],
          key: makeReadExpression(key, serial),
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
 * @type {<S>(
 *   pair: {
 *     node: estree.Property & { kind: "init" },
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context<S>,
 *   options: { self: unbuild.Variable | null },
 * ) => [aran.Expression<unbuild.Atom<S>>, aran.Expression<unbuild.Atom<S>>]}
 */
export const unbuildInitProperty = ({ node, path }, context, { self }) => {
  if (isObjectProperty(node)) {
    const { serialize, digest } = context;
    const serial = serialize(node, path);
    const hash = digest(node, path);
    const { setup, key, value } = prepare({ node, path }, context, {
      serial,
      hash,
      self,
    });
    return [makeLongSequenceExpression(setup, key, serial), value];
  } else {
    throw new SyntaxAranError("illegal pattern in object property", node);
  }
};

/**
 * @type {<S>(
 *   pair: {
 *     node: estree.Property | estree.SpreadElement,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context<S>,
 *   options: {
 *     self: unbuild.Variable,
 *   },
 * ) => aran.Effect<unbuild.Atom<S>>[]}
 */
export const unbuildProperty = ({ node, path }, context, { self }) => {
  const { serialize, digest } = context;
  const serial = serialize(node, path);
  const hash = digest(node, path);
  switch (node.type) {
    case "SpreadElement":
      return [
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Object.assign", serial),
            makePrimitiveExpression({ undefined: null }, serial),
            [
              makeReadExpression(self, serial),
              unbuildExpression(drill({ node, path }, "argument"), context, {
                name: ANONYMOUS,
              }),
            ],
            serial,
          ),
          serial,
        ),
      ];
    case "Property":
      if (isObjectProperty(node)) {
        if (isProtoProperty(node)) {
          return [
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.setPrototypeOf", serial),
                makePrimitiveExpression({ undefined: null }, serial),
                [
                  makeReadExpression(self, serial),
                  // __proto__ is anonymous:
                  // Reflect.getPrototypeOf({__proto__: () => {} }).name === ""
                  unbuildExpression(drill({ node, path }, "value"), context, {
                    name: ANONYMOUS,
                  }),
                ],
                serial,
              ),
              serial,
            ),
          ];
        } else {
          const { setup, key, value } = prepare({ node, path }, context, {
            serial,
            hash,
            self,
          });
          return [
            ...setup,
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.defineProperty", serial),
                makePrimitiveExpression({ undefined: null }, serial),
                [
                  makeReadExpression(self, serial),
                  key,
                  node.kind === "init"
                    ? makeDataDescriptorExpression(
                        makePrimitiveExpression(true, serial),
                        makePrimitiveExpression(true, serial),
                        makePrimitiveExpression(true, serial),
                        value,
                        serial,
                      )
                    : makeAccessorDescriptorExpression(
                        node.kind === "get" ? value : null,
                        node.kind === "set" ? value : null,
                        makePrimitiveExpression(true, serial),
                        makePrimitiveExpression(true, serial),
                        serial,
                      ),
                ],
                serial,
              ),
              serial,
            ),
          ];
        }
      } else {
        throw new SyntaxAranError("illegal pattern in object property", node);
      }
    default:
      throw new StaticError("invalid property", node);
  }
};
