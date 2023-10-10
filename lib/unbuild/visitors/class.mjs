import { SyntaxAranError } from "../../error.mjs";
import { filter, filterOut, flatMap, map, reduce } from "../../util/index.mjs";
import {
  makeAccessorDescriptorExpression,
  makeDataDescriptorExpression,
  makeGetExpression,
  makeLongSequenceExpression,
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
  setOrigin,
} from "../node.mjs";
import {
  listDeclarePrivateEffect,
  listDefinePrivateEffect,
} from "../private.mjs";
import { makeScopeClosureBlock } from "../scope/block.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildKeyExpression } from "./key.mjs";
import { listBodyStatement } from "./statement.mjs";
import { ANONYMOUS, makeNameExpression } from "../name.mjs";
import { makeCallSuperExpression } from "../record.mjs";
import { drill, drillAll, drillArray } from "../../drill.mjs";
import { hasValue, hasSuperClass } from "../predicate.mjs";
import { wrapOrigin } from "../origin.mjs";

const {
  String,
  Object: { fromEntries: reduceEntry },
} = globalThis;

const BASENAME = /** @type {__basename} */ ("class");

/**
 * @typedef {{
 *   head: aran.Effect<unbuild.Atom>[],
 *   body: aran.Effect<unbuild.Atom>[],
 *   post: ((
 *     context: import("../context.js").Context,
 *     target: aran.Parameter | unbuild.Variable,
 *   ) => aran.Effect<unbuild.Atom>[])[],
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
 * @type {(
 *   kind: "method" | "get" | "set",
 *   value: aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeMethodDescriptor = (kind, value) =>
  kind === "method"
    ? makeDataDescriptorExpression(
        makePrimitiveExpression(true),
        makePrimitiveExpression(false),
        makePrimitiveExpression(true),
        value,
      )
    : makeAccessorDescriptorExpression(
        kind === "get" ? value : null,
        kind === "set" ? value : null,
        makePrimitiveExpression(false),
        makePrimitiveExpression(true),
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

/** @type {(pair: {node: estree.Node}) => boolean} */
const isConstructorPair = ({ node }) =>
  node.type === "MethodDefinition" && node.kind === "constructor";

/**
 * @type {(
 *   pairs: {
 *     node:
 *       | estree.MethodDefinition
 *       | estree.PropertyDefinition
 *       | estree.StaticBlock,
 *     path: unbuild.Path,
 *   }[],
 * ) => {
 *   constructors: {
 *     node: estree.MethodDefinition & { kind: "constructor" },
 *     path: unbuild.Path,
 *   }[],
 *   definitions: ({
 *     node:
 *       | estree.MethodDefinition & { kind: "method" | "get" | "set" }
 *       | estree.PropertyDefinition
 *       | estree.StaticBlock,
 *     path: unbuild.Path,
 *   })[],
 * }}
 */
