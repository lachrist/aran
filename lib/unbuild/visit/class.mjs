import { StaticSyntaxAranError } from "../../error.mjs";
import { getStaticKey } from "../../estree/key.mjs";
import { enumerate, flatMap, map } from "../../util/index.mjs";
import {
  makeAccessorDescriptorExpression,
  makeBinaryExpression,
  makeDataDescriptorExpression,
  makeGetExpression,
} from "../intrinsic.mjs";
import { mangleMetaVariable } from "../mangle.mjs";
import {
  makeApplyExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeFunctionExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeWriteEffect,
} from "../node.mjs";
import { listDefinePrivateEffect } from "../private.mjs";
import { makeScopeClosureBlock } from "../scope/block.mjs";
import { makeMemoExpression } from "../sequence.mjs";
import { unbuildExpression } from "./expression.mjs";
import {
  unbuildArrowFunction,
  unbuildConstructorFunction,
  unbuildFunctionFunction,
  unbuildMethodFunction,
} from "./function.mjs";
import { unbuildKeyExpression } from "./key.mjs";
import { unbuildStatement } from "./statement.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

const BASENAME = /** @basename */ "class";

/**
 * @type {(node: estree.Node) => estree.PrivateKey[]}
 */
const unwrapPrivateKey = (node) =>
  (node.type === "PropertyDefinition" || node.type === "MethodDefinition") &&
  node.key.type === "PrivateIdentifier"
    ? [/** @type {estree.PrivateKey} */ (node.key.name)]
    : [];

/**
 * @type {<S>(
 *   kind: "method" | "get" | "set",
 *   value: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
const makeMethodDescriptor = (kind, value, serial) =>
  kind === "method"
    ? makeDataDescriptorExpression(
        makePrimitiveExpression(true, serial),
        makePrimitiveExpression(false, serial),
        makePrimitiveExpression(true, serial),
        value,
        serial,
      )
    : makeAccessorDescriptorExpression(
        kind === "get" ? value : null,
        kind === "set" ? value : null,
        makePrimitiveExpression(false, serial),
        makePrimitiveExpression(true, serial),
        serial,
      );

/**
 * @type {<S>(
 *   node:
 *     | estree.StaticBlock
 *     | estree.PropertyDefinition
 *     | estree.MethodDefinition & { kind: "method" | "get" | "set" },
 *   context: import("./context.d.ts").Context<S>,
 *   options: {
 *     constructor: unbuild.Variable,
 *     prototype: unbuild.Variable,
 *   },
 * ) => {
 *   head: aran.Effect<unbuild.Atom<S>>[],
 *   body: aran.Effect<unbuild.Atom<S>>[],
 *   delay: ((
 *     context: import("./context.d.ts").Context<S>,
 *     target: unbuild.Variable,
 *   ) => aran.Effect<unbuild.Atom<S>>[])[],
 * }}
 */
