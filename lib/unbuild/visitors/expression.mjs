/* eslint-disable no-use-before-define */

import {
  AranTypeError,
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
import { makeSyntaxErrorExpression } from "../report.mjs";
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

const {
  Reflect: { apply },
  String: {
    prototype: { slice: sliceString },
  },
} = globalThis;

const BASENAME = /** @type {__basename} */ ("expression");

/**
 * @type {<N extends estree.Property | estree.SpreadElement>(
 *   pairs: {
 *     node: N,
 *     path: unbuild.Path,
 *   }[],
 *   context: import("../context.js").Context,
 *   options: {
 *     path: unbuild.Path,
 *   },
 * ) => {
 *   prototype: aran.Expression<unbuild.Atom>,
 *   properties: {
 *     node: N,
 *     path: unbuild.Path,
 *   }[],
 * }}
 */
const extractPrototype = (pairs, context, { path }) =>
  pairs.length > 0 && isProtoProperty(pairs[0].node)
    ? {
        prototype: unbuildProtoProperty(
          /** @type {any} */ (pairs[0]),
          context,
          null,
        ),
        properties: slice(pairs, 1, pairs.length),
      }
    : {
        prototype: makeIntrinsicExpression("Object.prototype", path),
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
      path,
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
    case "Literal": {
      if (hasOwn(node, "regex")) {
        return makeApplyExpression(
          makeIntrinsicExpression("RegExp", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makePrimitiveExpression(
              /** @type {estree.RegExpLiteral} */ (node).regex.pattern,
              path,
            ),
            makePrimitiveExpression(
              /** @type {estree.RegExpLiteral} */ (node).regex.flags,
              path,
            ),
          ],
          path,
        );
      } else if (hasOwn(node, "bigint")) {
        return makePrimitiveExpression(
          { bigint: /** @type {estree.BigIntLiteral} */ (node).bigint },
          path,
        );
      } else {
        return makePrimitiveExpression(
          /** @type {estree.SimpleLiteral} */ (node).value,
          path,
        );
      }
    }
    case "TemplateLiteral": {
      if (node.expressions.length !== node.quasis.length - 1) {
        return makeSyntaxErrorExpression(
          "Template literal quasis/expressions length mismatch",
          path,
        );
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
              path,
            ),
            accumulation,
            path,
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
    }
    // Tagged template cannot lead to a direct eval call because it receives an array instead of a string:
    // cf: https://www.ecma-international.org/ecma-262/10.0/index.html#sec-performeval
    case "TaggedTemplateExpression": {
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
              makeIntrinsicExpression("Object.freeze", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeApplyExpression(
                  makeIntrinsicExpression("Object.defineProperty", path),
                  makePrimitiveExpression({ undefined: null }, path),
                  [
                    makeArrayExpression(
                      map(
                        drillAll(
                          drillArray(drill({ node, path }, "quasi"), "quasis"),
                        ),
                        (pair) => unbuildQuasi(pair, context, { cooked: true }),
                      ),
                      path,
                    ),
                    makePrimitiveExpression("raw", path),
                    makeDataDescriptorExpression(
                      makePrimitiveExpression(false, path),
                      makePrimitiveExpression(false, path),
                      makePrimitiveExpression(false, path),
                      makeApplyExpression(
                        makeIntrinsicExpression("Object.freeze", path),
                        makePrimitiveExpression({ undefined: null }, path),
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
                                unbuildQuasi(pair, context, {
                                  cooked: false,
                                }),
                            ),
                            path,
                          ),
                        ],
                        path,
                      ),
                      path,
                    ),
                  ],
                  path,
                ),
              ],
              path,
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
    }
    case "ThisExpression": {
      return makeThisExpression(context, path);
    }
    case "MetaProperty": {
      if (node.meta.name === "new" && node.property.name === "target") {
        return makeNewTargetExpression(context, path);
      } else if (node.meta.name === "import" && node.property.name === "meta") {
        return makeImportMetaExpression(context, path);
      } else {
        return makeSyntaxErrorExpression(
          `Illegal meta property: '${node.meta.name}.${node.property.name}'`,
          path,
        );
      }
    }
    case "Identifier": {
      return makeScopeReadExpression(
        context,
        /** @type {estree.Variable} */ (node.name),
        path,
      );
    }
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
                {
                  // eslint-disable-next-line object-shorthand
                  node: /** @type {{left: estree.Expression}} */ (node),
                  path,
                },
                "left",
              ),
              context,
              null,
            ),
            makeThrowErrorExpression(
              "ReferenceError",
              "Invalid left-hand side in assignment",
              path,
            ),
            path,
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
                path,
              ),
              ...unbuildPatternEffect(drill({ node, path }, "left"), context, {
                right,
              }),
            ],
            makeReadExpression(right, path),
            path,
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
    case "UpdateExpression": {
      return unbuildUpdateExpression(
        drill({ node, path }, "argument"),
        context,
        {
          update: makePrimitiveExpression(1, path),
          prefix: node.prefix,
          operator: /** @type {estree.BinaryOperator} */ (node.operator[0]),
        },
      );
    }
    case "UnaryExpression": {
      switch (node.operator) {
        case "typeof": {
          return node.argument.type === "Identifier"
            ? makeScopeTypeofExpression(
                context,
                /** @type {estree.Variable} */ (node.argument.name),
                path,
              )
            : makeUnaryExpression(
                node.operator,
                unbuildExpression(drill({ node, path }, "argument"), context, {
                  name: ANONYMOUS,
                }),
                path,
              );
        }
        case "delete": {
          return unbuildDeleteArgument(
            drill({ node, path }, "argument"),
            context,
            null,
          );
        }
        default: {
          return makeUnaryExpression(
            node.operator,
            unbuildExpression(drill({ node, path }, "argument"), context, {
              name: ANONYMOUS,
            }),
            path,
          );
        }
      }
    }
    case "BinaryExpression": {
      return makeBinaryExpression(
        node.operator,
        unbuildExpression(drill({ node, path }, "left"), context, {
          name: ANONYMOUS,
        }),
        unbuildExpression(drill({ node, path }, "right"), context, {
          name: ANONYMOUS,
        }),
        path,
      );
    }
    case "SequenceExpression": {
      return makeLongSequenceExpression(
        flatMap(
          slice(
            drillAll(drillArray({ node, path }, "expressions")),
            0,
            node.expressions.length - 1,
          ),
          (pair) => unbuildEffect(pair, context, null),
        ),
        unbuildExpression(
          drillOne(
            drillArray({ node, path }, "expressions"),
            node.expressions.length - 1,
          ),
          context,
          { name: ANONYMOUS },
        ),
        path,
      );
    }
    case "ConditionalExpression": {
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
        path,
      );
    }
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
          path,
        ),
        (({ node, path }, operator) => {
          switch (operator) {
            case "&&": {
              return makeConditionalExpression(
                makeReadExpression(left, path),
                unbuildExpression({ node, path }, context, {
                  name: ANONYMOUS,
                }),
                makeReadExpression(left, path),
                path,
              );
            }
            case "||": {
              return makeConditionalExpression(
                makeReadExpression(left, path),
                makeReadExpression(left, path),
                unbuildExpression({ node, path }, context, {
                  name: ANONYMOUS,
                }),
                path,
              );
            }
            case "??": {
              return makeConditionalExpression(
                makeBinaryExpression(
                  "==",
                  makeReadExpression(left, path),
                  makePrimitiveExpression(null, path),
                  path,
                ),
                unbuildExpression({ node, path }, context, {
                  name: ANONYMOUS,
                }),
                makeReadExpression(left, path),
                path,
              );
            }
            default: {
              throw new AranTypeError("Invalid logical operator", operator);
            }
          }
        })(drill({ node, path }, "right"), node.operator),
        path,
      );
    }
    case "AwaitExpression": {
      return makeAwaitExpression(
        unbuildExpression(drill({ node, path }, "argument"), context, {
          name: ANONYMOUS,
        }),
        path,
      );
    }
    case "YieldExpression": {
      return makeYieldExpression(
        node.delegate,
        hasArgument(node)
          ? unbuildExpression(drill({ node, path }, "argument"), context, {
              name: ANONYMOUS,
            })
          : makePrimitiveExpression({ undefined: null }, path),
        path,
      );
    }
    case "ArrowFunctionExpression": {
      return unbuildFunction({ node, path }, context, {
        kind: "arrow",
        name,
      });
    }
    case "FunctionExpression": {
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
    }
    case "ClassExpression": {
      return unbuildClass({ node, path }, context, { name });
    }
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
                path,
              ),
              makeIntrinsicExpression("eval", path),
              path,
            ),
            makeEvalExpression(
              makeReadExpression(head[0], path),
              context,
              path,
            ),
            makeApplyExpression(
              makeScopeReadExpression(
                context,
                /** @type {estree.Variable} */ ("eval"),
                path,
              ),
              makePrimitiveExpression({ undefined: null }, path),
              map(head, (variable) => makeReadExpression(variable, path)),
              path,
            ),
            path,
          ),
          path,
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
                  makeIntrinsicExpression("Array.prototype.concat", path),
                  makeArrayExpression([], path),
                  map(
                    drillAll(drillArray({ node, path }, "arguments")),
                    (pair) => unbuildSpreadable(pair, context, null),
                  ),
                  path,
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
          path,
        );
      } else {
        return makeApplyExpression(
          makeIntrinsicExpression("Array.prototype.concat", path),
          makeArrayExpression([], path),
          map(
            drillAll(drillArray({ node, path }, "elements")),
            ({ node, path }) =>
              node === null
                ? // Array(1) is succeptible to pollution of
                  // Array.prototype and Object.prototype
                  makeObjectExpression(
                    makePrimitiveExpression(null, path),
                    [
                      [
                        makePrimitiveExpression("length", path),
                        makePrimitiveExpression(1, path),
                      ],
                      [
                        makeIntrinsicExpression(
                          "Symbol.isConcatSpreadable",
                          path,
                        ),
                        makePrimitiveExpression(true, path),
                      ],
                    ],
                    path,
                  )
                : unbuildSpreadable({ node, path }, context, null),
          ),
          path,
        );
      }
    }
    case "ImportExpression": {
      return makeApplyExpression(
        makeReadExpression("import", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          unbuildExpression(drill({ node, path }, "source"), context, {
            name: ANONYMOUS,
          }),
        ],
        path,
      );
    }
    case "NewExpression": {
      if (node.callee.type === "Super") {
        return makeSyntaxErrorExpression(
          "'super' cannot invoked with 'new'",
          path,
        );
      }
      if (isNotSpreadNewExpression(node)) {
        return makeConstructExpression(
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
          map(drillAll(drillArray({ node, path }, "arguments")), (pair) =>
            unbuildExpression(pair, context, { name: ANONYMOUS }),
          ),
          path,
        );
      } else {
        return makeApplyExpression(
          makeIntrinsicExpression("Reflect.construct", path),
          makePrimitiveExpression({ undefined: null }, path),
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
              makeIntrinsicExpression("Array.prototype.concat", path),
              makeArrayExpression([], path),
              map(drillAll(drillArray({ node, path }, "arguments")), (pair) =>
                unbuildSpreadable(pair, context, null),
              ),
              path,
            ),
          ],
          path,
        );
      }
    }
    case "ChainExpression": {
      return unbuildExpression(drill({ node, path }, "expression"), context, {
        name: ANONYMOUS,
      });
    }
    case "MemberExpression": {
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
              path,
            ),
            makeConditionalExpression(
              makeBinaryExpression(
                "==",
                makeReadExpression(object, path),
                makePrimitiveExpression(null, path),
                path,
              ),
              makePrimitiveExpression({ undefined: null }, path),
              makeGetExpression(
                makeReadExpression(object, path),
                unbuildKeyExpression(
                  drill({ node, path }, "property"),
                  context,
                  node,
                ),
                path,
              ),
              path,
            ),
            path,
          );
        } else {
          return makeSyntaxErrorExpression(
            "'super' cannot be used in a optional member expression",
            path,
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
            path,
          );
        } else {
          return makeGetSuperExpression(
            context,
            unbuildKeyExpression(
              drill({ node, path }, "property"),
              context,
              node,
            ),
            path,
          );
        }
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
          { path },
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
                path,
              ),
              true,
              path,
            ),
            makeReadExpression(self, path),
            path,
          );
        } else {
          return makeObjectExpression(
            prototype,
            map(properties, (pair) =>
              unbuildInitProperty(pair, context, {
                self: null,
              }),
            ),
            path,
          );
        }
      } else {
        const { prototype, properties } = extractPrototype(
          drillAll(drillArray({ node, path }, "properties")),
          context,
          { path },
        );
        return makeLongSequenceExpression(
          [
            makeWriteEffect(
              self,
              makeObjectExpression(prototype, [], path),
              true,
              path,
            ),
            ...flatMap(properties, (pair) =>
              unbuildProperty(pair, context, { self }),
            ),
          ],
          makeReadExpression(self, path),
          path,
        );
      }
    }
    default: {
      throw new AranTypeError("invalid expression node", node);
    }
  }
};