const extractConstructor = (pairs) => ({
  constructors: /** @type {any[]} */ (filter(pairs, isConstructorPair)),
  definitions: /** @type {any[]} */ (filterOut(pairs, isConstructorPair)),
});

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
 * @type {(
 *   pair: {
 *     node: estree.PropertyDefinition & { computed: false },
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     target: aran.Parameter | unbuild.Variable,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listNonComputedFieldEffect = ({ node, path }, context, { target }) => {
  const value = hasValue(node)
    ? unbuildExpression(drill({ node, path }, "value"), context, {
        name: {
          type: "static",
          kind: "field",
          base: getPropertyKey(node),
        },
      })
    : makePrimitiveExpression({ undefined: null });
  const descriptor = makeDataDescriptorExpression(
    makePrimitiveExpression(true),
    makePrimitiveExpression(true),
    makePrimitiveExpression(true),
    value,
  );
  return node.key.type === "PrivateIdentifier"
    ? listDefinePrivateEffect(
        context,
        target,
        /** @type {estree.PrivateKey} */ (node.key.name),
        descriptor,
        node,
      )
    : [
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.defineProperty"),
            makePrimitiveExpression({ undefined: null }),
            [
              makeReadExpression(target),
              makePrimitiveExpression(getPropertyKey(node)),
              descriptor,
            ],
          ),
        ),
      ];
};

/**
 * @type {(
 *   pair: {
 *     node: estree.PropertyDefinition,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     key: unbuild.Variable,
 *     target: aran.Parameter | unbuild.Variable,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listFieldEffect = ({ node, path }, context, { key, target }) => [
  makeExpressionEffect(
    makeApplyExpression(
      makeIntrinsicExpression("Reflect.defineProperty"),
      makePrimitiveExpression({ undefined: null }),
      [
        makeReadExpression(target),
        makeReadExpression(key),
        makeDataDescriptorExpression(
          makePrimitiveExpression(true),
          makePrimitiveExpression(true),
          makePrimitiveExpression(true),
          hasValue(node)
            ? unbuildExpression(drill({ node, path }, "value"), context, {
                name: {
                  type: "dynamic",
                  kind: "field",
                  base: key,
                },
              })
            : makePrimitiveExpression({ undefined: null }),
        ),
      ],
    ),
  ),
];

/**
 * @type {(
 *   pair: { node: estree.Node, path: unbuild.Path },
 * ) => [estree.PrivateKey, unbuild.Variable][]}
 */
const unbuildPrivate = ({ node, path }) =>
  (node.type === "PropertyDefinition" || node.type === "MethodDefinition") &&
  !node.computed &&
  node.key.type === "PrivateIdentifier"
    ? [
        [
          /** @type {estree.PrivateKey} */ (node.key.name),
          mangleMetaVariable(
            BASENAME,
            /** @type {__unique} */ ("private"),
            path,
          ),
        ],
      ]
    : [];

/**
 * @type {<N extends estree.Node, O extends object>(
 *   unbuildNode: (
 *     pair: { node: N, path: unbuild.Path },
 *     context: import("../context.d.ts").Context,
 *     options: O,
 *   ) => Element,
 * ) => (
 *   pair: { node: N, path: unbuild.Path },
 *   context: import("../context.d.ts").Context,
 *   options: O,
 * ) => Element}
 */
const wrapOriginClassElement =
  (unbuildClassElement) =>
  ({ node, path }, context, options) => {
    const { head, body, post } = unbuildClassElement(
      { node, path },
      context,
      options,
    );
    return /** @type {Element} */ ({
      head: map(head, (node) => setOrigin(node, path)),
      body: map(body, (node) => setOrigin(node, path)),
      post: map(
        post,
        (callback) => (context, parameter) =>
          map(callback(context, parameter), (node) => setOrigin(node, path)),
      ),
    });
  };

/**
 * @type {(
 *   pair: {
 *     node:
 *       | estree.StaticBlock
 *       | estree.PropertyDefinition
 *       | estree.MethodDefinition & { kind: "method" | "get" | "set" },
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     constructor: unbuild.Variable,
 *     prototype: unbuild.Variable,
 *   },
 * ) => Element}
 */
const unbuildClassElement = wrapOriginClassElement(
  ({ node, path }, context, options) => {
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
                    { type: "block", kinds: {} },
                    (context) =>
                      listBodyStatement(
                        drillAll(drillArray({ node, path }, "body")),
                        context,
                        {
                          labels: [],
                          completion: null,
                          loop: { break: null, continue: null },
                        },
                      ),
                    (_context) => makePrimitiveExpression({ undefined: null }),
                  ),
                ),
                makeReadExpression(options.constructor),
                [],
              ),
            ),
          ],
          post: [],
        };
      case "PropertyDefinition": {
        if (isPropertyDefinitionNotComputed(node)) {
          return {
            head: [],
            body: node.static
              ? listNonComputedFieldEffect({ node, path }, context, {
                  target: options.prototype,
                })
              : [],
            post: node.static
              ? []
              : [
                  (context, target) =>
                    listNonComputedFieldEffect({ node, path }, context, {
                      target,
                    }),
                ],
          };
        } else {
          const variable = mangleMetaVariable(
            BASENAME,
            /** @type {__unique} */ ("property_key"),
            path,
          );
          return {
            head: [
              makeWriteEffect(
                variable,
                unbuildKeyExpression(
                  drill({ node, path }, "key"),
                  context,
                  node,
                ),
                true,
              ),
            ],
            body: node.static
              ? listFieldEffect({ node, path }, context, {
                  key: variable,
                  target: options.constructor,
                })
              : [],
            post: node.static
              ? []
              : [
                  (context, target) =>
                    listFieldEffect({ node, path }, context, {
                      key: variable,
                      target,
                    }),
                ],
          };
        }
      }
      case "MethodDefinition": {
        if (isMethodDefinitionNotComputed(node)) {
          const descriptor = makeMethodDescriptor(
            node.kind,
            unbuildFunction(drill({ node, path }, "value"), context, {
              kind: "method",
              name: {
                type: "static",
                kind: node.kind,
                base: getMethodKey(node),
              },
            }),
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
                    node,
                  )
                : [
                    makeExpressionEffect(
                      makeApplyExpression(
                        makeIntrinsicExpression("Reflect.defineProperty"),
                        makePrimitiveExpression({ undefined: null }),
                        [
                          makeReadExpression(
                            node.static
                              ? options.constructor
                              : options.prototype,
                          ),
                          makePrimitiveExpression(getMethodKey(node)),
                          descriptor,
                        ],
                      ),
                    ),
                  ],
            post: [],
          };
        } else {
          const variable = mangleMetaVariable(
            BASENAME,
            /** @type {__unique} */ ("method_key"),
            path,
          );
          return {
            head: [
              makeWriteEffect(
                variable,
                unbuildKeyExpression(
                  drill({ node, path }, "key"),
                  context,
                  node,
                ),
                true,
              ),
            ],
            body: [
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.defineProperty"),
                  makePrimitiveExpression({ undefined: null }),
                  [
                    makeReadExpression(
                      node.static ? options.constructor : options.prototype,
                    ),
                    makeReadExpression(variable),
                    makeMethodDescriptor(
                      node.kind,
                      unbuildFunction(drill({ node, path }, "value"), context, {
                        kind: "method",
                        name: {
                          type: "dynamic",
                          kind: node.kind,
                          base: variable,
                        },
                      }),
                    ),
                  ],
                ),
              ),
            ],
            post: [],
          };
        }
      }
      default:
        throw new SyntaxAranError("invalid class element node", node);
    }
  },
);

