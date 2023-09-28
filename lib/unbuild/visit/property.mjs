import { DynamicSyntaxAranError, StaticSyntaxAranError } from "../../error.mjs";
import {
  makeAccessorDescriptorExpression,
  makeDataDescriptorExpression,
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
import { makeLongSequenceExpression } from "../sequence.mjs";
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
  ((node.key.type === "Identifier" && node.key.name === "__proto__") ||
    (node.key.type === "Literal" && node.key.value === "__proto__"));

/**
 * @type {(
 *   node: estree.Property | estree.SpreadElement,
 * ) => node is estree.InitProperty}
 */
export const isInitProperty = (node) =>
  node.type === "Property" && node.kind === "init";

/** @type {(node: estree.Node) => node is estree.Pattern} */
const isEstreePattern = (node) =>
  node.type === "AssignmentPattern" ||
  node.type === "ArrayPattern" ||
  node.type === "ObjectPattern" ||
  node.type === "RestElement";

/**
 * @type {(
 *   node: estree.Property,
 * ) => node is estree.Property & { computed: false }}
 */
const isPropertyNotComputed = (node) => !node.computed;

/** @type {(node: estree.Property & { computed: false }) => estree.Key} */
const getStaticKey = (node) => {
  switch (node.key.type) {
    case "Identifier":
      return /** @type {estree.Key} */ (node.key.name);
    case "Literal":
      return /** @type {estree.Key} */ (String(node.value));
    default:
      throw new DynamicSyntaxAranError("invalid non-computed key", node);
  }
};

/**
 * @type {<S>(
 *   node: estree.ProtoProperty,
 *   context: import("./context.js").Context<S>,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const unbuildProtoProperty = (node, context) => {
  if (isEstreePattern(node.value)) {
    throw new DynamicSyntaxAranError("illegal pattern in value property", node);
  }
  // __proto__ is anonymous:
  // Reflect.getPrototypeOf({__proto__: () => {} }).name === ""
  return unbuildExpression(node.value, context, { name: ANONYMOUS });
};

/**
 * @type {(
 *   node: estree.Property,
 * ) => node is estree.Property & ({ method: true } | { kind: "get" | "set" })}
 */
const isMethodProperty = (node) => node.method || node.kind !== "init";

/**
 * @type {(
 *   node: estree.Property & ({ method: true } | { kind: "get" | "set" }),
 * ) => estree.FunctionExpression}
 */
const extractMethod = (node) => {
  if (node.value.type !== "FunctionExpression") {
    throw new DynamicSyntaxAranError("invalid method/accessor property", node);
  }
  return node.value;
};

/**
 * @type {<S>(
 *   node: estree.Property,
 *   context: import("./context.js").Context<S>,
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
const prepare = (node, context, { serial, hash, self }) => {
  if (isEstreePattern(node.value)) {
    throw new DynamicSyntaxAranError("illegal pattern in value property", node);
  }
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
        extractMethod(node),
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
    : unbuildExpression(node.value, context, { name });
  return node.computed
    ? {
        setup: [
          makeWriteEffect(
            key,
            unbuildKeyExpression(node.key, context, node),
            serial,
            true,
          ),
        ],
        key: makeReadExpression(key, serial),
        value,
      }
    : {
        setup: [],
        key: unbuildKeyExpression(node.key, context, node),
        value,
      };
};

/**
 * @type {<S>(
 *   node: estree.InitProperty,
 *   context: import("./context.js").Context<S>,
 *   options: { self: unbuild.Variable | null },
 * ) => [aran.Expression<unbuild.Atom<S>>, aran.Expression<unbuild.Atom<S>>]}
 */
export const unbuildInitProperty = (node, context, { self }) => {
  const { serialize, digest } = context;
  const serial = serialize(node);
  const hash = digest(node);
  const { setup, key, value } = prepare(node, context, { serial, hash, self });
  return [makeLongSequenceExpression(setup, key, serial), value];
};

/**
 * @type {<S>(
 *   node: estree.Property | estree.SpreadElement,
 *   context: import("./context.js").Context<S>,
 *   options: {
 *     self: unbuild.Variable,
 *   },
 * ) => aran.Effect<unbuild.Atom<S>>[]}
 */
export const unbuildProperty = (node, context, { self }) => {
  const { serialize, digest } = context;
  const serial = serialize(node);
  const hash = digest(node);
  switch (node.type) {
    case "SpreadElement":
      return [
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Object.assign", serial),
            makePrimitiveExpression({ undefined: null }, serial),
            [
              makeReadExpression(self, serial),
              unbuildExpression(node.argument, context, { name: ANONYMOUS }),
            ],
            serial,
          ),
          serial,
        ),
      ];
    case "Property":
      if (isEstreePattern(node.value)) {
        throw new DynamicSyntaxAranError(
          "illegal pattern in value property",
          node,
        );
      }
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
                unbuildExpression(node.value, context, { name: ANONYMOUS }),
              ],
              serial,
            ),
            serial,
          ),
        ];
      } else {
        const { setup, key, value } = prepare(node, context, {
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
    default:
      throw new StaticSyntaxAranError("illegal property", node);
  }
};
