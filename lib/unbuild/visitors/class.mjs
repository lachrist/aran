import {
  AranTypeError,
  filter,
  filterOut,
  flatMap,
  guard,
  map,
  reduce,
} from "../../util/index.mjs";
import {
  makeAccessorDescriptorExpression,
  makeDataDescriptorExpression,
  makeGetExpression,
  makeLongSequenceExpression,
  makeObjectExpression,
  makeThrowErrorExpression,
} from "../intrinsic.mjs";
import { mangleMetaVariable } from "../mangle.mjs";
import {
  makeApplyExpression,
  makeClosureBlock,
  makeConditionalExpression,
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
import {
  makeScopeClosureBlock,
  makeScopeParameterExpression,
} from "../scope/index.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildKeyExpression } from "./key.mjs";
import { listBodyStatement } from "./statement.mjs";
import { ANONYMOUS, makeNameExpression } from "../name.mjs";
import { drill, drillAll, drillArray } from "../../drill.mjs";
import { hasValue, hasSuperClass } from "../predicate.mjs";
import { DUMMY_KEY, makeSyntaxErrorExpression } from "../report.mjs";

const {
  String,
  Object: { fromEntries: reduceEntry },
} = globalThis;

const BASENAME = /** @type {__basename} */ ("class");

/**
 * @typedef {(
 *   context: import("../context.d.ts").Context,
 * ) => aran.Effect<unbuild.Atom>[]} Callback
 */

/**
 * @typedef {{
 *   head: aran.Effect<unbuild.Atom>[],
 *   body: aran.Effect<unbuild.Atom>[],
 *   static: Callback[],
 *   instance: Callback[],
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
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeMethodDescriptor = (kind, value, path) =>
  kind === "method"
    ? makeDataDescriptorExpression(
        {
          value,
          writable: true,
          enumerable: false,
          configurable: true,
        },
        path,
      )
    : makeAccessorDescriptorExpression(
        {
          get: kind === "get" ? value : null,
          set: kind === "set" ? value : null,
          enumerable: makePrimitiveExpression(false, path),
          configurable: makePrimitiveExpression(true, path),
        },
        path,
      );

/**
 * @type {(
 *   node: estree.PropertyDefinition & { computed: false },
 * ) => estree.Key}
 */
const getPropertyKey = (node) => {
  switch (node.key.type) {
    case "PrivateIdentifier": {
      return /** @type {estree.Key} */ (`#${node.key.name}`);
    }
    case "Identifier": {
      return /** @type {estree.Key} */ (node.key.name);
    }
    default: {
      return DUMMY_KEY;
    }
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
    case "PrivateIdentifier": {
      return /** @type {estree.Key} */ (`#${node.key.name}`);
    }
    case "Identifier": {
      return /** @type {estree.Key} */ (node.key.name);
    }
    case "Literal": {
      return /** @type {estree.Key} */ (String(node.key.value));
    }
    default: {
      return DUMMY_KEY;
    }
  }
};

/**
 * @type {(
 *   pair: {
 *     node: estree.PropertyDefinition & { computed: false },
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listNonComputedFieldEffect = ({ node, path }, context) => {
  const value = hasValue(node)
    ? unbuildExpression(drill({ node, path }, "value"), context, {
        name: {
          type: "static",
          kind: "field",
          base: getPropertyKey(node),
        },
      })
    : makePrimitiveExpression({ undefined: null }, path);
  const descriptor = makeDataDescriptorExpression(
    {
      value,
      writable: true,
      enumerable: true,
      configurable: true,
    },
    path,
  );
  return node.key.type === "PrivateIdentifier"
    ? listDefinePrivateEffect(
        context,
        ".this",
        /** @type {estree.PrivateKey} */ (node.key.name),
        descriptor,
        path,
      )
    : [
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.defineProperty", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeScopeParameterExpression(context, "this", path),
              unbuildKeyExpression(drill({ node, path }, "key"), context, node),
              descriptor,
            ],
            path,
          ),
          path,
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
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listFieldEffect = ({ node, path }, context, { key }) => [
  makeExpressionEffect(
    makeApplyExpression(
      makeIntrinsicExpression("Reflect.defineProperty", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeScopeParameterExpression(context, "this", path),
        makeReadExpression(key, path),
        makeDataDescriptorExpression(
          {
            value: hasValue(node)
              ? unbuildExpression(drill({ node, path }, "value"), context, {
                  name: {
                    type: "dynamic",
                    kind: "field",
                    base: key,
                  },
                })
              : makePrimitiveExpression({ undefined: null }, path),
            writable: true,
            enumerable: true,
            configurable: true,
          },
          path,
        ),
      ],
      path,
    ),
    path,
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
const unbuildClassElement = ({ node, path }, context, options) => {
  switch (node.type) {
    case "StaticBlock": {
      return {
        head: [],
        body: [],
        static: [
          /** @type {Callback} */
          (
            (context) => [
              makeExpressionEffect(
                makeApplyExpression(
                  makeFunctionExpression(
                    false,
                    false,
                    makeScopeClosureBlock(
                      context,
                      {
                        type: "closure",
                        kind: "method",
                        self: options.constructor,
                        super: null,
                        field: null,
                        kinds: {},
                      },
                      (context) =>
                        listBodyStatement(
                          drillAll(drillArray({ node, path }, "body")),
                          context,
                          {
                            parent: "closure",
                            labels: [],
                            completion: null,
                            loop: { break: null, continue: null },
                          },
                        ),
                      (_context) =>
                        makePrimitiveExpression({ undefined: null }, path),
                      path,
                    ),
                    path,
                  ),
                  makeReadExpression(options.constructor, path),
                  [],
                  path,
                ),
                path,
              ),
            ]
          ),
        ],
        instance: [],
      };
    }
    case "PropertyDefinition": {
      if (isPropertyDefinitionNotComputed(node)) {
        return {
          head: [],
          body: [],
          static: node.static
            ? [(context) => listNonComputedFieldEffect({ node, path }, context)]
            : [],
          instance: node.static
            ? []
            : [
                (context) =>
                  listNonComputedFieldEffect({ node, path }, context),
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
              unbuildKeyExpression(drill({ node, path }, "key"), context, node),
              true,
              path,
            ),
          ],
          body: [],
          static: node.static
            ? [
                (context) =>
                  listFieldEffect({ node, path }, context, {
                    key: variable,
                  }),
              ]
            : [],
          instance: node.static
            ? []
            : [
                (context) =>
                  listFieldEffect({ node, path }, context, {
                    key: variable,
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
            type: "method",
            name: {
              type: "static",
              kind: node.kind,
              base: getMethodKey(node),
            },
            self: options.prototype,
          }),
          path,
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
                  path,
                )
              : [
                  makeExpressionEffect(
                    makeApplyExpression(
                      makeIntrinsicExpression("Reflect.defineProperty", path),
                      makePrimitiveExpression({ undefined: null }, path),
                      [
                        makeReadExpression(
                          node.static ? options.constructor : options.prototype,
                          path,
                        ),
                        unbuildKeyExpression(
                          drill({ node, path }, "key"),
                          context,
                          node,
                        ),
                        descriptor,
                      ],
                      path,
                    ),
                    path,
                  ),
                ],
          static: [],
          instance: [],
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
              unbuildKeyExpression(drill({ node, path }, "key"), context, node),
              true,
              path,
            ),
          ],
          body: [
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.defineProperty", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeReadExpression(
                    node.static ? options.constructor : options.prototype,
                    path,
                  ),
                  makeReadExpression(variable, path),
                  makeMethodDescriptor(
                    node.kind,
                    unbuildFunction(drill({ node, path }, "value"), context, {
                      type: "method",
                      name: {
                        type: "dynamic",
                        kind: node.kind,
                        base: variable,
                      },
                      self: options.prototype,
                    }),
                    path,
                  ),
                ],
                path,
              ),
              path,
            ),
          ],
          static: [],
          instance: [],
        };
      }
    }
    default: {
      throw new AranTypeError("invalid class element node", node);
    }
  }
};

