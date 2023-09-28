import { SyntaxAranError } from "../../error.mjs";
import { filter, filterOut, flatMap, map, reduce } from "../../util/index.mjs";
import {
  makeAccessorDescriptorExpression,
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
  makeSequenceExpression,
  makeWriteEffect,
} from "../node.mjs";
import {
  listDeclarePrivateEffect,
  listDefinePrivateEffect,
} from "../private.mjs";
import { makeScopeClosureBlock } from "../scope/block.mjs";
import { makeLongSequenceExpression } from "../sequence.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildKeyExpression } from "./key.mjs";
import { unbuildStatement } from "./statement.mjs";
import { ANONYMOUS, makeNameExpression } from "../name.mjs";
import { makeCallSuperExpression } from "../record.mjs";

const {
  String,
  Object: { fromEntries: reduceEntry },
} = globalThis;

const BASENAME = /** @basename */ "class";

/**
 * @template S
 * @typedef {{
 *   head: aran.Effect<unbuild.Atom<S>>[],
 *   body: aran.Effect<unbuild.Atom<S>>[],
 *   post: ((
 *     context: import("../context.js").Context<S>,
 *     target: aran.Parameter | unbuild.Variable,
 *   ) => aran.Effect<unbuild.Atom<S>>[])[],
 * }} Element
 */

/**
 * @type {(
 *   node: estree.PropertyDefinition,
 * ) => node is estree.PropertyDefinition & { computed: false }}
 */
const isPropertyDefinitionNotComputed = (node) => !node.computed;

/**
 * @type {(
 *   node: estree.MethodDefinition,
 * ) => node is estree.MethodDefinition & { computed: false }}
 */
const isMethodDefinitionNotComputed = (node) => !node.computed;

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
 * @type {(
 *   node: estree.PropertyDefinition & { computed: false },
 * ) => estree.Key}
 */
const getPropertyKey = (node) => {
  switch (node.key.type) {
    case "PrivateIdentifier":
      return /** @type {estree.Key} */ (`#${node.key.name}`);
    case "Identifier":
      return /** @type {estree.Key} */ (node.key.name);
    default:
      throw new SyntaxAranError("invalid non-computed property key", node);
  }
};

/** @type {(node: estree.Node) => boolean} */
const isConstructor = (node) =>
  node.type === "MethodDefinition" && node.kind === "constructor";

/**
 * @type {(
 *   node: estree.ClassBody,
 * ) => {
 *   constructor: null | estree.MethodDefinition & { kind: "constructor" },
 *   definitions: (
 *     | estree.MethodDefinition & { kind: "method" | "get" | "set" }
 *     | estree.PropertyDefinition
 *     | estree.StaticBlock
 *   )[],
 * }}
 */
const extractConstructor = (node) => {
  const constructors = filter(node.body, isConstructor);
  switch (constructors.length) {
    case 0:
      return {
        constructor: null,
        definitions: /** @type {any} */ (node.body),
      };
    case 1:
      return {
        constructor: /** @type {any} */ (constructors[0]),
        definitions: /** @type {any} */ (filterOut(node.body, isConstructor)),
      };
    default:
      throw new SyntaxAranError("multiple class constructor", node);
  }
};

/**
 * @type {(
 *   node: estree.MethodDefinition & { computed: false },
 * ) => estree.Key}
 */
const getMethodKey = (node) => {
  switch (node.key.type) {
    case "PrivateIdentifier":
      return /** @type {estree.Key} */ (`#${node.key.name}`);
    case "Identifier":
      return /** @type {estree.Key} */ (node.key.name);
    case "Literal":
      return /**@type {estree.Key} */ (String(node.key.value));
    default:
      throw new SyntaxAranError("invalid non-computed method key", node);
  }
};

/**
 * @type {<S>(
 *   node: estree.PropertyDefinition & { computed: false },
 *   context: import("../context.js").Context<S>,
 *   options: {
 *     target: aran.Parameter | unbuild.Variable,
 *     serial: S,
 *   },
 * ) => aran.Effect<unbuild.Atom<S>>[]}
 */