/**
 * @type {(
 *   callbacks: ((
 *     context: import("../context.js").Context,
 *     target: aran.Parameter | unbuild.Variable,
 *   ) => aran.Effect<unbuild.Atom>[]) [],
 *   context: import("../context.js").Context,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeInstanceFieldExpression = (callbacks, context) =>
  makeFunctionExpression(
    "arrow",
    false,
    false,
    makeScopeClosureBlock(
      context,
      { type: "block", kinds: {} },
      (context) =>
        map(
          [
            ...listDeclarePrivateEffect(context, "this"),
            ...flatMap(callbacks, (callback) => callback(context, "this")),
          ],
          (effect) => makeEffectStatement(effect),
        ),
      (_context) => makeReadExpression("this"),
    ),
  );

/**
 * @type {(
 *   context: import("../context.js").Context,
 *   options: {
 *     name: import("../name.mjs").Name,
 *     self: unbuild.Variable,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listDefaultConstructorEffect = (context, { self, name }) => [
  makeWriteEffect(
    self,
    makeFunctionExpression(
      "constructor",
      false,
      false,
      makeScopeClosureBlock(
        context,
        { type: "block", kinds: {} },
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
            makeReadExpression("function.arguments"),
            { type: "Literal", value: "dummy" },
          ),
      ),
    ),
    true,
  ),
  makeExpressionEffect(
    makeApplyExpression(
      makeIntrinsicExpression("Reflect.defineProperty"),
      makePrimitiveExpression({ undefined: null }),
      [
        makeReadExpression(self),
        makePrimitiveExpression("length"),
        makeDataDescriptorExpression(
          makePrimitiveExpression(false),
          makePrimitiveExpression(false),
          makePrimitiveExpression(true),
          makePrimitiveExpression(0),
        ),
      ],
    ),
  ),
  makeExpressionEffect(
    makeApplyExpression(
      makeIntrinsicExpression("Reflect.defineProperty"),
      makePrimitiveExpression({ undefined: null }),
      [
        makeReadExpression(self),
        makePrimitiveExpression("name"),
        makeDataDescriptorExpression(
          makePrimitiveExpression(false),
          makePrimitiveExpression(false),
          makePrimitiveExpression(true),
          makeNameExpression(name),
        ),
      ],
    ),
  ),
];

/**
 * @type {(
 *   pairs: {
 *     node: (estree.MethodDefinition & { kind: "constructor" }),
 *     path: unbuild.Path,
 *   }[],
 *   context: import("../context.js").Context,
 *   options: {
 *     self: unbuild.Variable,
 *     name: import("../name.mjs").Name,
 *     origin: estree.Node,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listConstructorEffect = (pairs, context, { self, name, origin }) => {
  switch (pairs.length) {
    case 0:
      return listDefaultConstructorEffect(context, { self, name });
    case 1:
      return [
        makeWriteEffect(
          self,
          unbuildFunction(drill(pairs[0], "value"), context, {
            kind: "constructor",
            name,
          }),
          true,
        ),
      ];
    default:
      throw new SyntaxAranError("multiple constructor", origin);
  }
};

/**
 * @type {(
 *   element1: Element,
 *   element2: Element,
 *  ) => Element}
 */
