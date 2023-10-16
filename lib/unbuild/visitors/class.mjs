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
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeMethodDescriptor = (kind, value, path) =>
  kind === "method"
    ? makeDataDescriptorExpression(
        makePrimitiveExpression(true, path),
        makePrimitiveExpression(false, path),
        makePrimitiveExpression(true, path),
        value,
        path,
      )
    : makeAccessorDescriptorExpression(
        kind === "get" ? value : null,
        kind === "set" ? value : null,
        makePrimitiveExpression(false, path),
        makePrimitiveExpression(true, path),
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
      throw new SyntaxAranError("invalid non-computed property key", node);
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
      return /**@type {estree.Key} */ (String(node.key.value));
    }
    default: {
      throw new SyntaxAranError("invalid non-computed method key", node);
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
    : makePrimitiveExpression({ undefined: null }, path);
  const descriptor = makeDataDescriptorExpression(
    makePrimitiveExpression(true, path),
    makePrimitiveExpression(true, path),
    makePrimitiveExpression(true, path),
    value,
    path,
  );
  return node.key.type === "PrivateIdentifier"
    ? listDefinePrivateEffect(
        context,
        target,
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
              makeReadExpression(target, path),
              makePrimitiveExpression(getPropertyKey(node), path),
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
 *     target: aran.Parameter | unbuild.Variable,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listFieldEffect = ({ node, path }, context, { key, target }) => [
  makeExpressionEffect(
    makeApplyExpression(
      makeIntrinsicExpression("Reflect.defineProperty", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeReadExpression(target, path),
        makeReadExpression(key, path),
        makeDataDescriptorExpression(
          makePrimitiveExpression(true, path),
          makePrimitiveExpression(true, path),
          makePrimitiveExpression(true, path),
          hasValue(node)
            ? unbuildExpression(drill({ node, path }, "value"), context, {
                name: {
                  type: "dynamic",
                  kind: "field",
                  base: key,
                },
              })
            : makePrimitiveExpression({ undefined: null }, path),
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
        ],
        post: [],
      };
    }
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
              unbuildKeyExpression(drill({ node, path }, "key"), context, node),
              true,
              path,
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
                        makePrimitiveExpression(getMethodKey(node), path),
                        descriptor,
                      ],
                      path,
                    ),
                    path,
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
                      kind: "method",
                      name: {
                        type: "dynamic",
                        kind: node.kind,
                        base: variable,
                      },
                    }),
                    path,
                  ),
                ],
                path,
              ),
              path,
            ),
          ],
          post: [],
        };
      }
    }
    default: {
      throw new SyntaxAranError("invalid class element node", node);
    }
  }
};

/**
 * @type {(
 *   callbacks: ((
 *     context: import("../context.js").Context,
 *     target: aran.Parameter | unbuild.Variable,
 *   ) => aran.Effect<unbuild.Atom>[]) [],
 *   context: import("../context.js").Context,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeInstanceFieldExpression = (callbacks, context, path) =>
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
            ...listDeclarePrivateEffect(context, "this", path),
            ...flatMap(callbacks, (callback) => callback(context, "this")),
          ],
          (effect) => makeEffectStatement(effect, path),
        ),
      (_context) => makeReadExpression("this", path),
      path,
    ),
    path,
  );

/**
 * @type {(
 *   context: import("../context.js").Context,
 *   options: {
 *     name: import("../name.mjs").Name,
 *     self: unbuild.Variable,
 *     path: unbuild.Path,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listDefaultConstructorEffect = (context, { self, name, path }) => [
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
            makeReadExpression("function.arguments", path),
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
        makeReadExpression(self, path),
        makePrimitiveExpression("length", path),
        makeDataDescriptorExpression(
          makePrimitiveExpression(false, path),
          makePrimitiveExpression(false, path),
          makePrimitiveExpression(true, path),
          makePrimitiveExpression(0, path),
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
        makeReadExpression(self, path),
        makePrimitiveExpression("name", path),
        makeDataDescriptorExpression(
          makePrimitiveExpression(false, path),
          makePrimitiveExpression(false, path),
          makePrimitiveExpression(true, path),
          makeNameExpression(name, path),
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
 *     self: unbuild.Variable,
 *     name: import("../name.mjs").Name,
 *     path: unbuild.Path,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listConstructorEffect = (pairs, context, { self, name, path }) => {
  switch (pairs.length) {
    case 0: {
      return listDefaultConstructorEffect(context, { self, name, path });
    }
    case 1: {
      return [
        makeWriteEffect(
          self,
          unbuildFunction(drill(pairs[0], "value"), context, {
            kind: "constructor",
            name,
          }),
          true,
          path,
        ),
      ];
    }
    default: {
      throw new SyntaxAranError("multiple constructor", null);
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
  post: [...element1.post, ...element2.post],
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
 *     super: ".default" | unbuild.Variable,
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
        makeWriteEffect(variable, makePrivateExpression(key, path), true, path),
      ),
      ...(main.post.length === 0
        ? []
        : [
            makeWriteEffect(
              post,
              makeInstanceFieldExpression(main.post, main_context, path),
              true,
              path,
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
        { self, name, path },
      ),
      ...listDeclarePrivateEffect(main_context, self, path),
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
            super_ === ".default"
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
        super: ".default",
      });
};