const listNonComputedFieldEffect = (node, context, { target, serial }) => {
  const value =
    node.value == null
      ? makePrimitiveExpression({ undefined: null }, serial)
      : unbuildExpression(node.value, context, {
          name: {
            type: "static",
            kind: "field",
            base: getPropertyKey(node),
          },
        });
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
        { serial, origin: node },
      )
    : [
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.defineProperty", serial),
            makePrimitiveExpression({ undefined: null }, serial),
            [
              makeReadExpression(target, serial),
              makePrimitiveExpression(getPropertyKey(node), serial),
              descriptor,
            ],
            serial,
          ),
          serial,
        ),
      ];
};

/**
 * @type {<S>(
 *   node: estree.PropertyDefinition,
 *   context: import("../context.js").Context<S>,
 *   options: {
 *     key: unbuild.Variable,
 *     target: aran.Parameter | unbuild.Variable,
 *     serial: S,
 *   },
 * ) => aran.Effect<unbuild.Atom<S>>[]}
 */
const listFieldEffect = (node, context, { key, target, serial }) => [
  makeExpressionEffect(
    makeApplyExpression(
      makeIntrinsicExpression("Reflect.defineProperty", serial),
      makePrimitiveExpression({ undefined: null }, serial),
      [
        makeReadExpression(target, serial),
        makeReadExpression(key, serial),
        makeDataDescriptorExpression(
          makePrimitiveExpression(true, serial),
          makePrimitiveExpression(true, serial),
          makePrimitiveExpression(true, serial),
          node.value == null
            ? makePrimitiveExpression({ undefined: null }, serial)
            : unbuildExpression(node.value, context, {
                name: {
                  type: "dynamic",
                  kind: "field",
                  base: key,
                },
              }),
          serial,
        ),
      ],
      serial,
    ),
    serial,
  ),
];

