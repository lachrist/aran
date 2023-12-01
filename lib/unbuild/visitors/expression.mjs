import {
  flatMap,
  map,
  slice,
  some,
  hasOwn,
  zip,
  flat,
  mapObject,
  every,
} from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import {
  makeApplyExpression,
  makeAwaitExpression,
  makeConditionalExpression,
  makeConstructExpression,
  makeEvalExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeSequenceExpression,
  makeYieldExpression,
} from "../node.mjs";
import {
  makeArrayExpression,
  makeBinaryExpression,
  makeDataDescriptorExpression,
  makeObjectExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
  makeGetExpression,
  makeSetExpression,
} from "../intrinsic.mjs";
import {
  makeScopeReadExpression,
  makeScopeTypeofExpression,
} from "../scope/index.mjs";
import { unbuildEffect } from "./effect.mjs";
import { unbuildUpdateLeft } from "./update.mjs";
import { unbuildWritePatternEffect } from "./pattern.mjs";
import { splitMeta } from "../mangle.mjs";
import { makeSyntaxErrorExpression } from "../syntax-error.mjs";
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
import { drill, drillArray, splitSite } from "../site.mjs";
import {
  isCallExpressionSite,
  isInitPropertySite,
  isMethodPropertySite,
  isNotNullishSite,
  isNotOptionalMemberExpression,
  isNotSpreadElementSite,
  isNotSuperSite,
  isProtoPropertySite,
} from "../predicate.mjs";
import { unbuildDeleteArgument } from "./delete.mjs";
import {
  makeReadCacheExpression,
  cacheConstant,
  cacheSelf,
} from "../cache.mjs";
import {
  makeHasPrivateExpression,
  makeReadImportExpression,
  makeReadImportMetaExpression,
  makeReadNewTargetExpression,
  makeReadThisExpression,
} from "../param/index.mjs";
import { unbuildMember } from "./member.mjs";
import { unbuildChainElement } from "./chain.mjs";
import { unbuildArgumentList } from "./argument.mjs";
import { makeCallExpression } from "../call.mjs";
import {
  makeConvertNumberExpression,
  makeOneExpression,
  toAssignmentBinaryOperator,
  toUpdateBinaryOperator,
} from "../update.mjs";
import {
  bindSequence,
  flatSequence,
  initSequence,
  mapSequence,
  sequenceCondition,
  sequenceExpression,
} from "../sequence.mjs";

const { String } = globalThis;

/**
 * @type {(
 *   sites: import("../site.mjs").Site<
 *     estree.Property | estree.SpreadElement
 *   >[],
 *   context: import("../context.js").Context,
 *   options: {
 *     path: unbuild.Path,
 *   },
 * ) => {
 *   head: aran.Expression<unbuild.Atom>,
 *   tail: import("../site.mjs").Site<
 *     estree.Property | estree.SpreadElement
 *   >[],
 * }}
 */
const unbuildPrototype = (sites, context, { path }) => {
  if (sites.length > 0) {
    const [head, ...tail] = sites;
    return isProtoPropertySite(head)
      ? {
          head: unbuildProtoProperty(head, context, {}),
          tail,
        }
      : {
          head: makeIntrinsicExpression("Object.prototype", path),
          tail: sites,
        };
  } else {
    return {
      head: makeIntrinsicExpression("Object.prototype", path),
      tail: [],
    };
  }
};

// TODO: remove this function because it breaks sequence abstraction
/**
 * @type {(
 *   sequence: import("../sequence.js").EffectSequence<[
 *     aran.Expression<unbuild.Atom>,
 *     aran.Expression<unbuild.Atom>,
 *   ]>,
 *   path: unbuild.Path,
 * ) => [
 *   aran.Expression<unbuild.Atom>,
 *   aran.Expression<unbuild.Atom>,
 * ]}
 */
const makeUglyProperty = ({ head, tail: [node1, node2] }, path) => [
  makeSequenceExpression(head, node1, path),
  node2,
];

