import { DynamicSyntaxAranError, StaticSyntaxAranError } from "../../error.mjs";
import {
  makeAccessorDescriptorExpression,
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
import {
  makeLongSequenceExpression,
  makeMemoExpression,
} from "../sequence.mjs";
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
  /** @type {import("./function.mjs").FunctionName} */
  const name = node.computed
    ? {
        type: "dynamic",
        kind: node.kind,
        base: key.var,
      }
    : {
        type: "static",
        kind: node.kind,
        base: node.key,
      };
  const value =
    node.value.type === "ArrowFunctionExpression"
      ? makeMemoExpression(
          unbuildFunction(node.value, context, {
            kind: "arrow",
            name,
          }),
          serial,
        )
      : node.value.type === "FunctionExpression"
      ? makeMemoExpression(
          unbuildFunction(
            node.value,
            {
              ...context,
              super: {
                type: "internal",
                prototype: node.method ? self : null,
                constructor: null,
              },
            },
            {
              kind: node.method ? "method" : "function",
              name,
            },
          ),
          serial,
        )
      : unbuildExpression(node.value, context);
  return node.computed
    ? {
        setup: [makeWriteEffect(key.var, key.val, serial, true)],
        key: makeReadExpression(key.var, serial),
        value,
      }
    : {
        setup: [],
        key: key.val,
        value,
      };
};

//   if (node.computed) {

//     return {
//       setup: [makeWriteEffect(key.var, key.val, serial, true)],
//       key: makeReadExpression(key.var, serial),
//       value:
//         node.value.type === "ArrowFunctionExpression"
//           ? unbuildFunction(
//             node.value,
//             context,
//             {
//               kind: "arrow",
//               name: {
//                 type: "dynamic",
//                 kind: node.kind,
//                 base: key.var,
//               },
//             },
//     }
//   } else {

//   }

//   const key = {
//     var: mangleMetaVariable(hash, BASENAME, "key"),
//     val: unbuildKeyExpression(node.key, context, node),
//   };
//   if (node.value.type === "ArrowFunctionExpression") {
//     if (node.computed) {
//       return {
//         setup: [makeWriteEffect(key.var, key.val, serial, true)],
//         key: makeReadExpression(key.var, serial),
//         value: makeMemoExpression(
//           unbuildFunction(node.value, context, {
//             kind: "arrow",
//             name: {
//               type: "dynamic",
//               kind: node.kind,
//               base: key.var,
//             },
//           }),
//           serial,
//         ),
//       };
//     } else {
//       return {
//         setup: [],
//         key: key.val,
//         value: makeMemoExpression(
//           unbuildFunction(node.value, context, {
//             kind: "arrow",
//             name: {
//               type: "static",
//               kind: node.kind,
//               base: node.key,
//             },
//           }),
//           serial,
//         ),
//       };
//     }
//   } else if (node.value.type === "FunctionExpression") {
//     if (node.computed) {
//       return {
//         setup: [makeWriteEffect(key.var, key.val, serial, true)],
//         key: makeReadExpression(key.var, serial),
//         value: makeMemoExpression(
//           unbuildFunction(node.value, context, {
//             kind: node.method ? "method" : "function",
//             name: {
//               type: "dynamic",
//               kind: node.kind,
//               base: key.var,
//             },
//           }),
//           serial,
//         ),
//       };
//     } else {
//       return {
//         setup: [],
//         key: key.val,
//         value: makeMemoExpression(
//           unbuildFunctionFunction(node.value, context, {
//             name: makeStaticName(node.kind, getStaticKey(node.key), serial),
//           }),
//           serial,
//         ),
//       };
//     }
//   } else {
//     return {
//       setup: [],
//       key: key.val,
//       value: unbuildExpression(node.value, context),
//     };
//   }
// };

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