/**
 * @type {<S>(
 *   node:
 *     | estree.StaticBlock
 *     | estree.PropertyDefinition
 *     | estree.MethodDefinition & { kind: "method" | "get" | "set" },
 *   context: import("../context.js").Context<S>,
 *   options: {
 *     constructor: unbuild.Variable,
 *     prototype: unbuild.Variable,
 *   },
 * ) => Element<S>}
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
                      unbuildStatement(child, context, {
                        labels: [],
                        completion: null,
                      }),
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
        post: [],
      };
    case "PropertyDefinition": {
      if (isPropertyDefinitionNotComputed(node)) {
        return {
          head: [],
          body: node.static
            ? listNonComputedFieldEffect(node, context, {
                serial,
                target: options.prototype,
              })
            : [],
          post: node.static
            ? []
            : [
                // eslint-disable-next-line no-shadow
                (context, target) =>
                  listNonComputedFieldEffect(node, context, { serial, target }),
              ],
        };
      } else {
        const key = mangleMetaVariable(hash, BASENAME, "key");
        return {
          head: [
            makeWriteEffect(
              key,
              unbuildKeyExpression(node.key, context, node),
              serial,
              true,
            ),
          ],
          body: node.static
            ? listFieldEffect(node, context, {
                key,
                target: options.constructor,
                serial,
              })
            : [],
          post: node.static
            ? []
            : [
                // eslint-disable-next-line no-shadow
                (context, target) =>
                  listFieldEffect(node, context, {
                    key,
                    target,
                    serial,
                  }),
              ],
        };
      }
    }
    case "MethodDefinition": {
      if (isMethodDefinitionNotComputed(node)) {
        const descriptor = makeMethodDescriptor(
          node.kind,
          unbuildFunction(node.value, context, {
            kind: "method",
            name: {
              type: "static",
              kind: node.kind,
              base: getMethodKey(node),
            },
          }),
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
                  { serial, origin: node },
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
                        makePrimitiveExpression(getMethodKey(node), serial),
                        descriptor,
                      ],
                      serial,
                    ),
                    serial,
                  ),
                ],
          post: [],
        };
      } else {
        const key = mangleMetaVariable(hash, BASENAME, "key");
        return {
          head: [
            makeWriteEffect(
              key,
              unbuildKeyExpression(node.key, context, node),
              serial,
              true,
            ),
          ],
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
                  makeReadExpression(key, serial),
                  makeMethodDescriptor(
                    node.kind,
                    unbuildFunction(node.value, context, {
                      kind: "method",
                      name: {
                        type: "dynamic",
                        kind: node.kind,
                        base: key,
                      },
                    }),
                    serial,
                  ),
                ],
                serial,
              ),
              serial,
            ),
          ],
          post: [],
        };
      }
    }
    default:
      throw new SyntaxAranError("invalid class element node", node);
  }
};

/**
 * @type {<S>(
 *   callbacks: ((
 *     context: import("../context.js").Context<S>,
 *     target: aran.Parameter | unbuild.Variable,
 *   ) => aran.Effect<unbuild.Atom<S>>[]) [],
 *   context: import("../context.js").Context<S>,
 *   options: {
 *     serial: S,
 *   },
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
const makeInstanceFieldExpression = (callbacks, context, { serial }) =>
  makeFunctionExpression(
    "arrow",
    false,
    false,
    makeScopeClosureBlock(
      context,
      { type: "block", kinds: {}, with: null },
      // eslint-disable-next-line no-shadow
      (context) =>
        map(
          [
            ...listDeclarePrivateEffect(context, "this", serial),
            ...flatMap(callbacks, (callback) => callback(context, "this")),
          ],
          (effect) => makeEffectStatement(effect, serial),
        ),
      (_context) => makeReadExpression("this", serial),
      serial,
    ),
    serial,
  );

/**
 * @type {<S>(
 *   context: import("../context.js").Context<S>,
 *   options: {
 *     name: import("../name.mjs").Name,
 *     hash: unbuild.Hash,
 *     serial: S,
 *   },
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
const makeDefaultConstructor = (context, { name, serial, hash }) => {
  const self = mangleMetaVariable(hash, BASENAME, "self");
  return makeLongSequenceExpression(
    [
      makeWriteEffect(
        self,
        makeFunctionExpression(
          "constructor",
          false,
          false,
          makeScopeClosureBlock(
            context,
            { type: "block", kinds: {}, with: null },
            (_context) => [],
            (_context) =>
              makeCallSuperExpression(
                {
                  ...context,
                  record: {
                    ...context.record,
                    "new.target": "new.target",
                  },
                },
                makeReadExpression("function.arguments", serial),
                { serial, origin: { type: "Literal", value: "dummy" } },
              ),
            serial,
          ),
          serial,
        ),
        serial,
        true,
      ),
      makeExpressionEffect(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.defineProperty", serial),
          makePrimitiveExpression({ undefined: null }, serial),
          [
            makeReadExpression(self, serial),
            makePrimitiveExpression("length", serial),
            makeDataDescriptorExpression(
              makePrimitiveExpression(false, serial),
              makePrimitiveExpression(false, serial),
              makePrimitiveExpression(true, serial),
              makePrimitiveExpression(0, serial),
              serial,
            ),
          ],
          serial,
        ),
        serial,
      ),
      makeExpressionEffect(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.defineProperty", serial),
          makePrimitiveExpression({ undefined: null }, serial),
          [
            makeReadExpression(self, serial),
            makePrimitiveExpression("name", serial),
            makeDataDescriptorExpression(
              makePrimitiveExpression(false, serial),
              makePrimitiveExpression(false, serial),
              makePrimitiveExpression(true, serial),
              makeNameExpression(name, serial),
              serial,
            ),
          ],
          serial,
        ),
        serial,
      ),
    ],
    makeReadExpression(self, serial),
    serial,
  );
};

/**
 * @type {<S>(
 *   node: null | estree.MethodDefinition & { kind: "constructor" },
 *   context: import("../context.js").Context<S>,
 *   options: {
 *     hash: unbuild.Hash,
 *     name: import("../name.mjs").Name,
 *     serial: S,
 *   },
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
const unbuildConstructor = (node, context, { name, hash, serial }) =>
  node === null
    ? makeDefaultConstructor(context, { name, hash, serial })
    : unbuildFunction(node.value, context, {
        kind: "constructor",
        name,
      });

/**
 * @type {<S>(
 *   element1: Element<S>,
 *   element2: Element<S>,
 *  ) => Element<S>}
 */
const combineElement = (element1, element2) => ({
  head: [...element1.head, ...element2.head],
  body: [...element1.body, ...element2.body],
  post: [...element1.post, ...element2.post],
});

/**
 * @type {<S>(
 *   entry: [estree.PrivateKey, unbuild.Variable],
 *   serial: S,
 * ) => aran.Effect<unbuild.Atom<S>>}
 */
const makePrivateSetupEffect = ([key, variable], serial) =>
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
  );