const unbuildClassElement = (node, context, options) => {
  const { serialize, digest } = context;
  const serial = serialize(node);
  const hash = digest(node);
  switch (node.type) {
    case "StaticBlock":
      return {
        head: [],
        body: [
          makeExpressionEffect(
            makeApplyExpression(
              makeFunctionExpression(
                "function",
                false,
                false,
                makeScopeClosureBlock(
                  context,
                  { type: "block", kinds: {}, with: null },
                  // eslint-disable-next-line no-shadow
                  (context) =>
                    flatMap(node.body, (child) =>
                      unbuildStatement(child, context, []),
                    ),
                  (_context) =>
                    makePrimitiveExpression({ undefined: null }, serial),
                  serial,
                ),
                serial,
              ),
              makeReadExpression(options.constructor, serial),
              [],
              serial,
            ),
            serial,
          ),
        ],
        delay: [],
      };
    case "PropertyDefinition": {
      if (node.computed) {
        const key = {
          var: mangleMetaVariable(hash, BASENAME, "key"),
          val: unbuildKeyExpression(node.key, context, node),
        };
        const name = makeReadExpression(key.var, serial);
        const listFieldEffect = (context, target) => [
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.defineProperty", serial),
              makePrimitiveExpression({ undefined: null }, serial),
              [
                makeReadExpression(target, serial),
                makeReadExpression(key.var, serial),
                makeDataDescriptorExpression(
                  makePrimitiveExpression(true, serial),
                  makePrimitiveExpression(true, serial),
                  makePrimitiveExpression(true, serial),
                  node.value == null
                    ? makePrimitiveExpression({ undefined: null }, serial)
                    : node.value.type === "ArrowFunctionExpression"
                    ? makeMemoExpression(
                        unbuildArrowFunction(node.value, context, { name }),
                        serial,
                      )
                    : node.value.type === "FunctionExpression"
                    ? makeMemoExpression(
                        unbuildFunctionFunction(node.value, context, { name }),
                        serial,
                      )
                    : unbuildExpression(node.value, context),
                  serial,
                ),
              ],
              serial,
            ),
            serial,
          ),
        ];
        return {
          head: [makeWriteEffect(key.var, key.val, serial, true)],
          body: node.static
            ? listFieldEffect(context, options.constructor)
            : [],
          delay: node.static ? [] : [listFieldEffect],
        };
      } else {
        const listFieldEffect = (context, target) => {
          const name = makePrimitiveExpression(
            (node.key.type === "PrivateIdentifier" ? "#" : "") +
              getStaticKey(node.key),
            serial,
          );
          const value =
            node.value == null
              ? makePrimitiveExpression({ undefined: null }, serial)
              : node.value.type === "ArrowFunctionExpression"
              ? makeMemoExpression(
                  unbuildArrowFunction(node.value, context, { name }),
                  serial,
                )
              : node.value.type === "FunctionExpression"
              ? makeMemoExpression(
                  unbuildFunctionFunction(node.value, context, { name }),
                  serial,
                )
              : unbuildExpression(node.value, context);
          const descriptor = makeDataDescriptorExpression(
            makePrimitiveExpression(true, serial),
            makePrimitiveExpression(true, serial),
            makePrimitiveExpression(true, serial),
            value,
            serial,
          );
          return node.key.type === "PrivateIdentifier"
            ? listDefinePrivateEffect(
                context,
                target,
                /** @type {estree.PrivateKey} */ (node.key.name),
                descriptor,
                serial,
              )
            : [
                makeExpressionEffect(
                  makeApplyExpression(
                    makeIntrinsicExpression("Reflect.defineProperty", serial),
                    makePrimitiveExpression({ undefined: null }, serial),
                    [
                      makeReadExpression(target, serial),
                      makePrimitiveExpression(getStaticKey(node.key), serial),
                      descriptor,
                    ],
                    serial,
                  ),
                  serial,
                ),
              ];
        };
        return {
          head: [],
          body: node.static
            ? listFieldEffect(context, options.constructor)
            : [],
          delay: node.static ? [] : [listFieldEffect],
        };
      }
    }
    case "MethodDefinition": {
      if (node.computed) {
        const key = {
          var: mangleMetaVariable(hash, BASENAME, "key"),
          val: unbuildKeyExpression(node.key, context, node),
        };
        return {
          head: [makeWriteEffect(key.var, key.val, serial, true)],
          body: [
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.defineProperty", serial),
                makePrimitiveExpression({ undefined: null }, serial),
                [
                  makeReadExpression(
                    node.static ? options.constructor : options.prototype,
                    serial,
                  ),
                  makeReadExpression(key.var, serial),
                  makeMethodDescriptor(
                    node.kind,
                    makeMemoExpression(
                      unbuildMethodFunction(node.value, context, {
                        prototype: TODO,
                        name:
                          node.kind === "method"
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
                    serial,
                  ),
                ],
                serial,
              ),
              serial,
            ),
          ],
          delay: [],
        };
      } else {
        const descriptor = makeMethodDescriptor(
          node.kind,
          makeMemoExpression(
            unbuildMethodFunction(node.value, context, {
              prototype: TODO,
              name: makePrimitiveExpression(
                (node.kind === "method" ? "" : `${node.kind} `) +
                  (node.key.type === "PrivateIdentifier" ? "#" : "") +
                  getStaticKey(node.key),
                serial,
              ),
            }),
            serial,
          ),
          serial,
        );
        return {
          head: [],
          body:
            node.key.type === "PrivateIdentifier"
              ? listDefinePrivateEffect(
                  context,
                  node.static ? options.constructor : options.prototype,
                  /** @type {estree.PrivateKey} */ (node.key.name),
                  descriptor,
                  serial,
                )
              : [
                  makeExpressionEffect(
                    makeApplyExpression(
                      makeIntrinsicExpression("Reflect.defineProperty", serial),
                      makePrimitiveExpression({ undefined: null }, serial),
                      [
                        makeReadExpression(
                          node.static ? options.constructor : options.prototype,
                          serial,
                        ),
                        makePrimitiveExpression(getStaticKey(node.key), serial),
                        descriptor,
                      ],
                      serial,
                    ),
                    serial,
                  ),
                ],
          delay: [],
        };
      }
    }
    default:
      throw new StaticSyntaxAranError("invalid class element node", node);
  }
};