/**
 * @type {(
 *   site: {
 *     node: estree.Expression,
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: import("../context.js").Context,
 *   options: {},
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildExpression = ({ node, path, meta }, context, {}) => {
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
      const sites = mapObject(
        mapObject(
          drill({ node, path, meta }, ["quasis", "expressions"]),
          "quasis",
          drillArray,
        ),
        "expressions",
        drillArray,
      );
      if (node.expressions.length !== node.quasis.length - 1) {
        return makeSyntaxErrorExpression(
          "Template literal quasis/expressions length mismatch",
          path,
        );
      } else {
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
                map(slice(sites.quasis, 0, sites.quasis.length - 1), (site) =>
                  unbuildQuasi(site, context, { cooked: true }),
                ),
                map(sites.expressions, (site) =>
                  unbuildExpression(site, context, {}),
                ),
              ),
            ),
            unbuildQuasi(sites.quasis[sites.quasis.length - 1], context, {
              cooked: true,
            }),
          ],
          path,
        );
      }
    }
    // Tagged template cannot lead to a direct eval call because it receives an array instead of a string:
    // cf: https://www.ecma-international.org/ecma-262/10.0/index.html#sec-performeval
    case "TaggedTemplateExpression": {
      const metas = splitMeta(meta, ["drill", "call", "reuse"]);
      const sites = mapObject(
        drill({ node, path, meta: metas.drill }, ["tag", "quasi"]),
        "quasi",
        (site) => {
          const sites = mapObject(
            drill(site, ["quasis", "expressions"]),
            "quasis",
            splitSite,
          );
          return {
            quasis: {
              car: drillArray(sites.quasis.car),
              cdr: drillArray(sites.quasis.cdr),
            },
            expressions: drillArray(sites.expressions),
          };
        },
      );
      return sequenceCondition(
        mapSequence(unbuildCallee(sites.tag, context, {}), (callee) =>
          makeCallExpression({ path, meta: metas.call }, context, {
            callee,
            argument_list: {
              type: "spread",
              values: [
                // For any particular tagged template literal expression, the tag
                // function will always be called with the exact same literal array,
                // no matter how many times the literal is evaluated.
                // -- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates
                makeConditionalExpression(
                  makeApplyExpression(
                    makeIntrinsicExpression("Object.hasOwn", path),
                    makePrimitiveExpression({ undefined: null }, path),
                    [
                      makeIntrinsicExpression("aran.templates", path),
                      makePrimitiveExpression(
                        `${context.base}#${String(meta)}`,
                        path,
                      ),
                    ],
                    path,
                  ),
                  makeGetExpression(
                    makeIntrinsicExpression("aran.templates", path),
                    makePrimitiveExpression(
                      `${context.base}#${String(meta)}`,
                      path,
                    ),
                    path,
                  ),
                  makeSetExpression(
                    context.mode,
                    makeIntrinsicExpression("aran.templates", path),
                    makePrimitiveExpression(
                      `${context.base}#${String(meta)}`,
                      path,
                    ),
                    makeApplyExpression(
                      makeIntrinsicExpression("Object.freeze", path),
                      makePrimitiveExpression({ undefined: null }, path),
                      [
                        makeApplyExpression(
                          makeIntrinsicExpression(
                            "Object.defineProperty",
                            path,
                          ),
                          makePrimitiveExpression({ undefined: null }, path),
                          [
                            makeArrayExpression(
                              map(sites.quasi.quasis.car, (site) =>
                                unbuildQuasi(site, context, { cooked: true }),
                              ),
                              path,
                            ),
                            makePrimitiveExpression("raw", path),
                            makeDataDescriptorExpression(
                              {
                                value: makeApplyExpression(
                                  makeIntrinsicExpression(
                                    "Object.freeze",
                                    path,
                                  ),
                                  makePrimitiveExpression(
                                    { undefined: null },
                                    path,
                                  ),
                                  [
                                    makeArrayExpression(
                                      map(sites.quasi.quasis.cdr, (site) =>
                                        unbuildQuasi(site, context, {
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
                    path,
                  ),
                  path,
                ),
                ...map(sites.quasi.expressions, (site) =>
                  unbuildExpression(site, context, {}),
                ),
              ],
            },
          }),
        ),
        path,
      );
    }
    case "ThisExpression": {
      return makeReadThisExpression({ path }, context);
    }
    case "MetaProperty": {
      if (node.meta.name === "new" && node.property.name === "target") {
        return makeReadNewTargetExpression({ path }, context);
      } else if (node.meta.name === "import" && node.property.name === "meta") {
        return makeReadImportMetaExpression({ path }, context);
      } else {
        return makeSyntaxErrorExpression(
          `Illegal meta property: '${node.meta.name}.${node.property.name}'`,
          path,
        );
      }
    }
    case "Identifier": {
      return makeScopeReadExpression({ path, meta }, context, {
        variable: /** @type {estree.Variable} */ (node.name),
      });
    }
    case "ArrowFunctionExpression": {
      return unbuildFunction({ node, path, meta }, context, {
        type: "arrow",
        name: makePrimitiveExpression("", path),
      });
    }
    case "FunctionExpression": {
      return unbuildFunction({ node, path, meta }, context, {
        type: "function",
        name: makePrimitiveExpression(
          node.id == null ? "" : node.id.name,
          path,
        ),
      });
    }
    case "ClassExpression": {
      return unbuildClass({ node, path, meta }, context, {
        name: makePrimitiveExpression(
          node.id == null ? "" : node.id.name,
          path,
        ),
      });
    }
    case "AssignmentExpression": {
      const metas = splitMeta(meta, [
        "drill",
        "right",
        "old_value",
        "new_value",
      ]);
      const sites = drill({ node, path, meta: metas.drill }, ["left", "right"]);
      if (node.operator === "=") {
        // > (console.log('foo') = 123);
        // foo
        // Uncaught ReferenceError: Invalid left-hand side in assignment
        if (isCallExpressionSite(sites.left)) {
          return makeSequenceExpression(
            unbuildEffect(sites.left, context, {}),
            makeThrowErrorExpression(
              "ReferenceError",
              "Invalid left-hand side in assignment",
              path,
            ),
            path,
          );
        } else {
          return sequenceExpression(
            bindSequence(
              cacheConstant(
                metas.right,
                unbuildExpression(sites.right, context, {}),
                path,
              ),
              (right) =>
                initSequence(
                  unbuildWritePatternEffect(sites.left, context, {
                    right: makeReadCacheExpression(right, path),
                  }),
                  makeReadCacheExpression(right, path),
                ),
            ),
            path,
          );
        }
      } else {
        return sequenceExpression(
          bindSequence(
            unbuildUpdateLeft(sites.left, context, {}),
            ({ name, old_value, update }) => {
              const proceed = () =>
                sequenceExpression(
                  bindSequence(
                    cacheConstant(
                      metas.new_value,
                      name === null
                        ? unbuildExpression(sites.right, context, {})
                        : // eslint-disable-next-line no-use-before-define
                          unbuildVariableNameExpression(sites.right, context, {
                            name,
                          }),
                      path,
                    ),
                    (new_value) =>
                      initSequence(
                        update(
                          context,
                          makeReadCacheExpression(new_value, path),
                        ),
                        makeReadCacheExpression(new_value, path),
                      ),
                  ),
                  path,
                );
              switch (node.operator) {
                case "??=": {
                  return mapSequence(
                    cacheConstant(metas.old_value, old_value, path),
                    (old_value) =>
                      makeConditionalExpression(
                        makeBinaryExpression(
                          "==",
                          makeReadCacheExpression(old_value, path),
                          makePrimitiveExpression(null, path),
                          path,
                        ),
                        proceed(),
                        makeReadCacheExpression(old_value, path),
                        path,
                      ),
                  );
                }
                case "||=": {
                  return mapSequence(
                    cacheConstant(metas.old_value, old_value, path),
                    (old_value) =>
                      makeConditionalExpression(
                        makeReadCacheExpression(old_value, path),
                        makeReadCacheExpression(old_value, path),
                        proceed(),
                        path,
                      ),
                  );
                }
                case "&&=": {
                  return mapSequence(
                    cacheConstant(metas.old_value, old_value, path),
                    (old_value) =>
                      makeConditionalExpression(
                        makeReadCacheExpression(old_value, path),
                        proceed(),
                        makeReadCacheExpression(old_value, path),
                        path,
                      ),
                  );
                }
                default: {
                  return bindSequence(
                    cacheConstant(
                      metas.new_value,
                      makeBinaryExpression(
                        toAssignmentBinaryOperator(node.operator),
                        old_value,
                        unbuildExpression(sites.right, context, {}),
                        path,
                      ),
                      path,
                    ),
                    (new_value) =>
                      initSequence(
                        update(
                          context,
                          makeReadCacheExpression(new_value, path),
                        ),
                        makeReadCacheExpression(new_value, path),
                      ),
                  );
                }
              }
            },
          ),
          path,
        );
      }
    }
    case "UpdateExpression": {
      const metas = splitMeta(meta, [
        "drill",
        "update",
        "raw_old_value",
        "old_value",
        "new_value",
      ]);
      const sites = drill({ node, path, meta }, ["argument"]);
      return sequenceExpression(
        bindSequence(
          unbuildUpdateLeft(sites.argument, context, {}),
          ({ old_value: raw_old_value, update }) =>
            bindSequence(
              cacheConstant(metas.raw_old_value, raw_old_value, path),
              (raw_old_value) =>
                bindSequence(
                  cacheConstant(
                    metas.old_value,
                    makeConvertNumberExpression(raw_old_value, path),
                    path,
                  ),
                  (old_value) => {
                    const new_value = makeBinaryExpression(
                      toUpdateBinaryOperator(node.operator),
                      makeReadCacheExpression(old_value, path),
                      makeOneExpression(
                        makeReadCacheExpression(old_value, path),
                        path,
                      ),
                      path,
                    );
                    return node.prefix
                      ? bindSequence(
                          cacheConstant(metas.new_value, new_value, path),
                          (new_value) =>
                            initSequence(
                              update(
                                context,
                                makeReadCacheExpression(new_value, path),
                              ),
                              makeReadCacheExpression(new_value, path),
                            ),
                        )
                      : initSequence(
                          update(context, new_value),
                          makeReadCacheExpression(old_value, path),
                        );
                  },
                ),
            ),
        ),
        path,
      );
    }
    case "UnaryExpression": {
      const metas = splitMeta(meta, ["drill", "typeof"]);
      const sites = drill({ node, path, meta: metas.drill }, ["argument"]);
      switch (node.operator) {
        case "typeof": {
          return node.argument.type === "Identifier"
            ? makeScopeTypeofExpression({ path, meta: metas.typeof }, context, {
                variable: /** @type {estree.Variable} */ (node.argument.name),
              })
            : makeUnaryExpression(
                node.operator,
                unbuildExpression(sites.argument, context, {}),
                path,
              );
        }
        case "delete": {
          return unbuildDeleteArgument(sites.argument, context, {});
        }
        default: {
          return makeUnaryExpression(
            node.operator,
            unbuildExpression(sites.argument, context, {
              meta,
            }),
            path,
          );
        }
      }
    }
    case "BinaryExpression": {
      const sites = drill({ node, path, meta }, ["left", "right"]);
      if (
        node.operator === "in" &&
        /** @type {estree.Expression | estree.PrivateIdentifier} */ (node.left)
          .type === "PrivateIdentifier"
      ) {
        return sequenceExpression(
          mapSequence(
            cacheConstant(
              sites.left.meta,
              unbuildExpression(sites.right, context, {}),
              path,
            ),
            (target) =>
              makeHasPrivateExpression({ path }, context, {
                target,
                key: /** @type {estree.PrivateKey} */ (
                  /** @type {estree.PrivateIdentifier} */ (
                    /** @type {unknown} */ (node.left)
                  ).name
                ),
              }),
          ),
          path,
        );
      } else {
        const sites = drill({ node, path, meta }, ["left", "right"]);
        return makeBinaryExpression(
          node.operator,
          unbuildExpression(sites.left, context, {}),
          unbuildExpression(sites.right, context, {}),
          path,
        );
      }
    }
    case "SequenceExpression": {
      const sites = mapObject(
        drill({ node, path, meta }, ["expressions"]),
        "expressions",
        drillArray,
      );
      return makeSequenceExpression(
        flatMap(
          slice(sites.expressions, 0, sites.expressions.length - 1),
          (site) => unbuildEffect(site, context, {}),
        ),
        unbuildExpression(
          sites.expressions[sites.expressions.length - 1],
          context,
          {},
        ),
        path,
      );
    }
    case "ConditionalExpression": {
      const sites = drill({ node, path, meta }, [
        "test",
        "consequent",
        "alternate",
      ]);
      return makeConditionalExpression(
        unbuildExpression(sites.test, context, {}),
        unbuildExpression(sites.consequent, context, {}),
        unbuildExpression(sites.alternate, context, {}),
        path,
      );
    }
    case "LogicalExpression": {
      const metas = splitMeta(meta, ["drill", "left"]);
      const sites = drill({ node, path, meta: metas.drill }, ["left", "right"]);
      return sequenceExpression(
        mapSequence(
          cacheConstant(
            metas.left,
            unbuildExpression(sites.left, context, {}),
            path,
          ),
          (left) => {
            switch (node.operator) {
              case "&&": {
                return makeConditionalExpression(
                  makeReadCacheExpression(left, path),
                  unbuildExpression(sites.right, context, {}),
                  makeReadCacheExpression(left, path),
                  path,
                );
              }
              case "||": {
                return makeConditionalExpression(
                  makeReadCacheExpression(left, path),
                  makeReadCacheExpression(left, path),
                  unbuildExpression(sites.right, context, {}),
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
                  unbuildExpression(sites.right, context, {}),
                  makeReadCacheExpression(left, path),
                  path,
                );
              }
              default: {
                throw new AranTypeError("Invalid logical operator", node);
              }
            }
          },
        ),
        path,
      );
    }
    case "AwaitExpression": {
      const sites = drill({ node, path, meta }, ["argument"]);
      return makeAwaitExpression(
        unbuildExpression(sites.argument, context, {}),
        path,
      );
    }
    case "YieldExpression": {
      const sites = drill({ node, path, meta }, ["argument"]);
      return makeYieldExpression(
        node.delegate,
        isNotNullishSite(sites.argument)
          ? unbuildExpression(sites.argument, context, {
              meta,
            })
          : makePrimitiveExpression({ undefined: null }, path),
        path,
      );
    }
    case "CallExpression": {
      const metas = splitMeta(meta, [
        "drill",
        "arguments",
        "eval",
        "eval_read_1",
        "eval_read_2",
        "call",
      ]);
      const sites = mapObject(
        drill({ node, path, meta: metas.drill }, ["callee", "arguments"]),
        "arguments",
        drillArray,
      );
      if (node.optional) {
        return makeSyntaxErrorExpression(
          "Illegal optional call outside of chain expression",
          path,
        );
      } else {
        if (
          sites.callee.node.type === "Identifier" &&
          sites.callee.node.name === "eval" &&
          sites.arguments.length > 1 &&
          every(sites.arguments, isNotSpreadElementSite)
        ) {
          return sequenceExpression(
            mapSequence(
              flatSequence(
                map(sites.arguments, ({ node, path, meta }) => {
                  const metas = splitMeta(meta, ["unbuild", "cache"]);
                  return cacheConstant(
                    metas.cache,
                    unbuildExpression(
                      { node, path, meta: metas.unbuild },
                      context,
                      {},
                    ),
                    path,
                  );
                }),
              ),
              (arguments_) =>
                makeConditionalExpression(
                  makeBinaryExpression(
                    "===",
                    makeScopeReadExpression(
                      { path, meta: metas.eval },
                      context,
                      { variable: /** @type {estree.Variable} */ ("eval") },
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
                      { path, meta: metas.eval_read_2 },
                      context,
                      { variable: /** @type {estree.Variable} */ ("eval") },
                    ),
                    makePrimitiveExpression({ undefined: null }, path),
                    map(arguments_, (cache) =>
                      makeReadCacheExpression(cache, path),
                    ),
                    path,
                  ),
                  path,
                ),
            ),
            path,
          );
        } else {
          return sequenceCondition(
            mapSequence(unbuildCallee(sites.callee, context, {}), (callee) =>
              makeCallExpression({ path, meta: metas.call }, context, {
                callee,
                argument_list: unbuildArgumentList(sites.arguments, context, {
                  path,
                }),
              }),
            ),
            path,
          );
        }
      }
    }
    case "ArrayExpression": {
      const sites = mapObject(
        drill({ node, path, meta }, ["elements"]),
        "elements",
        drillArray,
      );
      if (
        every(sites.elements, isNotNullishSite) &&
        every(sites.elements, isNotSpreadElementSite)
      ) {
        return makeArrayExpression(
          map(sites.elements, (site) => unbuildExpression(site, context, {})),
          path,
        );
      } else {
        return makeApplyExpression(
          makeIntrinsicExpression("Array.prototype.concat", path),
          makeArrayExpression([], path),
          map(sites.elements, ({ node, path, meta }) =>
            node != null
              ? unbuildSpreadable({ node, path, meta }, context, {})
              : // Array(1) is vulnerable to pollution of
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
                ),
          ),
          path,
        );
      }
    }
    case "ImportExpression": {
      const sites = drill({ node, path, meta }, ["source"]);
      return makeApplyExpression(
        makeReadImportExpression({ path }, context),
        makePrimitiveExpression({ undefined: null }, path),
        [unbuildExpression(sites.source, context, {})],
        path,
      );
    }
    case "NewExpression": {
      const sites = mapObject(
        drill({ node, path, meta }, ["callee", "arguments"]),
        "arguments",
        drillArray,
      );
      if (isNotSuperSite(sites.callee)) {
        if (every(sites.arguments, isNotSpreadElementSite)) {
          return makeConstructExpression(
            unbuildExpression(sites.callee, context, {}),
            map(sites.arguments, (site) =>
              unbuildExpression(site, context, {}),
            ),
            path,
          );
        } else {
          return makeApplyExpression(
            makeIntrinsicExpression("Reflect.construct", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              unbuildExpression(sites.callee, context, {}),
              makeApplyExpression(
                makeIntrinsicExpression("Array.prototype.concat", path),
                makeArrayExpression([], path),
                map(sites.arguments, (site) =>
                  unbuildSpreadable(site, context, {}),
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
      const sites = drill({ node, path, meta }, ["expression"]);
      return sequenceCondition(
        unbuildChainElement(sites.expression, context, {}),
        path,
      );
    }
    case "MemberExpression": {
      if (isNotOptionalMemberExpression(node)) {
        return sequenceExpression(
          mapSequence(
            unbuildMember({ node, path, meta }, context, { object: false }),
            ({ member }) => member,
          ),
          path,
        );
      } else {
        return makeSyntaxErrorExpression(
          "Illegal optional member outside of chain expression",
          path,
        );
      }
    }
    case "ObjectExpression": {
      const metas = splitMeta(meta, ["drill", "self"]);
      const sites = mapObject(
        drill({ node, path, meta: metas.drill }, ["properties"]),
        "properties",
        (site) => unbuildPrototype(drillArray(site), context, { path }),
      );
      if (
        every(sites.properties.tail, isInitPropertySite) &&
        !some(sites.properties.tail, isProtoPropertySite)
      ) {
        if (some(sites.properties.tail, isMethodPropertySite)) {
          // ts shenanigans: preserve type narrowing through callback
          const sites_properties_tail = sites.properties.tail;
          return sequenceExpression(
            mapSequence(
              cacheSelf(
                metas.self,
                (self) =>
                  makeObjectExpression(
                    sites.properties.head,
                    map(sites_properties_tail, (site) =>
                      makeUglyProperty(
                        unbuildInitProperty(site, context, { self }),
                        path,
                      ),
                    ),
                    path,
                  ),
                path,
              ),
              (self) => makeReadCacheExpression(self, path),
            ),
            path,
          );
        } else {
          return makeObjectExpression(
            sites.properties.head,
            map(sites.properties.tail, (site) =>
              makeUglyProperty(
                unbuildInitProperty(site, context, { self: null }),
                path,
              ),
            ),
            path,
          );
        }
      } else {
        return sequenceExpression(
          bindSequence(
            cacheConstant(
              metas.self,
              makeObjectExpression(sites.properties.head, [], path),
              path,
            ),
            (self) =>
              initSequence(
                flatMap(sites.properties.tail, (site) =>
                  unbuildProperty(site, context, { self }),
                ),
                makeReadCacheExpression(self, path),
              ),
          ),
          path,
        );
      }
    }
    default: {
      throw new AranTypeError("invalid expression node", node);
    }
  }
};

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.Expression>,
 *   context: import("../context.js").Context,
 *   options: {
 *     name: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildVariableNameExpression = (
  { node, path, meta },
  context,
  { name },
) => {
  switch (node.type) {
    case "ArrowFunctionExpression": {
      return unbuildFunction({ node, path, meta }, context, {
        type: "arrow",
        name: makePrimitiveExpression(name, path),
      });
    }
    case "FunctionExpression": {
      return unbuildFunction({ node, path, meta }, context, {
        type: "function",
        name: makePrimitiveExpression(name, path),
      });
    }
    case "ClassExpression": {
      return unbuildClass({ node, path, meta }, context, {
        name: makePrimitiveExpression(name, path),
      });
    }
    default: {
      return unbuildExpression({ node, path, meta }, context, {});
    }
  }
};

/**
 * @type {(
 *   site: import("../site.mjs").Site<(
 *     | estree.ArrowFunctionExpression
 *     | estree.FunctionExpression & { id: null | undefined }
 *     | estree.ClassExpression & { id: null | undefined }
 *   )>,
 *   context: import("../context.js").Context,
 *   options: {
 *     name: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildNameExpression = (
  { node, path, meta },
  context,
  { name },
) => {
  switch (node.type) {
    case "ArrowFunctionExpression": {
      return unbuildFunction({ node, path, meta }, context, {
        type: "arrow",
        name,
      });
    }
    case "FunctionExpression": {
      return unbuildFunction({ node, path, meta }, context, {
        type: "function",
        name,
      });
    }
    case "ClassExpression": {
      return unbuildClass({ node, path, meta }, context, {
        name,
      });
    }
    default: {
      throw new AranTypeError("invalid name node", node);
    }
  }
};
