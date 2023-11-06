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
import { mangleMetaVariable, splitMeta, zipMeta } from "../mangle.mjs";
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
import { ANONYMOUS } from "../name.mjs";
import { drill, drillAll, drillArray } from "../../drill.mjs";
import { hasValue, hasSuperClass } from "../predicate.mjs";
import { DUMMY_KEY, makeSyntaxErrorExpression } from "../report.mjs";

const {
  String,
  Object: { fromEntries: reduceEntry },
} = globalThis;

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
 *   options: {
 *     meta: unbuild.Meta
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listNonComputedFieldEffect = ({ node, path }, context, { meta }) => {
  const metas = splitMeta(meta, ["key", "value"]);
  const value = hasValue(node)
    ? unbuildExpression(drill({ node, path }, "value"), context, {
        meta: metas.value,
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
        makeScopeParameterExpression(context, "this", path),
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
              unbuildKeyExpression(drill({ node, path }, "key"), context, {
                meta: metas.key,
                computed: node.computed,
              }),
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
 *     meta: unbuild.Meta,
 *     key: unbuild.Variable,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listFieldEffect = ({ node, path }, context, { meta, key }) => [
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
                  meta,
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
 *   pair: {
 *     node:
 *       | estree.StaticBlock
 *       | estree.PropertyDefinition
 *       | estree.MethodDefinition & { kind: "method" | "get" | "set" },
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *     constructor: unbuild.Variable,
 *     prototype: unbuild.Variable,
 *   },
 * ) => Element}
 */
const unbuildClassElement = (
  { node, path },
  context,
  { meta, constructor: constructor_, prototype },
) => {
  switch (node.type) {
    case "StaticBlock": {
      return {
        head: [],
        body: [],
        static: [
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
                      self: constructor_,
                      super: null,
                      field: null,
                      kinds: {},
                    },
                    (context) =>
                      listBodyStatement(
                        drillAll(drillArray({ node, path }, "body")),
                        context,
                        {
                          meta,
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
                makeReadExpression(constructor_, path),
                [],
                path,
              ),
              path,
            ),
          ],
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
            ? [
                (context) =>
                  listNonComputedFieldEffect({ node, path }, context, { meta }),
              ]
            : [],
          instance: node.static
            ? []
            : [
                (context) =>
                  listNonComputedFieldEffect({ node, path }, context, { meta }),
              ],
        };
      } else {
        const metas = splitMeta(meta, ["key_cache", "key", "value"]);
        const key = mangleMetaVariable(metas.key_cache);
        return {
          head: [
            makeWriteEffect(
              key,
              unbuildKeyExpression(drill({ node, path }, "key"), context, {
                meta: metas.key,
                computed: node.computed,
              }),
              true,
              path,
            ),
          ],
          body: [],
          static: node.static
            ? [
                (context) =>
                  listFieldEffect({ node, path }, context, {
                    meta: metas.value,
                    key,
                  }),
              ]
            : [],
          instance: node.static
            ? []
            : [
                (context) =>
                  listFieldEffect({ node, path }, context, {
                    meta: metas.value,
                    key,
                  }),
              ],
        };
      }
    }
    case "MethodDefinition": {
      if (isMethodDefinitionNotComputed(node)) {
        const metas = splitMeta(meta, ["value", "key"]);
        const descriptor = makeMethodDescriptor(
          node.kind,
          unbuildFunction(drill({ node, path }, "value"), context, {
            type: "method",
            meta: metas.value,
            name: makePrimitiveExpression(getMethodKey(node), path),
            self: prototype,
          }),
          path,
        );
        return {
          head: [],
          body:
            node.key.type === "PrivateIdentifier"
              ? listDefinePrivateEffect(
                  context,
                  makeReadExpression(
                    node.static ? constructor_ : prototype,
                    path,
                  ),
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
                          node.static ? constructor_ : prototype,
                          path,
                        ),
                        unbuildKeyExpression(
                          drill({ node, path }, "key"),
                          context,
                          {
                            meta: metas.key,
                            computed: node.computed,
                          },
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
        const metas = splitMeta(meta, ["value", "key", "key_cache"]);
        const key = mangleMetaVariable(metas.key_cache);
        return {
          head: [
            makeWriteEffect(
              key,
              unbuildKeyExpression(drill({ node, path }, "key"), context, {
                meta: metas.key,
                computed: node.computed,
              }),
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
                    node.static ? constructor_ : prototype,
                    path,
                  ),
                  makeReadExpression(key, path),
                  makeMethodDescriptor(
                    node.kind,
                    unbuildFunction(drill({ node, path }, "value"), context, {
                      type: "method",
                      meta: metas.value,
                      name: makeReadExpression(key, path),
                      self: prototype,
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
            ...listDeclarePrivateEffect(
              context,
              makeScopeParameterExpression(context, "this", path),
              path,
            ),
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
 *     name: aran.Expression<unbuild.Atom>,
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
            value: options.name,
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
 *     meta: unbuild.Meta,
 *     name: aran.Expression<unbuild.Atom>,
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
 *     node: estree.Node,
 *   },
 * ) => estree.PrivateKey[]}
 */
const extractPrivate = ({ node }) =>
  (node.type === "PropertyDefinition" || node.type === "MethodDefinition") &&
  !node.computed &&
  node.key.type === "PrivateIdentifier"
    ? [/** @type {estree.PrivateKey} */ (node.key.name)]
    : [];

/**
 * @type {(
 *   pair: {
 *     node: estree.ClassBody,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *     super: aran.Expression<unbuild.Atom> | null,
 *     name: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildClassBody = (
  { node, path },
  parent_context,
  { meta, name, super: super_ },
) => {
  const metas = splitMeta(meta, [
    "self_cache",
    "super_cache",
    "field_cache",
    "prototype_cache",
    "constructor",
    "definitions",
    "privates",
    "body",
  ]);
  const split = extractConstructor(
    drillAll(drillArray({ node, path }, "body")),
  );
  const self = mangleMetaVariable(metas.self_cache);
  const super_variable = mangleMetaVariable(metas.super_cache);
  const field = mangleMetaVariable(metas.field_cache);
  const prototype = mangleMetaVariable(metas.prototype_cache);
  const privates = map(
    zipMeta(metas.privates, flatMap(split.definitions, extractPrivate)),
    ([meta, key]) =>
      /** @type [estree.PrivateKey, unbuild.Variable] */ ([
        key,
        mangleMetaVariable(meta),
      ]),
  );
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
        meta: metas.definitions,
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
      ...(super_ === null
        ? []
        : [makeWriteEffect(super_variable, super_, true, path)]),
      ...map(privates, ([key, variable]) =>
        makeWriteEffect(variable, makePrivateExpression(key, path), true, path),
      ),
      ...main.head,
      ...listConstructorEffect(split.constructors, context, {
        meta: metas.constructor,
        self,
        name,
        path,
        super: super_ === null ? null : super_variable,
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
                  makeReadExpression(super_variable, path),
                ],
                path,
              ),
              path,
            ),
          ]),
      ...listDeclarePrivateEffect(
        context,
        makeReadExpression(self, path),
        path,
      ),
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
                  makeReadExpression(super_variable, path),
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
 *     meta: unbuild.Meta,
 *     name: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildClass = ({ node, path }, context, { meta, name }) => {
  const metas = splitMeta(meta, ["super", "body"]);
  return unbuildClassBody(drill({ node, path }, "body"), context, {
    meta: metas.body,
    name,
    super: hasSuperClass(node)
      ? unbuildExpression(drill({ node, path }, "superClass"), context, {
          meta: metas.super,
          name: ANONYMOUS,
        })
      : null,
  });
};
