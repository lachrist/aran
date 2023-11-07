/* eslint-disable no-use-before-define */

import {
  AranTypeError,
  flatMap,
  map,
  slice,
  some,
  hasOwn,
  zip,
  flat,
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
  makeScopeParameterExpression,
  makeScopeGetSuperExpression,
  makeScopeReadExpression,
  makeScopeTypeofExpression,
} from "../scope/inner/index.mjs";
import { unbuildKeyExpression } from "./key.mjs";
import { unbuildEffect } from "./effect.mjs";
import { unbuildUpdateExpression } from "./update.mjs";
import { unbuildPatternEffect } from "./pattern.mjs";
import { enumMeta, splitMeta, zipMeta } from "../mangle.mjs";
import { makeSyntaxErrorExpression } from "../report.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildCallee } from "./callee.mjs";
import { unbuildSpreadable } from "./spreadable.mjs";
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
  isNotSuperNewExpression,
  isProtoProperty,
  isRegularArrayExpression,
} from "../predicate.mjs";
import { unbuildDeleteArgument } from "./delete.mjs";
import {
  makeInitCacheExpression,
  makeEnumCacheExpression,
  makeReadCacheExpression,
  makeSelfCacheExpression,
} from "../cache.mjs";

const {
  Reflect: { apply },
  String,
  String: {
    prototype: { slice: sliceString },
  },
} = globalThis;