/**
 * @type {<S>(
 *   callbacks: ((
 *     context: import("./context.d.ts").Context<S>,
 *     target: unbuild.Variable,
 *   ) => aran.Effect<unbuild.Atom<S>>[]) [],
 *   context: import("./context.d.ts").Context<S>,
 *   options: {
 *     hash: unbuild.Hash,
 *     serial: S,
 *   },
 * ) => aran.Expression<unbuild.Atom<S>> | null}
 */
const makeInstanceFieldExpression = (callbacks, context, { hash, serial }) =>
  makeFunctionExpression(
    "arrow",
    false,
    false,
    makeScopeClosureBlock(
      context,
      { type: "block", kinds: {}, with: null },
      (context) => {
        const target = {
          var: mangleMetaVariable(hash, BASENAME, "target"),
          val: makeGetExpression(
            makeReadExpression("function.arguments", serial),
            makePrimitiveExpression(0, serial),
            serial,
          ),
        };
        return [
          makeEffectStatement(
            makeWriteEffect(target.var, target.val, serial, true),
            serial,
          ),
          ...map(
            flatMap(callbacks, (callback) => callback(context, target.var)),
            (effect) => makeEffectStatement(effect, serial),
          ),
        ];
      },
      (_context) => makePrimitiveExpression({ undefined: null }, serial),
      serial,
    ),
    serial,
  );

/**
 * @type {<S>(
 *   node: estree.MethodDefinition & { kind: "constructor" },
 *   context: import("./context.d.ts").Context<S>,
 *   options: {
 *     super: unbuild.Variable,
 *     name: aran.Expression<unbuild.Atom<S>>,
 *   },
 * ) => {
 *   setup: aran.Effect<unbuild.Atom<S>>[],
 *   self: unbuild.Variable,
 *   prototype: unbuild.Variable,
 * }}
 */
export const unbuildConstructor = (node, context, options) =>
  unbuildConstructorFunction(node.value, context, options);

/**
 * @type {<S>(
 *   node: estree.ClassBody,
 *   context: import("./context.d.ts").Context<S>,
 *   options: {
 *     super: unbuild.Variable | null,
 *   },
 * ) => {
 *   setup: aran.Effect<unbuild.Atom<S>>[],
 *   self: unbuild.Variable,
 * }}
 */
export const unbuildClassBody = (node, old_context, options) => {
  const { serialize, digest } = old_context;
  const serial = serialize(node);
  const hash = digest(node);
  /** @type {[estree.PrivateKey, unbuild.Variable][]} */
  const private_record_array = map(
    flatMap(node.body, unwrapPrivateKey),
    (key) => [key, mangleMetaVariable(hash, BASENAME, `private_${key}`)],
  );
  const private_setup = map(private_record_array, ([key, variable]) =>
    makeWriteEffect(
      variable,
      makeApplyExpression(
        makeIntrinsicExpression("Symbol", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [makePrimitiveExpression(`#${key}`, serial)],
        serial,
      ),
      serial,
      true,
    ),
  );
  const prototype = mangleMetaVariable(hash, BASENAME, "prototype");
  const context = {
    ...old_context,
    private: {
      ...old_context.private,
      ...reduceEntry(private_record_array),
    },
    super: /** @type {import("../super.mjs").Super} */ ({
      type: "internal",
      prototype,
      constructor: options.super === null ? "Object" : options.super,
    }),
  };
  const keys = map(enumerate(node.body.length), (index) =>
    mangleMetaVariable(hash, BASENAME, `key_${index}`),
  );
  const key_body = zip(node.body, keys);
  const key_setup = flatMap(zip(node.body, keys), ([]) => {});
  const constructor = {
    var: mangleMetaVariable(hash, BASENAME, "constructor"),
    val: unbuildConstructorFunction(),
  };
  const field = {
    var: mangleMetaVariable(hash, BASENAME, "field"),
    val: makeInstanceFieldExpression(
      flatMap(node.body, unwrapInstanceField),
      context,
      { serial, hash },
    ),
  };
  return {
    setup: [
      ...private_setup,
      ...flatMap(enumerate(node.body.length), (index) =>
        listKeySetupEffect(node.body[index], context, { hash, index }),
      ),
      makeWriteEffect(field.var, field.val, serial, true),
      ...listStaticBlockEffect(flatMap(node.body, unwrapStaticBlock), context, {
        self: constructor.var,
        serial,
      }),
    ],
    self,
  };
};