/**
 * @type {<S>(
 *   node: estree.ClassBody,
 *   context: import("../context.js").Context<S>,
 *   options: {
 *     super: ".default" | unbuild.Variable,
 *     name: import("../name.mjs").Name,
 *   },
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const unbuildClassBody = (
  node,
  old_context,
  { name, super: super_ },
) => {
  const { serialize, digest } = old_context;
  const serial = serialize(node);
  const hash = digest(node);
  const split = extractConstructor(node);
  const self = mangleMetaVariable(hash, BASENAME, "self");
  const post = mangleMetaVariable(hash, BASENAME, "post");
  const prototype = mangleMetaVariable(hash, BASENAME, "prototype");
  /** @type {[estree.PrivateKey, unbuild.Variable][]} */
  const private_record_array = map(
    flatMap(node.body, unwrapPrivateKey),
    (key) => [key, mangleMetaVariable(hash, BASENAME, `private_${key}`)],
  );
  const main_context = {
    ...old_context,
    private: {
      ...old_context.private,
      ...reduceEntry(private_record_array),
    },
    record: {
      ...old_context.record,
      "this": self,
      "super.prototype": prototype,
      "super.constructor": /** @type {".illegal"} */ (".illegal"),
    },
  };
  const main = reduce(
    map(split.definitions, (child) =>
      unbuildClassElement(child, main_context, {
        constructor: self,
        prototype,
      }),
    ),
    combineElement,
    /** @type {Element<any>} */ ({
      head: [],
      body: [],
      post: [],
    }),
  );
  return makeLongSequenceExpression(
    [
      ...map(private_record_array, (entry) =>
        makePrivateSetupEffect(entry, serial),
      ),
      ...(main.post.length === 0
        ? []
        : [
            makeWriteEffect(
              post,
              makeInstanceFieldExpression(main.post, main_context, { serial }),
              serial,
              true,
            ),
          ]),
      makeWriteEffect(
        self,
        unbuildConstructor(
          split.constructor,
          {
            ...old_context,
            private: {
              ...old_context.private,
              ...reduceEntry(private_record_array),
            },
            record: {
              ...old_context.record,
              "super.prototype": prototype,
              "super.constructor": super_,
              "super.post": main.post.length === 0 ? ".none" : post,
            },
          },
          {
            hash,
            name,
            serial,
          },
        ),
        serial,
        true,
      ),
      ...listDeclarePrivateEffect(main_context, self, serial),
      makeWriteEffect(
        prototype,
        makeGetExpression(
          makeReadExpression(self, serial),
          makePrimitiveExpression("prototype", serial),
          serial,
        ),
        serial,
        true,
      ),
      makeExpressionEffect(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.setPrototypeOf", serial),
          makePrimitiveExpression({ undefined: null }, serial),
          [
            makeReadExpression(prototype, serial),
            super_ === ".default"
              ? makeIntrinsicExpression("Object.prototype", serial)
              : makeGetExpression(
                  makeReadExpression(super_, serial),
                  makePrimitiveExpression("prototype", serial),
                  serial,
                ),
          ],
          serial,
        ),
        serial,
      ),
      ...main.head,
      ...main.body,
    ],
    makeReadExpression(self, serial),
    serial,
  );
};

/**
 * @type {<S>(
 *   node: estree.ClassExpression | estree.ClassDeclaration,
 *   context: import("../context.js").Context<S>,
 *   options: {
 *     name: import("../name.mjs").Name,
 *   },
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const unbuildClass = (node, context, { name: parent_name }) => {
  const { serialize, digest } = context;
  const serial = serialize(node);
  const hash = digest(node);
  const super_ = mangleMetaVariable(hash, BASENAME, "super");
  /** @type {import("../name.mjs").Name} */
  const name =
    node.id == null
      ? parent_name
      : {
          type: "static",
          kind: "init",
          base: /** @type {estree.Variable} */ (node.id.name),
        };
  return node.superClass == null
    ? unbuildClassBody(node.body, context, { name, super: ".default" })
    : makeSequenceExpression(
        makeWriteEffect(
          super_,
          unbuildExpression(node.superClass, context, { name: ANONYMOUS }),
          serial,
          true,
        ),
        unbuildClassBody(node.body, context, {
          name,
          super: super_,
        }),
        serial,
      );
};