/**
 * @type {(
 *   callbacks: Callback[],
 *   context: import("../context.js").Context,
 *   options: {
 *     self: unbuild.Variable,
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeFieldExpression = (callbacks, context, { self, path }) =>
  makeFunctionExpression(
    false,
    false,
    makeScopeClosureBlock(
      context,
      {
        type: "closure",
        kind: "method",
        self,
        field: null,
        super: null,
        kinds: {},
      },
      (context) =>
        map(
          [
            ...listDeclarePrivateEffect(context, ".this", path),
            ...flatMap(callbacks, (callback) => callback(context)),
          ],
          (effect) => makeEffectStatement(effect, path),
        ),
      (context) => makeScopeParameterExpression(context, "this", path),
      path,
    ),
    path,
  );

/**
 * @type {(
 *   options: {
 *     self: unbuild.Variable,
 *     super: unbuild.Variable | null,
 *     field: unbuild.Variable | null,
 *     name: import("../name.mjs").Name,
 *     path: unbuild.Path,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listDefaultConstructorEffect = ({ path, ...options }) => [
  // This bypass a lot of abstractions :(
  // Current abstraction generates a needleesly complicated result.
  makeWriteEffect(
    options.self,
    makeFunctionExpression(
      false,
      false,
      makeClosureBlock(
        [],
        [],
        makeConditionalExpression(
          makeReadExpression("new.target", path),
          guard(
            options.field !== null,
            (node) =>
              makeApplyExpression(
                makeReadExpression(
                  /** @type {unbuild.Variable} */ (options.field),
                  path,
                ),
                node,
                [],
                path,
              ),
            options.super === null
              ? makeObjectExpression(
                  makeGetExpression(
                    makeReadExpression("new.target", path),
                    makePrimitiveExpression("prototype", path),
                    path,
                  ),
                  [],
                  path,
                )
              : makeApplyExpression(
                  makeIntrinsicExpression("Reflect.construct", path),
                  makePrimitiveExpression({ undefined: null }, path),
                  [
                    makeReadExpression(options.super, path),
                    makeReadExpression("function.arguments", path),
                    makeReadExpression("new.target", path),
                  ],
                  path,
                ),
          ),
          makeThrowErrorExpression(
            "TypeError",
            "Constructor cannot be applied",
            path,
          ),
          path,
        ),
        path,
      ),
      path,
    ),
    true,
    path,
  ),
  makeExpressionEffect(
    makeApplyExpression(
      makeIntrinsicExpression("Reflect.defineProperty", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeReadExpression(options.self, path),
        makePrimitiveExpression("length", path),
        makeDataDescriptorExpression(
          {
            value: makePrimitiveExpression(0, path),
            writable: false,
            enumerable: false,
            configurable: true,
          },
          path,
        ),
      ],
      path,
    ),
    path,
  ),
  makeExpressionEffect(
    makeApplyExpression(
      makeIntrinsicExpression("Reflect.defineProperty", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeReadExpression(options.self, path),
        makePrimitiveExpression("name", path),
        makeDataDescriptorExpression(
          {
            value: makeNameExpression(options.name, path),
            writable: false,
            enumerable: false,
            configurable: true,
          },
          path,
        ),
      ],
      path,
    ),
    path,
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
 *     name: import("../name.mjs").Name,
 *     self: unbuild.Variable,
 *     super: unbuild.Variable | null,
 *     field: unbuild.Variable | null,
 *     path: unbuild.Path,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listConstructorEffect = (pairs, context, { path, ...options }) => {
  switch (pairs.length) {
    case 0: {
      return listDefaultConstructorEffect({ path, ...options });
    }
    case 1: {
      return [
        makeWriteEffect(
          options.self,
          unbuildFunction(drill(pairs[0], "value"), context, {
            type: "constructor",
            ...options,
          }),
          true,
          path,
        ),
      ];
    }
    default: {
      const { path } = pairs[0];
      return [
        makeExpressionEffect(
          makeSyntaxErrorExpression("multiple constructor definitions", path),
          path,
        ),
      ];
    }
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
  static: [...element1.static, ...element2.static],
  instance: [...element1.instance, ...element2.instance],
});

/**
 * @type {(
 *   key: estree.PrivateKey,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makePrivateExpression = (key, path) =>
  makeApplyExpression(
    makeIntrinsicExpression("Symbol", path),
    makePrimitiveExpression({ undefined: null }, path),
    [makePrimitiveExpression(`#${key}`, path)],
    path,
  );

/**
 * @type {(
 *   pair: {
 *     node: estree.ClassBody,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     super: null | unbuild.Variable,
 *     name: import("../name.mjs").Name,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildClassBody = (
  { node, path },
  parent_context,
  { name, super: super_ },
) => {
  const split = extractConstructor(
    drillAll(drillArray({ node, path }, "body")),
  );
  const self = mangleMetaVariable(
    BASENAME,
    /** @type {__unique} */ ("self"),
    path,
  );
  const field = mangleMetaVariable(
    BASENAME,
    /** @type {__unique} */ ("field"),
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
  const main = reduce(
    map(split.definitions, (child) =>
      unbuildClassElement(child, context, {
        constructor: self,
        prototype,
      }),
    ),
    combineElement,
    {
      head: [],
      body: [],
      static: [],
      instance: [],
    },
  );
  return makeLongSequenceExpression(
    [
      ...map(privates, ([key, variable]) =>
        makeWriteEffect(variable, makePrivateExpression(key, path), true, path),
      ),
      ...main.head,
      ...listConstructorEffect(split.constructors, context, {
        self,
        name,
        path,
        super: super_,
        field: main.instance.length === 0 ? null : field,
      }),
      ...(super_ === null
        ? []
        : [
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.setPrototypeOf", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeReadExpression(self, path),
                  makeReadExpression(super_, path),
                ],
                path,
              ),
              path,
            ),
          ]),
      ...listDeclarePrivateEffect(context, self, path),
      makeWriteEffect(
        prototype,
        makeGetExpression(
          makeReadExpression(self, path),
          makePrimitiveExpression("prototype", path),
          path,
        ),
        true,
        path,
      ),
      makeExpressionEffect(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.setPrototypeOf", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeReadExpression(prototype, path),
            super_ === null
              ? makeIntrinsicExpression("Object.prototype", path)
              : makeGetExpression(
                  makeReadExpression(super_, path),
                  makePrimitiveExpression("prototype", path),
                  path,
                ),
          ],
          path,
        ),
        path,
      ),
      ...main.head,
      ...main.body,
      ...(main.static.length === 0
        ? []
        : [
            makeExpressionEffect(
              makeApplyExpression(
                makeFieldExpression(main.static, context, {
                  self,
                  path,
                }),
                makeReadExpression(self, path),
                [],
                path,
              ),
              path,
            ),
          ]),
      ...(main.instance.length === 0
        ? []
        : [
            makeWriteEffect(
              field,
              makeFieldExpression(main.instance, context, {
                self,
                path,
              }),
              true,
              path,
            ),
          ]),
    ],
    makeReadExpression(self, path),
    path,
  );
};

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
export const unbuildClass = (
  { node, path },
  context,
  { name: parent_name },
) => {
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
          path,
        ),
        unbuildClassBody(drill({ node, path }, "body"), context, {
          name,
          super: super_,
        }),
        path,
      )
    : unbuildClassBody(drill({ node, path }, "body"), context, {
        name,
        super: null,
      });
};
