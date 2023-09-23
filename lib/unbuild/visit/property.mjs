import { DynamicSyntaxAranError, StaticSyntaxAranError } from "../../error.mjs";
import {
  makeAccessorDescriptorExpression,
  makeBinaryExpression,
  makeDataDescriptorExpression,
} from "../intrinsic.mjs";
import { mangleMetaVariable } from "../mangle.mjs";
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
import {
  unbuildArrowFunctionExpression,
  unbuildFunctionExpression,
} from "./function.mjs";
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
 * @type {<S>(
 *   node: estree.ProtoProperty,
 *   context: import("./context.js").Context<S>,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const unbuildProtoProperty = (node, context) => {
  if (isEstreePattern(node.value)) {
    throw new DynamicSyntaxAranError("illegal pattern in value property", node);
  }
  // Reflect.getPrototypeOf({__proto__: () => {} }).name === ""
  return unbuildExpression(node.value, context);
};

/** @type {(node: estree.Node) => string} */
const getStaticKey = (node) => {
  switch (node.type) {
    case "Identifier":
      return node.name;
    case "PrivateIdentifier":
      return node.name;
    case "Literal":
      return String(node.value);
    default:
      throw new DynamicSyntaxAranError("illegal static key", node);
  }
};

/**
 * @type {<S>(
 *   kind: "init" | "get" | "set",
 *   name: string,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
const makeStaticName = (kind, name, serial) =>
  makePrimitiveExpression(kind === "init" ? name : `${kind} ${name}`, serial);

/**
 * @type {<S>(
 *   kind: "init" | "get" | "set",
 *   name: unbuild.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
const makeDynamicName = (kind, name, serial) =>
  kind === "init"
    ? makeReadExpression(name, serial)
    : makeBinaryExpression(
        "+",
        makePrimitiveExpression(`${kind} `, serial),
        makeReadExpression(name, serial),
        serial,
      );

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
  const key = {
    var: mangleMetaVariable(hash, BASENAME, "key"),
    val: unbuildKeyExpression(node.key, context, node),
  };
  if (node.value.type === "ArrowFunctionExpression") {
    if (node.computed) {
      return {
        setup: [makeWriteEffect(key.var, key.val, serial, true)],
        key: makeReadExpression(key.var, serial),
        value: unbuildArrowFunctionExpression(node.value, context, {
          name: makeDynamicName(node.kind, key.var, serial),
        }),
      };
    } else {
      return {
        setup: [],
        key: key.val,
        value: unbuildArrowFunctionExpression(node.value, context, {
          name: makeStaticName(node.kind, getStaticKey(node.key), serial),
        }),
      };
    }
  } else if (node.value.type === "FunctionExpression") {
    /** @type {import("../super.mjs").Super} */
    const super_ =
      self !== null && node.method
        ? { type: "object", self }
        : { type: "none" };
    if (node.computed) {
      return {
        setup: [makeWriteEffect(key.var, key.val, serial, true)],
        key: makeReadExpression(key.var, serial),
        value: unbuildFunctionExpression(node.value, context, {
          kind: node.method ? "method" : "function",
          name: makeDynamicName(node.kind, key.var, serial),
          super: super_,
        }),
      };
    } else {
      return {
        setup: [],
        key: key.val,
        value: unbuildFunctionExpression(node.value, context, {
          kind: node.method ? "method" : "function",
          name: makeStaticName(node.kind, getStaticKey(node.key), serial),
          super: super_,
        }),
      };
    }
  } else {
    return {
      setup: [],
      key: key.val,
      value: unbuildExpression(node.value, context),
    };
  }
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
 *   kind: "init" | "get" | "set",
 *   value: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
const makeFunctionDescriptor = (kind, value, serial) =>
  kind === "init"
    ? makeDataDescriptorExpression(
        makePrimitiveExpression(true, serial),
        makePrimitiveExpression(true, serial),
        makePrimitiveExpression(true, serial),
        value,
        serial,
      )
    : makeAccessorDescriptorExpression(
        kind === "get" ? value : null,
        kind === "set" ? value : null,
        makePrimitiveExpression(true, serial),
        makePrimitiveExpression(true, serial),
        serial,
      );

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
              unbuildExpression(node.argument, context),
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
                // Reflect.getPrototypeOf({__proto__: () => {} }).name === ""
                unbuildExpression(node.value, context),
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
                makeFunctionDescriptor(node.kind, value, serial),
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
