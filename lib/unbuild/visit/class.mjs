import { getStaticKey } from "../../estree/key.mjs";
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
import { unbuildFunctionExpression } from "./function.mjs";
import { unbuildKeyExpression } from "./key.mjs";

const BASENAME = /** @basename */ "class";

/**
 * @type {(
 *   node: estree.MethodDefinition,
 *   options: {
 *     constructor: {
 *       public: unbuild.Variable,
 *       private: unbuild.Variable,
 *     },
 *     prototype: {
 *       public: unbuild.Variable,
 *       private: unbuild.Variable,
 *     },
 *   },
 * ) => unbuild.Variable}
 */
const pickTarget = (node, options) =>
  options[node.static ? "constructor" : "prototype"][
    node.key.type === "PrivateIdentifier" ? "public" : "private"
  ];

/**
 * @type {}
 */
export const unbuildPropertyDefinition = (node, context, options) => {};

export const unbuildClassBody = () => {};

/**
 * @type {<S>(
 *   node: estree.MethodDefinition & { kind: "method" | "get" | "set" },
 *   context: import("./context.d.ts").Context<S>,
 *   options: {
 *     super: unbuild.Variable,
 *     constructor: {
 *       public: unbuild.Variable,
 *       private: unbuild.Variable,
 *     },
 *     prototype: {
 *       public: unbuild.Variable,
 *       private: unbuild.Variable,
 *     },
 *   },
 * ) => aran.Effect<unbuild.Atom<S>>[]}
 */
export const unbuildMethodDefinition = (node, context, options) => {
  const { serialize, digest } = context;
  const serial = serialize(node);
  const hash = digest(node);
  const key = {
    var: mangleMetaVariable(hash, BASENAME, "key"),
    val: unbuildKeyExpression(node.key, context, node),
  };
  if (node.computed) {
    const value = unbuildFunctionExpression(node.value, context, {
      kind: "method",
      name:
        node.kind === "method"
          ? makeReadExpression(key.var, serial)
          : makeBinaryExpression(
              "+",
              makePrimitiveExpression(`${node.kind} `, serial),
              makeReadExpression(key.var, serial),
              serial,
            ),
      super: {
        type: "class",
        constructor: options.super,
      },
    });
    return [
      makeWriteEffect(key.var, key.val, serial, true),
      makeExpressionEffect(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.defineProperty", serial),
          makePrimitiveExpression({ undefined: null }, serial),
          [
            makeReadExpression(pickTarget(node, options), serial),
            makeReadExpression(key.var, serial),
            node.kind === "method"
              ? makeDataDescriptorExpression(
                  makePrimitiveExpression(true, serial),
                  makePrimitiveExpression(false, serial),
                  makePrimitiveExpression(true, serial),
                  value,
                  serial,
                )
              : makeAccessorDescriptorExpression(
                  node.kind === "get" ? value : null,
                  node.kind === "set" ? value : null,
                  makePrimitiveExpression(false, serial),
                  makePrimitiveExpression(true, serial),
                  serial,
                ),
          ],
          serial,
        ),
        serial,
      ),
    ];
  } else {
    const value = unbuildFunctionExpression(node.value, context, {
      kind: "method",
      name:
        node.kind === "method"
          ? makePrimitiveExpression(getStaticKey(node.key), serial)
          : makeBinaryExpression(
              "+",
              makePrimitiveExpression(`${node.kind} `, serial),
              makePrimitiveExpression(getStaticKey(node.key), serial),
              serial,
            ),
      super: {
        type: "class",
        constructor: options.super,
      },
    });
    return [
      makeExpressionEffect(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.defineProperty", serial),
          makePrimitiveExpression({ undefined: null }, serial),
          [
            makeReadExpression(pickTarget(node, options), serial),
            makeReadExpression(key.var, serial),
            node.kind === "method"
              ? makeDataDescriptorExpression(
                  makePrimitiveExpression(true, serial),
                  makePrimitiveExpression(false, serial),
                  makePrimitiveExpression(true, serial),
                  value,
                  serial,
                )
              : makeAccessorDescriptorExpression(
                  node.kind === "get" ? value : null,
                  node.kind === "set" ? value : null,
                  makePrimitiveExpression(false, serial),
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
};

// /* eslint-disable */
// // @ts-nocheck

// import { ok as assert } from "node:assert";

// class XX {}
// class X extends XX {
//   m() {
//     return super.foo;
//   }
// }
// const x = new X();
// const p1 = Reflect.getPrototypeOf(x);
// assert(p1 === X.prototype);
// const p2 = Reflect.getPrototypeOf(p1);
// assert(p2 === XX.prototype);
// const p3 = Reflect.getPrototypeOf(p2);
// assert(p3 === Object.prototype);
// const p4 = Reflect.getPrototypeOf(p3);
// assert(p4 === null);

// assert(x.m() === undefined);
// x.foo = 123;
// assert(x.m() === undefined);
// p1.foo = 123;
// assert(x.m() === undefined);
// p2.foo = 123;
// assert(x.m() === 123);

// Reflect.setPrototypeOf(x, { __proto__: null, mm: X.prototype.m });
// console.log(x.mm());

// new class { #foo = 123; constructor () { console.log(Object.getOwnPropertyDescriptors(this)); } }
