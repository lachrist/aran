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
  makeSequenceExpression,
  makeWriteEffect,
} from "../node.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildFunctionExpression } from "./function.mjs";
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
 *   node: estree.InitProperty,
 *   context: import("./context.js").Context<S>,
 *   options: { self: unbuild.Variable | null },
 * ) => [aran.Expression<unbuild.Atom<S>>, aran.Expression<unbuild.Atom<S>>]}
 */
export const unbuildInitProperty = (node, context, { self }) => {
  const { serialize, digest } = context;
  const serial = serialize(node);
  const hash = digest(node);
  if (isEstreePattern(node.value)) {
    throw new DynamicSyntaxAranError("illegal pattern in value property", node);
  }
  if (
    node.value.type === "ArrowFunctionExpression" ||
    node.value.type === "FunctionExpression"
  ) {
    const kind =
      node.value.type === "ArrowFunctionExpression"
        ? "arrow"
        : node.method
        ? "method"
        : "function";
    if (node.computed) {
      const key = {
        var: mangleMetaVariable(hash, BASENAME, "key"),
        val: unbuildKeyExpression(node.key, context, node),
      };
      return [
        makeSequenceExpression(
          makeWriteEffect(key.var, key.val, serial, true),
          makeReadExpression(key.var, serial),
          serial,
        ),
        unbuildFunctionExpression(node.value, context, {
          kind,
          self,
          name: makeReadExpression(key.var, serial),
        }),
      ];
    } else {
      return [
        unbuildKeyExpression(node.key, context, node),
        unbuildFunctionExpression(node.value, context, {
          kind,
          self,
          name: makePrimitiveExpression(getStaticKey(node.key), serial),
        }),
      ];
    }
  } else {
    return [
      unbuildKeyExpression(node.key, context, node),
      unbuildExpression(node.value, context),
    ];
  }
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
        if (
          node.value.type === "ArrowFunctionExpression" ||
          node.value.type === "FunctionExpression"
        ) {
          /** @type {aran.FunctionKind} */
          const kind =
            node.value.type === "ArrowFunctionExpression"
              ? "arrow"
              : node.method
              ? "method"
              : "function";
          if (node.computed) {
            const key = {
              var: mangleMetaVariable(hash, BASENAME, "key"),
              val: unbuildKeyExpression(node.key, context, node),
            };
            return [
              makeWriteEffect(key.var, key.val, serial, true),
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.defineProperty", serial),
                  makePrimitiveExpression({ undefined: null }, serial),
                  [
                    makeReadExpression(self, serial),
                    makeReadExpression(key.var, serial),
                    makeFunctionDescriptor(
                      node.kind,
                      unbuildFunctionExpression(node.value, context, {
                        kind,
                        self,
                        name:
                          node.kind === "init"
                            ? makeReadExpression(key.var, serial)
                            : makeBinaryExpression(
                                "+",
                                makePrimitiveExpression(
                                  `${node.kind} `,
                                  serial,
                                ),
                                makeReadExpression(key.var, serial),
                                serial,
                              ),
                      }),
                      serial,
                    ),
                  ],
                  serial,
                ),
                serial,
              ),
            ];
          } else {
            return [
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.defineProperty", serial),
                  makePrimitiveExpression({ undefined: null }, serial),
                  [
                    makeReadExpression(self, serial),
                    unbuildKeyExpression(node.key, context, node),
                    makeFunctionDescriptor(
                      node.kind,
                      unbuildFunctionExpression(node.value, context, {
                        kind,
                        self,
                        name: makePrimitiveExpression(
                          node.kind === "init"
                            ? getStaticKey(node.key)
                            : `${node.kind} ${getStaticKey(node.key)}`,
                          serial,
                        ),
                      }),
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
          return [
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.defineProperty", serial),
                makePrimitiveExpression({ undefined: null }, serial),
                [
                  makeReadExpression(self, serial),
                  unbuildKeyExpression(node.key, context, node),
                  makeDataDescriptorExpression(
                    makePrimitiveExpression(true, serial),
                    makePrimitiveExpression(true, serial),
                    makePrimitiveExpression(true, serial),
                    unbuildExpression(node.value, context),
                    serial,
                  ),
                ],
                serial,
              ),
              serial,
            ),
          ];
        }
      }
    default:
      throw new StaticSyntaxAranError("illegal property", node);
  }
};