/**
 * @type {<N extends estree.Property | estree.SpreadElement>(
 *   pairs: {
 *     node: N,
 *     path: unbuild.Path,
 *   }[],
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.Meta,
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
const extractPrototype = (pairs, context, { meta, path }) =>
  pairs.length > 0 && isProtoProperty(pairs[0].node)
    ? {
        prototype: unbuildProtoProperty(
          /** @type {any} */ (pairs[0]),
          context,
          { meta },
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
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *     name: import("../name.mjs").Name,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildExpression = (
  { node, path },
  context,
  { meta, name: _name },
) => {
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
      return makeApplyExpression(
        // String.prototype.concat rather than nested `+`.
        // Object.defineProperty(Number.prototype, "toString", { value: function () { return "foo"; } });
        // console.log("" + Object(123));
        // console.log(`${Object(123)}`);
        // console.log(String(Object(123)));
        // cf https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-template-literals-runtime-semantics-evaluation
        makeIntrinsicExpression("String.prototype.concat", path),
        makePrimitiveExpression("", path),
        [
          ...flat(
            zip(
              map(drillAll(drillArray({ node, path }, "quasis")), (pair) =>
                unbuildQuasi(pair, context, { cooked: true }),
              ),
              map(
                zipMeta(
                  meta,
                  drillAll(drillArray({ node, path }, "expressions")),
                ),
                ([meta, pair]) =>
                  unbuildExpression(pair, context, { meta, name: ANONYMOUS }),
              ),
            ),
          ),
          unbuildQuasi(
            drillOne(
              drillArray({ node, path }, "quasis"),
              node.quasis.length - 1,
            ),
            context,
            { cooked: true },
          ),
        ],
        path,
      );
    }
    // Tagged template cannot lead to a direct eval call because it receives an array instead of a string:
    // cf: https://www.ecma-international.org/ecma-262/10.0/index.html#sec-performeval
    case "TaggedTemplateExpression": {
      const metas = splitMeta(meta, ["tag", "quasi"]);
      return unbuildCallee(drill({ node, path }, "tag"), context, {
        meta: metas.tag,
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
                      {
                        value: makeApplyExpression(
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
                        writable: false,
                        enumerable: false,
                        configurable: false,
                      },
                      path,
                    ),
                  ],
                  path,
                ),
              ],
              path,
            ),
            ...map(
              zipMeta(
                metas.quasi,
                drillAll(
                  drillArray(drill({ node, path }, "quasi"), "expressions"),
                ),
              ),
              ([meta, pair]) =>
                unbuildExpression(pair, context, { meta, name: ANONYMOUS }),
            ),
          ],
        },
      });
    }
    case "ThisExpression": {
      return makeScopeParameterExpression(context, "this", path);
    }
    case "MetaProperty": {
      if (node.meta.name === "new" && node.property.name === "target") {
        return makeScopeParameterExpression(context, "new.target", path);
      } else if (node.meta.name === "import" && node.property.name === "meta") {
        return makeScopeParameterExpression(context, "import.meta", path);
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
              { meta },
            ),
            makeThrowErrorExpression(
              "ReferenceError",
              "Invalid left-hand side in assignment",
              path,
            ),
            path,
          );
        } else {
          const metas = splitMeta(meta, ["left", "right", "right_cache"]);
          return makeInitCacheExpression(
            "constant",
            unbuildExpression(drill({ node, path }, "right"), context, {
              meta: metas.right,
              name: ANONYMOUS,
            }),
            { path, meta: metas.right_cache },
            (right) =>
              makeLongSequenceExpression(
                unbuildPatternEffect(drill({ node, path }, "left"), context, {
                  meta: metas.left,
                  right: makeReadCacheExpression(right, path),
                }),
                makeReadCacheExpression(right, path),
                path,
              ),
          );
        }
      } else {
        const metas = splitMeta(meta, ["left", "right"]);
        return unbuildUpdateExpression(drill({ node, path }, "left"), context, {
          meta: metas.left,
          update: unbuildExpression(drill({ node, path }, "right"), context, {
            meta: metas.right,
            name: ANONYMOUS,
          }),
          prefix: true,
          operator:
            /** @type {estree.BinaryOperator | estree.LogicalOperator} */ (
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
          meta,
          update: null,
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
                  meta,
                  name: ANONYMOUS,
                }),
                path,
              );
        }
        case "delete": {
          return unbuildDeleteArgument(
            drill({ node, path }, "argument"),
            context,
            { meta },
          );
        }
        default: {
          return makeUnaryExpression(
            node.operator,
            unbuildExpression(drill({ node, path }, "argument"), context, {
              meta,
              name: ANONYMOUS,
            }),
            path,
          );
        }
      }
    }
    case "BinaryExpression": {
      const metas = splitMeta(meta, ["left", "right"]);
      return makeBinaryExpression(
        node.operator,
        unbuildExpression(drill({ node, path }, "left"), context, {
          meta: metas.left,
          name: ANONYMOUS,
        }),
        unbuildExpression(drill({ node, path }, "right"), context, {
          meta: metas.right,
          name: ANONYMOUS,
        }),
        path,
      );
    }
    case "SequenceExpression": {
      const metas = splitMeta(meta, ["body", "tail"]);
      return makeLongSequenceExpression(
        flatMap(
          zipMeta(
            metas.body,
            slice(
              drillAll(drillArray({ node, path }, "expressions")),
              0,
              node.expressions.length - 1,
            ),
          ),
          ([meta, pair]) => unbuildEffect(pair, context, { meta }),
        ),
        unbuildExpression(
          drillOne(
            drillArray({ node, path }, "expressions"),
            node.expressions.length - 1,
          ),
          context,
          { meta: metas.tail, name: ANONYMOUS },
        ),
        path,
      );
    }
    case "ConditionalExpression": {
      const metas = splitMeta(meta, ["test", "consequent", "alternate"]);
      return makeConditionalExpression(
        unbuildExpression(drill({ node, path }, "test"), context, {
          meta: metas.test,
          name: ANONYMOUS,
        }),
        unbuildExpression(drill({ node, path }, "consequent"), context, {
          meta: metas.consequent,
          name: ANONYMOUS,
        }),
        unbuildExpression(drill({ node, path }, "alternate"), context, {
          meta: metas.alternate,
          name: ANONYMOUS,
        }),
        path,
      );
    }
    case "LogicalExpression": {
      const metas = splitMeta(meta, ["left", "right", "left_cache"]);
      return makeInitCacheExpression(
        "constant",
        unbuildExpression(drill({ node, path }, "left"), context, {
          meta: metas.left,
          name: ANONYMOUS,
        }),
        { path, meta: metas.left_cache },
        (left) => {
          switch (node.operator) {
            case "&&": {
              return makeConditionalExpression(
                makeReadCacheExpression(left, path),
                unbuildExpression(drill({ node, path }, "right"), context, {
                  meta: metas.right,
                  name: ANONYMOUS,
                }),
                makeReadCacheExpression(left, path),
                path,
              );
            }
            case "||": {
              return makeConditionalExpression(
                makeReadCacheExpression(left, path),
                makeReadCacheExpression(left, path),
                unbuildExpression(drill({ node, path }, "right"), context, {
                  meta: metas.right,
                  name: ANONYMOUS,
                }),
                path,
              );
            }
            case "??": {
              return makeConditionalExpression(
                makeBinaryExpression(
                  "==",
                  makeReadCacheExpression(left, path),
                  makePrimitiveExpression(null, path),
                  path,
                ),
                unbuildExpression(drill({ node, path }, "right"), context, {
                  meta: metas.right,
                  name: ANONYMOUS,
                }),
                makeReadCacheExpression(left, path),
                path,
              );
            }
            default: {
              throw new AranTypeError("Invalid logical operator", node);
            }
          }
        },
      );
    }
    case "AwaitExpression": {
      return makeAwaitExpression(
        unbuildExpression(drill({ node, path }, "argument"), context, {
          meta,
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
              meta,
              name: ANONYMOUS,
            })
          : makePrimitiveExpression({ undefined: null }, path),
        path,
      );
    }
    case "ArrowFunctionExpression": {
      return unbuildFunction({ node, path }, context, {
        type: "arrow",
        meta,
        name: makePrimitiveExpression("", path),
      });
    }
    case "FunctionExpression": {
      return unbuildFunction({ node, path }, context, {
        type: "function",
        meta,
        name: makePrimitiveExpression("", path),
      });
    }
    case "ClassExpression": {
      return unbuildClass({ node, path }, context, {
        meta,
        name: makePrimitiveExpression("", path),
      });
    }
    case "CallExpression": {
      if (isDirectEvalCallExpression(node)) {
        const metas = splitMeta(meta, ["eval", "arguments", "arguments_cache"]);
        return makeEnumCacheExpression(
          "constant",
          map(
            zipMeta(
              metas.arguments,
              drillAll(drillArray({ node, path }, "arguments")),
            ),
            ([meta, pair]) =>
              unbuildExpression(pair, context, { meta, name: ANONYMOUS }),
          ),
          { path, meta: metas.arguments_cache },
          (arguments_) =>
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
                makeReadCacheExpression(arguments_[0], path),
                { ...context, meta: String(metas.eval) },
                path,
              ),
              makeApplyExpression(
                makeScopeReadExpression(
                  context,
                  /** @type {estree.Variable} */ ("eval"),
                  path,
                ),
                makePrimitiveExpression({ undefined: null }, path),
                map(arguments_, (cache) =>
                  makeReadCacheExpression(cache, path),
                ),
                path,
              ),
              path,
            ),
        );
      } else {
        const metas = splitMeta(meta, ["callee", "arguments"]);
        return unbuildCallee(drill({ node, path }, "callee"), context, {
          meta: metas.callee,
          optional: node.optional,
          arguments: isNotSpreadCallExpression(node)
            ? {
                type: "spread",
                values: map(
                  zip(
                    enumMeta(metas.arguments, node.arguments.length),
                    drillAll(drillArray({ node, path }, "arguments")),
                  ),
                  ([meta, pair]) =>
                    unbuildExpression(pair, context, { meta, name: ANONYMOUS }),
                ),
              }
            : {
                type: "concat",
                value: makeApplyExpression(
                  makeIntrinsicExpression("Array.prototype.concat", path),
                  makeArrayExpression([], path),
                  map(
                    zip(
                      enumMeta(metas.arguments, node.arguments.length),
                      drillAll(drillArray({ node, path }, "arguments")),
                    ),
                    ([meta, pair]) =>
                      unbuildSpreadable(pair, context, { meta }),
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
          map(
            zip(
              enumMeta(meta, node.elements.length),
              drillAll(drillArray({ node, path }, "elements")),
            ),
            ([meta, pair]) =>
              unbuildExpression(pair, context, { meta, name: ANONYMOUS }),
          ),
          path,
        );
      } else {
        return makeApplyExpression(
          makeIntrinsicExpression("Array.prototype.concat", path),
          makeArrayExpression([], path),
          map(
            zip(
              enumMeta(meta, node.elements.length),
              drillAll(drillArray({ node, path }, "elements")),
            ),
            ([meta, { node, path }]) =>
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
                : unbuildSpreadable({ node, path }, context, { meta }),
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
            meta,
            name: ANONYMOUS,
          }),
        ],
        path,
      );
    }
    case "NewExpression": {
      if (isNotSuperNewExpression(node)) {
        if (isNotSpreadNewExpression(node)) {
          const metas = splitMeta(meta, ["callee", "arguments"]);
          return makeConstructExpression(
            unbuildExpression(drill({ node, path }, "callee"), context, {
              meta: metas.callee,
              name: ANONYMOUS,
            }),
            map(
              zip(
                enumMeta(metas.arguments, node.arguments.length),
                drillAll(drillArray({ node, path }, "arguments")),
              ),
              ([meta, pair]) =>
                unbuildExpression(pair, context, { meta, name: ANONYMOUS }),
            ),
            path,
          );
        } else {
          const metas = splitMeta(meta, ["callee", "arguments"]);
          return makeApplyExpression(
            makeIntrinsicExpression("Reflect.construct", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              unbuildExpression(drill({ node, path }, "callee"), context, {
                meta: metas.callee,
                name: ANONYMOUS,
              }),
              makeApplyExpression(
                makeIntrinsicExpression("Array.prototype.concat", path),
                makeArrayExpression([], path),
                map(
                  zip(
                    enumMeta(metas.arguments, node.arguments.length),
                    drillAll(drillArray({ node, path }, "arguments")),
                  ),
                  ([meta, pair]) => unbuildSpreadable(pair, context, { meta }),
                ),
                path,
              ),
            ],
            path,
          );
        }
      } else {
        return makeSyntaxErrorExpression(
          "'super' cannot be invoked with 'new'",
          path,
        );
      }
    }
    case "ChainExpression": {
      return unbuildExpression(drill({ node, path }, "expression"), context, {
        meta,
        name: ANONYMOUS,
      });
    }
    case "MemberExpression": {
      if (node.optional) {
        if (isNotSuperMemberExpression(node)) {
          const metas = splitMeta(meta, ["object", "key", "object_cache"]);
          return makeInitCacheExpression(
            "constant",
            unbuildExpression(drill({ node, path }, "object"), context, {
              meta: metas.object,
              name: ANONYMOUS,
            }),
            { path, meta: metas.object_cache },
            (object) =>
              makeConditionalExpression(
                makeBinaryExpression(
                  "==",
                  makeReadCacheExpression(object, path),
                  makePrimitiveExpression(null, path),
                  path,
                ),
                makePrimitiveExpression({ undefined: null }, path),
                makeGetExpression(
                  makeReadCacheExpression(object, path),
                  unbuildKeyExpression(
                    drill({ node, path }, "property"),
                    context,
                    { meta: metas.key, computed: node.computed },
                  ),
                  path,
                ),
                path,
              ),
          );
        } else {
          return makeSyntaxErrorExpression(
            "'super' cannot be used in a optional member expression",
            path,
          );
        }
      } else {
        if (isNotSuperMemberExpression(node)) {
          const metas = splitMeta(meta, ["object", "key"]);
          return makeGetExpression(
            unbuildExpression(drill({ node, path }, "object"), context, {
              meta: metas.object,
              name: ANONYMOUS,
            }),
            unbuildKeyExpression(drill({ node, path }, "property"), context, {
              meta: metas.key,
              computed: node.computed,
            }),
            path,
          );
        } else {
          return makeScopeGetSuperExpression(
            context,
            unbuildKeyExpression(drill({ node, path }, "property"), context, {
              meta,
              computed: node.computed,
            }),
            path,
          );
        }
      }
    }
    case "ObjectExpression": {
      if (isInitObjectExpression(node)) {
        const metas = splitMeta(meta, [
          "prototype",
          "properties",
          "self_cache",
        ]);
        const { prototype, properties } = extractPrototype(
          drillAll(drillArray({ node, path }, "properties")),
          context,
          { meta: metas.prototype, path },
        );
        if (some(node.properties, isSuperProperty)) {
          return makeSelfCacheExpression(
            "constant",
            (self) =>
              makeObjectExpression(
                prototype,
                map(properties, (pair) =>
                  unbuildInitProperty(pair, context, {
                    meta: metas.properties,
                    self,
                  }),
                ),
                path,
              ),
            { path, meta: metas.self_cache },
            (self) => makeReadCacheExpression(self, path),
          );
        } else {
          return makeObjectExpression(
            prototype,
            map(properties, (pair) =>
              unbuildInitProperty(pair, context, {
                meta: metas.properties,
                self: null,
              }),
            ),
            path,
          );
        }
      } else {
        const metas = splitMeta(meta, [
          "prototype",
          "properties",
          "self_cache",
        ]);
        const { prototype, properties } = extractPrototype(
          drillAll(drillArray({ node, path }, "properties")),
          context,
          { meta: metas.prototype, path },
        );
        return makeInitCacheExpression(
          "constant",
          makeObjectExpression(prototype, [], path),
          { path, meta: metas.self_cache },
          (self) =>
            makeLongSequenceExpression(
              flatMap(
                zip(enumMeta(metas.properties, properties.length), properties),
                ([meta, pair]) =>
                  unbuildProperty(pair, context, { meta, self }),
              ),
              makeReadCacheExpression(self, path),
              path,
            ),
        );
      }
    }
    default: {
      throw new AranTypeError("invalid expression node", node);
    }
  }
};
