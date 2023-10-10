/* eslint-disable no-use-before-define */
import {
  DynamicError,
  StaticError,
  flatMap,
  map,
  reduceReverse,
  slice,
  some,
  hasOwn,
  zip,
  unzip,
} from "../../util/index.mjs";
import {
  makeApplyExpression,
  makeAwaitExpression,
  makeConditionalExpression,
  makeConstructExpression,
  makeEvalExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeSequenceExpression,
  makeWriteEffect,
  makeYieldExpression,
} from "../node.mjs";
import {
  makeArrayExpression,
  makeBinaryExpression,
  makeDataDescriptorExpression,
  makeGetExpression,
  makeObjectExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
  makeLongSequenceExpression,
} from "../intrinsic.mjs";
import {
  makeScopeReadExpression,
  makeScopeTypeofExpression,
} from "../scope/inner/index.mjs";
import { unbuildKeyExpression } from "./key.mjs";
import { unbuildEffect } from "./effect.mjs";
import { unbuildUpdateExpression } from "./update.mjs";
import { unbuildPatternEffect } from "./pattern.mjs";
import { mangleMetaVariable } from "../mangle.mjs";
import { SyntaxAranError } from "../../error.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildCallee } from "./callee.mjs";
import { unbuildSpreadable } from "./spreadable.mjs";
import {
  makeGetSuperExpression,
  makeImportMetaExpression,
  makeNewTargetExpression,
  makeThisExpression,
} from "../record.mjs";
import { unbuildQuasi } from "./quasi.mjs";
import {
  unbuildInitProperty,
  unbuildProperty,
  unbuildProtoProperty,
} from "./property.mjs";
import { unbuildClass } from "./class.mjs";
import { ANONYMOUS } from "../name.mjs";
import { drill, drillArray, drillAll, drillOne } from "../../drill.mjs";
import {
  hasArgument,
  isDirectEvalCallExpression,
  isInitObjectExpression,
  isNotSpreadCallExpression,
  isNotSpreadNewExpression,
  isNotSuperMemberExpression,
  isProtoProperty,
  isRegularArrayExpression,
} from "../predicate.mjs";
import { unbuildDeleteArgument } from "./delete.mjs";
import { unbuildLogicalRight } from "./logical.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { slice: sliceString },
  },
} = globalThis;

const BASENAME = /** @type {__basename} */ ("expression");

/**
 * @type {<N extends estree.Property | estree.SpreadElement>(
 *   pair: {
 *     node: N,
 *     path: unbuild.Path,
 *   }[],
 *   context: import("../context.js").Context,
 * ) => {
 *   prototype: aran.Expression<unbuild.Atom>,
 *   properties: {
 *     node: N,
 *     path: unbuild.Path,
 *   }[],
 * }}
 */
const extractPrototype = (pairs, context) =>
  pairs.length > 0 && isProtoProperty(pairs[0].node)
    ? {
        prototype: unbuildProtoProperty(/** @type {any} */ (pairs[0]), context),
        properties: slice(pairs, 1, pairs.length),
      }
    : {
        prototype: makeIntrinsicExpression("Object.prototype"),
        properties: pairs,
      };

/** @type {(node: estree.Node) => boolean} */
const isSuperProperty = (node) =>
  node.type === "Property" && (node.method || node.kind !== "init");

/**
 * @type {(
 *   pair: {
 *     node: estree.Expression,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.d.ts").Context,
 * ) => [
 *   unbuild.Variable,
 *   aran.Effect<unbuild.Atom>,
 * ]}
 */
const unbuildCacheExpression = ({ node, path }, context) => {
  const cache = mangleMetaVariable(
    BASENAME,
    /** @type {__unique} */ ("cache"),
    path,
  );
  return [
    cache,
    makeWriteEffect(
      cache,
      unbuildExpression({ node, path }, context, { name: ANONYMOUS }),
      true,
    ),
  ];
};