const combineElement = (element1, element2) => ({
  head: [...element1.head, ...element2.head],
  body: [...element1.body, ...element2.body],
  post: [...element1.post, ...element2.post],
});

/**
 * @type {(
 *   key: estree.PrivateKey,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makePrivateExpression = (key) =>
  makeApplyExpression(
    makeIntrinsicExpression("Symbol"),
    makePrimitiveExpression({ undefined: null }),
    [makePrimitiveExpression(`#${key}`)],
  );

/**
 * @type {(
 *   pair: {
 *     node: estree.ClassBody,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     super: ".default" | unbuild.Variable,
 *     name: import("../name.mjs").Name,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildClassBody = wrapOrigin(
  ({ node, path }, parent_context, { name, super: super_ }) => {
    const split = extractConstructor(
      drillAll(drillArray({ node, path }, "body")),
    );
    const self = mangleMetaVariable(
      BASENAME,
      /** @type {__unique} */ ("self"),
      path,
    );
    const post = mangleMetaVariable(
      BASENAME,
      /** @type {__unique} */ ("post"),
      path,
    );
    const prototype = mangleMetaVariable(
      BASENAME,
      /** @type {__unique} */ ("prototype"),
      path,
    );
    const privates = flatMap(split.definitions, unbuildPrivate);
    const context = {
      ...parent_context,
      private: {
        ...parent_context.private,
        ...reduceEntry(privates),
      },
    };
    const main_context = {
      ...context,
      record: {
        ...context.record,
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
      /** @type {Element} */ ({
        head: [],
        body: [],
        post: [],
      }),
    );
    return makeLongSequenceExpression(
      [
        ...map(privates, ([key, variable]) =>
          makeWriteEffect(variable, makePrivateExpression(key), true),
        ),
        ...(main.post.length === 0
          ? []
          : [
              makeWriteEffect(
                post,
                makeInstanceFieldExpression(main.post, main_context),
                true,
              ),
            ]),
        ...listConstructorEffect(
          split.constructors,
          {
            ...context,
            record: {
              ...context.record,
              "super.prototype": prototype,
              "super.constructor": super_,
              "super.field": main.post.length === 0 ? ".none" : post,
            },
          },
          { self, name, origin: node },
        ),
        ...listDeclarePrivateEffect(main_context, self),
        makeWriteEffect(
          prototype,
          makeGetExpression(
            makeReadExpression(self),
            makePrimitiveExpression("prototype"),
          ),
          true,
        ),
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.setPrototypeOf"),
            makePrimitiveExpression({ undefined: null }),
            [
              makeReadExpression(prototype),
              super_ === ".default"
                ? makeIntrinsicExpression("Object.prototype")
                : makeGetExpression(
                    makeReadExpression(super_),
                    makePrimitiveExpression("prototype"),
                  ),
            ],
          ),
        ),
        ...main.head,
        ...main.body,
      ],
      makeReadExpression(self),
    );
  },
);

/**
 * @type {(
 *   pair: {
 *     node: estree.ClassExpression | estree.ClassDeclaration,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     name: import("../name.mjs").Name,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildClass = wrapOrigin(
  ({ node, path }, context, { name: parent_name }) => {
    const super_ = mangleMetaVariable(
      BASENAME,
      /** @type {__unique} */ ("super"),
      path,
    );
    /** @type {import("../name.mjs").Name} */
    const name =
      node.id == null
        ? parent_name
        : {
            type: "static",
            kind: "init",
            base: /** @type {estree.Variable} */ (node.id.name),
          };
    return hasSuperClass(node)
      ? makeSequenceExpression(
          makeWriteEffect(
            super_,
            unbuildExpression(drill({ node, path }, "superClass"), context, {
              name: ANONYMOUS,
            }),
            true,
          ),
          unbuildClassBody(drill({ node, path }, "body"), context, {
            name,
            super: super_,
          }),
        )
      : unbuildClassBody(drill({ node, path }, "body"), context, {
          name,
          super: ".default",
        });
  },
);