/**
 * @type {(
 *   pair: {
 *     node: estree.Expression,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: { name: import("../name.mjs").Name }
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildExpression = ({ node, path }, context, { name }) => {
  switch (node.type) {
    case "Literal":
      if (hasOwn(node, "regex")) {
        return makeApplyExpression(
          makeIntrinsicExpression("RegExp"),
          makePrimitiveExpression({ undefined: null }),
          [
            makePrimitiveExpression(
              /** @type {estree.RegExpLiteral} */ (node).regex.pattern,
            ),
            makePrimitiveExpression(
              /** @type {estree.RegExpLiteral} */ (node).regex.flags,
            ),
          ],
        );
      } else if (hasOwn(node, "bigint")) {
        return makePrimitiveExpression({
          bigint: /** @type {estree.BigIntLiteral} */ (node).bigint,
        });
      } else {
        return makePrimitiveExpression(
          /** @type {estree.SimpleLiteral} */ (node).value,
        );
      }
    case "TemplateLiteral":
      if (node.expressions.length !== node.quasis.length - 1) {
        throw new SyntaxAranError("quasis / expressions length mismatch", node);
      }
      return reduceReverse(
        zip(
          drillAll(drillArray({ node, path }, "quasis")),
          drillAll(drillArray({ node, path }, "expressions")),
        ),
        (accumulation, [pair1, pair2]) =>
          makeBinaryExpression(
            "+",
            makeBinaryExpression(
              "+",
              unbuildQuasi(pair1, context, { cooked: true }),
              unbuildExpression(pair2, context, { name: ANONYMOUS }),
            ),
            accumulation,
          ),
        unbuildQuasi(
          drillOne(
            drillArray({ node, path }, "quasis"),
            node.quasis.length - 1,
          ),
          context,
          {
            cooked: true,
          },
        ),
      );
    // Tagged template cannot lead to a direct eval call because it receives an array instead of a string:
    // cf: https://www.ecma-international.org/ecma-262/10.0/index.html#sec-performeval
    case "TaggedTemplateExpression":
      return unbuildCallee(drill({ node, path }, "tag"), context, {
        optional: false,
        arguments: {
          type: "spread",
          values: [
            // TODO: cache somewhere the first argument... but where?
            // For any particular tagged template literal expression, the tag
            // function will always be called with the exact same literal array,
            // no matter how many times the literal is evaluated.
            // -- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates
            makeApplyExpression(
              makeIntrinsicExpression("Object.freeze"),
              makePrimitiveExpression({ undefined: null }),
              [
                makeApplyExpression(
                  makeIntrinsicExpression("Object.defineProperty"),
                  makePrimitiveExpression({ undefined: null }),
                  [
                    makeArrayExpression(
                      map(
                        drillAll(
                          drillArray(drill({ node, path }, "quasi"), "quasis"),
                        ),
                        (pair) => unbuildQuasi(pair, context, { cooked: true }),
                      ),
                    ),
                    makePrimitiveExpression("raw"),
                    makeDataDescriptorExpression(
                      makePrimitiveExpression(false),
                      makePrimitiveExpression(false),
                      makePrimitiveExpression(false),
                      makeApplyExpression(
                        makeIntrinsicExpression("Object.freeze"),
                        makePrimitiveExpression({ undefined: null }),
                        [
                          makeArrayExpression(
                            map(
                              drillAll(
                                drillArray(
                                  drill({ node, path }, "quasi"),
                                  "quasis",
                                ),
                              ),
                              (pair) =>
                                unbuildQuasi(pair, context, { cooked: false }),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
            ...map(
              drillAll(
                drillArray(drill({ node, path }, "quasi"), "expressions"),
              ),
              (pair) => unbuildExpression(pair, context, { name: ANONYMOUS }),
            ),
          ],
        },
      });
    case "ThisExpression":
      return makeThisExpression(context, node);
    case "MetaProperty":
      if (node.meta.name === "new" && node.property.name === "target") {
        return makeNewTargetExpression(context, node);
      } else if (node.meta.name === "import" && node.property.name === "meta") {
        return makeImportMetaExpression(context, node);
      } else {
        throw new DynamicError("invalid meta property", node);
      }
    case "Identifier":
      return makeScopeReadExpression(
        context,
        /** @type {estree.Variable} */ (node.name),
      );
    case "AssignmentExpression": {
      const right = mangleMetaVariable(
        BASENAME,
        /** @type {__unique} */ ("right"),
        path,
      );
      if (node.operator === "=") {
        // > (console.log('foo') = 123);
        // foo
        // Uncaught ReferenceError: Invalid left-hand side in assignment
        if (
          /** @type {estree.Expression} */ (node.left).type === "CallExpression"
        ) {
          return makeLongSequenceExpression(
            unbuildEffect(
              drill(
                // eslint-disable-next-line object-shorthand
                { node: /** @type {{left: estree.Expression}} */ (node), path },
                "left",
              ),
              context,
            ),
            makeThrowErrorExpression(
              "ReferenceError",
              "Invalid left-hand side in assignment",
            ),
          );
        } else {
          return makeLongSequenceExpression(
            [
              makeWriteEffect(
                right,
                unbuildExpression(drill({ node, path }, "right"), context, {
                  name:
                    node.left.type === "Identifier"
                      ? {
                          type: "static",
                          kind: "scope",
                          base: /** @type {estree.Variable} */ (node.left.type),
                        }
                      : ANONYMOUS,
                }),
                true,
              ),
              ...unbuildPatternEffect(drill({ node, path }, "left"), context, {
                right,
              }),
            ],
            makeReadExpression(right),
          );
        }
      } else {
        return unbuildUpdateExpression(drill({ node, path }, "left"), context, {
          update: unbuildExpression(drill({ node, path }, "right"), context, {
            name: ANONYMOUS,
          }),
          prefix: true,
          operator: /** @type {estree.BinaryOperator} */ (
            apply(sliceString, node.operator, [0, -1])
          ),
        });
      }
    }
    case "UpdateExpression":
      return unbuildUpdateExpression(
        drill({ node, path }, "argument"),
        context,
        {
          update: makePrimitiveExpression(1),
          prefix: node.prefix,
          operator: /** @type {estree.BinaryOperator} */ (node.operator[0]),
        },
      );
    case "UnaryExpression":
      switch (node.operator) {
        case "typeof":
          return node.argument.type === "Identifier"
            ? makeScopeTypeofExpression(
                context,
                /** @type {estree.Variable} */ (node.argument.name),
              )
            : makeUnaryExpression(
                node.operator,
                unbuildExpression(drill({ node, path }, "argument"), context, {
                  name: ANONYMOUS,
                }),
              );
        case "delete":
          return unbuildDeleteArgument(
            drill({ node, path }, "argument"),
            context,
          );
        default:
          return makeUnaryExpression(
            node.operator,
            unbuildExpression(drill({ node, path }, "argument"), context, {
              name: ANONYMOUS,
            }),
          );
      }
    case "BinaryExpression":
      return makeBinaryExpression(
        node.operator,
        unbuildExpression(drill({ node, path }, "left"), context, {
          name: ANONYMOUS,
        }),
        unbuildExpression(drill({ node, path }, "right"), context, {
          name: ANONYMOUS,
        }),
      );
    case "SequenceExpression":
      return makeLongSequenceExpression(
        flatMap(
          slice(
            drillAll(drillArray({ node, path }, "expressions")),
            0,
            node.expressions.length - 1,
          ),
          (pair) => unbuildEffect(pair, context),
        ),
        unbuildExpression(
          drillOne(
            drillArray({ node, path }, "expressions"),
            node.expressions.length - 1,
          ),
          context,
          { name: ANONYMOUS },
        ),
      );
    case "ConditionalExpression":
      return makeConditionalExpression(
        unbuildExpression(drill({ node, path }, "test"), context, {
          name: ANONYMOUS,
        }),
        unbuildExpression(drill({ node, path }, "consequent"), context, {
          name: ANONYMOUS,
        }),
        unbuildExpression(drill({ node, path }, "alternate"), context, {
          name: ANONYMOUS,
        }),
      );
    case "LogicalExpression": {
      const left = mangleMetaVariable(
        BASENAME,
        /** @type {__unique}*/ ("left"),
        path,
      );
      return makeSequenceExpression(
        makeWriteEffect(
          left,
          unbuildExpression(drill({ node, path }, "left"), context, {
            name: ANONYMOUS,
          }),
          true,
        ),
        unbuildLogicalRight(drill({ node, path }, "right"), context, {
          left,
          operator: node.operator,
        }),
      );
    }
    case "AwaitExpression":
      return makeAwaitExpression(
        unbuildExpression(drill({ node, path }, "argument"), context, {
          name: ANONYMOUS,
        }),
      );
    case "YieldExpression":
      return makeYieldExpression(
        node.delegate,
        hasArgument(node)
          ? unbuildExpression(drill({ node, path }, "argument"), context, {
              name: ANONYMOUS,
            })
          : makePrimitiveExpression({ undefined: null }),
      );
    case "ArrowFunctionExpression":
      return unbuildFunction({ node, path }, context, {
        kind: "arrow",
        name,
      });
    case "FunctionExpression":
      return unbuildFunction(
        { node, path },
        {
          ...context,
          record: {
            ...context.record,
            "super.prototype": ".illegal",
            "super.constructor": ".illegal",
          },
        },
        {
          kind: "function",
          name,
        },
      );
    case "ClassExpression":
      return unbuildClass({ node, path }, context, { name });
    case "CallExpression": {
      if (isDirectEvalCallExpression(node)) {
        const [head, body] = unzip(
          map(
            drillAll(drillArray({ node, path }, "arguments")),
            ({ node, path }) => unbuildCacheExpression({ node, path }, context),
          ),
        );
        return makeLongSequenceExpression(
          body,
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeScopeReadExpression(
                context,
                /** @type {estree.Variable} */ ("eval"),
              ),
              makeIntrinsicExpression("eval"),
            ),
            makeEvalExpression(makeReadExpression(head[0]), {
              ...context,
              path,
            }),
            makeApplyExpression(
              makeScopeReadExpression(
                context,
                /** @type {estree.Variable} */ ("eval"),
              ),
              makePrimitiveExpression({ undefined: null }),
              map(head, makeReadExpression),
            ),
          ),
        );
      } else {
        return unbuildCallee(drill({ node, path }, "callee"), context, {
          optional: node.optional,
          arguments: isNotSpreadCallExpression(node)
            ? {
                type: "spread",
                values: map(
                  drillAll(drillArray({ node, path }, "arguments")),
                  (pair) =>
                    unbuildExpression(pair, context, { name: ANONYMOUS }),
                ),
              }
            : {
                type: "concat",
                value: makeApplyExpression(
                  makeIntrinsicExpression("Array.prototype.concat"),
                  makeArrayExpression([]),
                  map(
                    drillAll(drillArray({ node, path }, "arguments")),
                    (pair) => unbuildSpreadable(pair, context),
                  ),
                ),
              },
        });
      }
    }
    case "ArrayExpression": {
      if (isRegularArrayExpression(node)) {
        return makeArrayExpression(
          map(drillAll(drillArray({ node, path }, "elements")), (pair) =>
            unbuildExpression(pair, context, { name: ANONYMOUS }),
          ),
        );
      } else {
        return makeApplyExpression(
          makeIntrinsicExpression("Array.prototype.concat"),
          makeArrayExpression([]),
          map(
            drillAll(drillArray({ node, path }, "elements")),
            ({ node, path }) =>
              node === null
                ? // Array(1) is succeptible to pollution of
                  // Array.prototype and Object.prototype
                  makeObjectExpression(makePrimitiveExpression(null), [
                    [
                      makePrimitiveExpression("length"),
                      makePrimitiveExpression(1),
                    ],
                    [
                      makeIntrinsicExpression("Symbol.isConcatSpreadable"),
                      makePrimitiveExpression(true),
                    ],
                  ])
                : unbuildSpreadable({ node, path }, context),
          ),
        );
      }
    }
    case "ImportExpression":
      return makeApplyExpression(
        makeReadExpression("import"),
        makePrimitiveExpression({ undefined: null }),
        [
          unbuildExpression(drill({ node, path }, "source"), context, {
            name: ANONYMOUS,
          }),
        ],
      );
    case "NewExpression":
      if (node.callee.type === "Super") {
        throw new SyntaxAranError(
          "super cannot be used as a constructor",
          node,
        );
      }
      if (isNotSpreadNewExpression(node)) {
        return makeConstructExpression(
          unbuildExpression(
            drill(
              // eslint-disable-next-line object-shorthand
              { node: /** @type {{callee: estree.Expression}} */ (node), path },
              "callee",
            ),
            context,
            {
              name: ANONYMOUS,
            },
          ),
          map(drillAll(drillArray({ node, path }, "arguments")), (pair) =>
            unbuildExpression(pair, context, { name: ANONYMOUS }),
          ),
        );
      } else {
        return makeApplyExpression(
          makeIntrinsicExpression("Reflect.construct"),
          makePrimitiveExpression({ undefined: null }),
          [
            unbuildExpression(
              drill(
                {
                  // eslint-disable-next-line object-shorthand
                  node: /** @type {{callee: estree.Expression}} */ (node),
                  path,
                },
                "callee",
              ),
              context,
              {
                name: ANONYMOUS,
              },
            ),
            makeApplyExpression(
              makeIntrinsicExpression("Array.prototype.concat"),
              makeArrayExpression([]),
              map(drillAll(drillArray({ node, path }, "arguments")), (pair) =>
                unbuildSpreadable(pair, context),
              ),
            ),
          ],
        );
      }
    case "ChainExpression":
      return unbuildExpression(drill({ node, path }, "expression"), context, {
        name: ANONYMOUS,
      });
    case "MemberExpression":
      if (node.optional) {
        if (isNotSuperMemberExpression(node)) {
          const object = mangleMetaVariable(
            BASENAME,
            /** @type {__unique} */ ("object"),
            path,
          );
          return makeSequenceExpression(
            makeWriteEffect(
              object,
              unbuildExpression(
                drill({ node, path }, "object"),
                // {
                //   node: node.object,
                //   path: /** @type {unbuild.Path} */ (`${path}.object`),
                // },
                // { node: node.object, path: append(path, "object") },
                context,
                {
                  name: ANONYMOUS,
                },
              ),
              true,
            ),
            makeConditionalExpression(
              makeBinaryExpression(
                "==",
                makeReadExpression(object),
                makePrimitiveExpression(null),
              ),
              makePrimitiveExpression({ undefined: null }),
              makeGetExpression(
                makeReadExpression(object),
                unbuildKeyExpression(
                  drill({ node, path }, "property"),
                  context,
                  node,
                ),
              ),
            ),
          );
        } else {
          throw new SyntaxAranError(
            "super be used in a optional member expression",
            node,
          );
        }
      } else {
        if (isNotSuperMemberExpression(node)) {
          return makeGetExpression(
            unbuildExpression(drill({ node, path }, "object"), context, {
              name: ANONYMOUS,
            }),
            unbuildKeyExpression(
              drill({ node, path }, "property"),
              context,
              node,
            ),
          );
        } else {
          return makeGetSuperExpression(
            context,
            unbuildKeyExpression(
              drill({ node, path }, "property"),
              context,
              node,
            ),
            node,
          );
        }
      }
    case "ObjectExpression": {
      const self = mangleMetaVariable(
        BASENAME,
        /** @type {__unique} */ ("self"),
        path,
      );
      if (isInitObjectExpression(node)) {
        const { prototype, properties } = extractPrototype(
          drillAll(drillArray({ node, path }, "properties")),
          context,
        );
        if (some(node.properties, isSuperProperty)) {
          return makeSequenceExpression(
            makeWriteEffect(
              self,
              makeObjectExpression(
                prototype,
                map(properties, (pair) =>
                  unbuildInitProperty(pair, context, {
                    self,
                  }),
                ),
              ),
              true,
            ),
            makeReadExpression(self),
          );
        } else {
          return makeObjectExpression(
            prototype,
            map(properties, (pair) =>
              unbuildInitProperty(pair, context, {
                self: null,
              }),
            ),
          );
        }
      } else {
        const { prototype, properties } = extractPrototype(
          drillAll(drillArray({ node, path }, "properties")),
          context,
        );
        return makeLongSequenceExpression(
          [
            makeWriteEffect(self, makeObjectExpression(prototype, []), true),
            ...flatMap(properties, (pair) =>
              unbuildProperty(pair, context, { self }),
            ),
          ],
          makeReadExpression(self),
        );
      }
    }
    default:
      throw new StaticError("invalid expression node", node);
  }
};
