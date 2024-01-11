import {
  map,
  hasOwn,
  every,
  mapIndex,
  flatMapIndex,
  findLastIndex,
} from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import {
  concatEffect,
  makeApplyExpression,
  makeAwaitExpression,
  makeConditionalExpression,
  makeConstructExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeSequenceExpression,
  makeYieldExpression,
} from "../node.mjs";
import {
  makeArrayExpression,
  makeBinaryExpression,
  makeDataDescriptorExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
} from "../intrinsic.mjs";
import { unbuildEffect } from "./effect.mjs";
import {
  listSaveUpdateEffect,
  makeLoadUpdateExpression,
  unbuildUpdateLeft,
} from "./update.mjs";
import { makeEarlyErrorExpression } from "../early-error.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildSpreadable } from "./spreadable.mjs";
import { unbuildQuasi } from "./quasi.mjs";
import {
  isProtoProperty,
  unbuildInitProperty,
  unbuildProperty,
} from "./property.mjs";
import { unbuildClass } from "./class.mjs";
import { unbuildDeleteArgument } from "./delete.mjs";
import { makeReadCacheExpression, cacheConstant } from "../cache.mjs";
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
  bindTwoSequence,
  flatSequence,
  prependSequence,
  sequenceChain,
} from "../sequence.mjs";
import { drillDeepSite, drillSite, drillVeryDeepSite } from "../site.mjs";
import { forkMeta, nextMeta, packMeta } from "../meta.mjs";
import { unbuildChainCallee } from "./callee.mjs";
import {
  getMode,
  listScopeSaveEffect,
  makeScopeLoadExpression,
  packScope,
} from "../scope/index.mjs";
import { unbuildPattern } from "./pattern.mjs";
import { unbuildObject } from "./object.mjs";
import { unbuildKey } from "./key.mjs";
import { makeGetMemberExpression } from "../member.mjs";
import { makeContextPrelude } from "../prelude.mjs";

/**
 * @type {(
 *   node: estree.Expression | estree.SpreadElement,
 * ) => node is estree.Expression}
 */
const isExpressionArgument = (node) => node.type !== "SpreadElement";

/**
 * @type {(
 *   node: estree.CallExpression
 * ) => node is estree.CallExpression & {
 *   callee: {
 *     type: "Identifier",
 *     name: "eval",
 *   },
 *   arguments: estree.Expression[],
 * }}
 */
const isDirectEvalCall = (node) =>
  node.callee.type === "Identifier" &&
  node.callee.name === "eval" &&
  node.arguments.length > 0 &&
  every(node.arguments, isExpressionArgument);

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.Expression
 *     | estree.SpreadElement
 *     | null
 *     | undefined
 *   ),
 * >) => site is import("../site").Site<(
 *   | estree.Expression
 *   | estree.SpreadElement
 * )>}
 */
const isNotNullishItemSite = (site) => site.node != null;

/**
 * @type {(
 *   node: estree.Property | estree.SpreadElement,
 * ) => node is estree.Property & { kind: "init" }}
 */
const isInitProperty = (node) =>
  node.type === "Property" && node.kind === "init";

/**
 * @type {(
 *   node: estree.ObjectExpression,
 * ) => node is estree.ObjectExpression & {
 *   properties: (estree.Property & {
 *     kind: "init",
 *     method: false,
 *   })[],
 * }}
 */
const isInitObject = (node) => {
  if (!every(node.properties, isInitProperty)) {
    return false;
  }
  const index = findLastIndex(node.properties, isProtoProperty);
  return index === -1 || index === 0;
};

/**
 * @type {(
 *   node: estree.NewExpression
 * ) => node is estree.NewExpression & {
 *   callee: estree.Expression,
 * }}
 */
const isNotSuperNew = (node) => node.callee.type !== "Super";

/**
 * @type {(
 *   node: (
 *     | estree.SpreadElement
 *     | estree.Expression
 *     | null
 *     | undefined
 *   ),
 * ) => node is estree.Expression}
 */
const isItemRegular = (node) => node != null && node.type !== "SpreadElement";

/**
 * @type {(
 *   node: estree.ArrayExpression,
 * ) => node is estree.ArrayExpression & {
 *   elements: estree.Expression[],
 * }}
 */
const isArrayRegular = (node) => every(node.elements, isItemRegular);

/**
 * @type {(
 *   node: estree.SpreadElement | estree.Expression
 * ) => node is estree.Expression}
 */
const isNotSpreadArgument = (node) => node.type !== "SpreadElement";

/**
 * @type {(
 *   node: estree.NewExpression & {
 *     callee: estree.Expression,
 *   },
 * ) => node is estree.NewExpression & {
 *   callee: estree.Expression,
 *   arguments: estree.Expression[],
 * }}
 */
const isNotSpreadNew = (node) => every(node.arguments, isNotSpreadArgument);

/**
 * @type {(
 *   node: estree.YieldExpression
 * ) => node is estree.YieldExpression & {
 *   argument: estree.Expression,
 * }}
 */
const hasYieldArgument = (node) => node.argument != null;

/**
 * @type {(
 *   site: import("../site").Site<estree.Expression>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../sequence.js").ExpressionSequence}
 */
export const unbuildExpression = ({ node, path, meta }, scope, _options) => {
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
        return makeEarlyErrorExpression(
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
            ...flatMapIndex(node.expressions.length, (index) => [
              unbuildQuasi(
                drillDeepSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "quasis",
                  index,
                ),
                scope,
                { cooked: true },
              ),
              unbuildExpression(
                drillDeepSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "expressions",
                  index,
                ),
                scope,
                null,
              ),
            ]),
            unbuildQuasi(
              drillDeepSite(
                node,
                path,
                forkMeta((meta = nextMeta(meta))),
                "quasis",
                node.quasis.length - 1,
              ),
              scope,
              { cooked: true },
            ),
          ],
          path,
        );
      }
    }
    // Tagged template cannot lead to a direct eval call because it receives an array instead of a string:
    // cf: https://www.ecma-international.org/ecma-262/10.0/index.html#sec-performeval
    case "TaggedTemplateExpression": {
      return sequenceChain(
        bindSequence(
          unbuildChainCallee(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "tag"),
            scope,
            null,
          ),
          (callee) =>
            makeCallExpression(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              scope,
              {
                callee,
                argument_list: {
                  type: "spread",
                  values: [
                    // For any particular tagged template literal expression, the tag
                    // function will always be called with the exact same literal array,
                    // no matter how many times the literal is evaluated.
                    // -- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates
                    makeConditionalExpression(
                      makeScopeLoadExpression(
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        scope,
                        {
                          type: "has-template",
                          mode: getMode(scope),
                          path,
                        },
                      ),
                      makeScopeLoadExpression(
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        scope,
                        {
                          type: "get-template",
                          mode: getMode(scope),
                          path,
                        },
                      ),
                      bindSequence(
                        cacheConstant(
                          forkMeta((meta = nextMeta(meta))),
                          makeApplyExpression(
                            makeIntrinsicExpression("Object.freeze", path),
                            makePrimitiveExpression({ undefined: null }, path),
                            [
                              makeApplyExpression(
                                makeIntrinsicExpression(
                                  "Object.defineProperty",
                                  path,
                                ),
                                makePrimitiveExpression(
                                  { undefined: null },
                                  path,
                                ),
                                [
                                  makeArrayExpression(
                                    mapIndex(
                                      node.quasi.quasis.length,
                                      (index) =>
                                        unbuildQuasi(
                                          drillVeryDeepSite(
                                            node,
                                            path,
                                            forkMeta((meta = nextMeta(meta))),
                                            "quasi",
                                            "quasis",
                                            index,
                                          ),
                                          scope,
                                          { cooked: true },
                                        ),
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
                                            mapIndex(
                                              node.quasi.quasis.length,
                                              (index) =>
                                                unbuildQuasi(
                                                  drillVeryDeepSite(
                                                    node,
                                                    path,
                                                    forkMeta(
                                                      (meta = nextMeta(meta)),
                                                    ),
                                                    "quasi",
                                                    "quasis",
                                                    index,
                                                  ),
                                                  scope,
                                                  { cooked: false },
                                                ),
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
                        (template) =>
                          makeSequenceExpression(
                            listScopeSaveEffect(
                              {
                                path,
                                meta: forkMeta((meta = nextMeta(meta))),
                              },
                              scope,
                              {
                                type: "set-template",
                                mode: getMode(scope),
                                path,
                                template,
                              },
                            ),
                            makeReadCacheExpression(template, path),
                            path,
                          ),
                      ),
                      path,
                    ),
                    ...mapIndex(node.quasi.expressions.length, (index) =>
                      unbuildExpression(
                        drillVeryDeepSite(
                          node,
                          path,
                          forkMeta((meta = nextMeta(meta))),
                          "quasi",
                          "expressions",
                          index,
                        ),
                        scope,
                        null,
                      ),
                    ),
                  ],
                },
              },
            ),
        ),
        path,
      );
    }
    case "ThisExpression": {
      return makeScopeLoadExpression({ path, meta }, scope, {
        type: "read-this",
        mode: getMode(scope),
      });
    }
    case "MetaProperty": {
      if (node.meta.name === "new" && node.property.name === "target") {
        return makeScopeLoadExpression({ path, meta }, scope, {
          type: "read-new-target",
          mode: getMode(scope),
        });
      } else if (node.meta.name === "import" && node.property.name === "meta") {
        return makeScopeLoadExpression({ path, meta }, scope, {
          type: "read-import-meta",
          mode: getMode(scope),
        });
      } else {
        return makeEarlyErrorExpression(
          `Illegal meta property: '${node.meta.name}.${node.property.name}'`,
          path,
        );
      }
    }
    case "Identifier": {
      return makeScopeLoadExpression({ path, meta }, scope, {
        type: "read",
        mode: getMode(scope),
        variable: /** @type {estree.Variable} */ (node.name),
      });
    }
    case "ArrowFunctionExpression": {
      return unbuildFunction({ node, path, meta }, scope, {
        type: "arrow",
        name: { type: "anonymous" },
      });
    }
    case "FunctionExpression": {
      return unbuildFunction({ node, path, meta }, scope, {
        type: "function",
        name:
          node.id == null
            ? { type: "anonymous" }
            : {
                type: "assignment",
                variable: /** @type {estree.Variable} */ (node.id.name),
              },
      });
    }
    case "ClassExpression": {
      return unbuildClass({ node, path, meta }, scope, {
        name:
          node.id == null
            ? { type: "anonymous" }
            : {
                type: "assignment",
                variable: /** @type {estree.Variable} */ (node.id.name),
              },
      });
    }
    case "AssignmentExpression": {
      /** @type {import("../name").Name} */
      const name =
        node.left.type === "Identifier"
          ? {
              type: "assignment",
              variable: /** @type {estree.Variable} */ (node.left.name),
            }
          : { type: "anonymous" };
      if (node.operator === "=") {
        // > (console.log('foo') = 123);
        // foo
        // Uncaught ReferenceError: Invalid left-hand side in assignment
        if (/** @type {any} */ (node).left.type === "CallExpression") {
          return makeSequenceExpression(
            unbuildEffect(
              drillSite(
                /** @type {{left: estree.Expression}} */ (node),
                path,
                forkMeta((meta = nextMeta(meta))),
                "left",
              ),
              scope,
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
          return bindSequence(
            cacheConstant(
              forkMeta((meta = nextMeta(meta))),
              // eslint-disable-next-line no-use-before-define
              unbuildNameExpression(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "right",
                ),
                scope,
                { name },
              ),
              path,
            ),
            (right) =>
              makeSequenceExpression(
                unbuildPattern(
                  drillSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "left",
                  ),
                  scope,
                  { kind: null, right },
                ),
                makeReadCacheExpression(right, path),
                path,
              ),
          );
        }
      } else {
        return bindSequence(
          unbuildUpdateLeft(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "left"),
            scope,
            null,
          ),
          (update) => {
            /**
             * @type {() => import("../sequence").ExpressionSequence}
             */
            const load = () =>
              makeLoadUpdateExpression(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                { update },
              );
            /**
             * @type {() => import("../sequence").ExpressionSequence}
             */
            const increment = () =>
              // eslint-disable-next-line no-use-before-define
              unbuildNameExpression(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "right",
                ),
                scope,
                { name },
              );
            /**
             * @type {(
             *   node: import("../sequence").ExpressionSequence,
             * ) => import("../sequence").ExpressionSequence}
             */
            const save = (node) =>
              bindSequence(
                cacheConstant(forkMeta((meta = nextMeta(meta))), node, path),
                (new_value) =>
                  makeSequenceExpression(
                    listSaveUpdateEffect(
                      { path, meta: forkMeta((meta = nextMeta(meta))) },
                      scope,
                      { update, new_value },
                    ),
                    makeReadCacheExpression(new_value, path),
                    path,
                  ),
              );
            switch (node.operator) {
              case "??=": {
                return bindSequence(
                  cacheConstant(
                    forkMeta((meta = nextMeta(meta))),
                    load(),
                    path,
                  ),
                  (old_value) =>
                    makeConditionalExpression(
                      makeBinaryExpression(
                        "==",
                        makeReadCacheExpression(old_value, path),
                        makePrimitiveExpression(null, path),
                        path,
                      ),
                      save(increment()),
                      makeReadCacheExpression(old_value, path),
                      path,
                    ),
                );
              }
              case "||=": {
                return bindSequence(
                  cacheConstant(
                    forkMeta((meta = nextMeta(meta))),
                    load(),
                    path,
                  ),
                  (old_value) =>
                    makeConditionalExpression(
                      makeReadCacheExpression(old_value, path),
                      makeReadCacheExpression(old_value, path),
                      save(increment()),
                      path,
                    ),
                );
              }
              case "&&=": {
                return bindSequence(
                  cacheConstant(
                    forkMeta((meta = nextMeta(meta))),
                    load(),
                    path,
                  ),
                  (old_value) =>
                    makeConditionalExpression(
                      makeReadCacheExpression(old_value, path),
                      save(increment()),
                      makeReadCacheExpression(old_value, path),
                      path,
                    ),
                );
              }
              default: {
                return bindSequence(
                  cacheConstant(
                    forkMeta((meta = nextMeta(meta))),
                    makeBinaryExpression(
                      toAssignmentBinaryOperator(node.operator),
                      load(),
                      increment(),
                      path,
                    ),
                    path,
                  ),
                  (new_value) =>
                    makeSequenceExpression(
                      listSaveUpdateEffect(
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        scope,
                        { update, new_value },
                      ),
                      makeReadCacheExpression(new_value, path),
                      path,
                    ),
                );
              }
            }
          },
        );
      }
    }
    case "UpdateExpression": {
      return bindSequence(
        unbuildUpdateLeft(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "argument"),
          scope,
          null,
        ),
        (update) =>
          bindSequence(
            cacheConstant(
              forkMeta((meta = nextMeta(meta))),
              makeLoadUpdateExpression({ path, meta }, scope, { update }),
              path,
            ),
            (raw_old_value) =>
              bindSequence(
                cacheConstant(
                  forkMeta((meta = nextMeta(meta))),
                  makeConvertNumberExpression(raw_old_value, path),
                  path,
                ),
                (old_value) =>
                  bindSequence(
                    cacheConstant(
                      forkMeta((meta = nextMeta(meta))),
                      makeBinaryExpression(
                        toUpdateBinaryOperator(node.operator),
                        makeReadCacheExpression(old_value, path),
                        makeOneExpression(
                          makeReadCacheExpression(old_value, path),
                          path,
                        ),
                        path,
                      ),
                      path,
                    ),
                    (new_value) =>
                      makeSequenceExpression(
                        listSaveUpdateEffect(
                          { path, meta: forkMeta((meta = nextMeta(meta))) },
                          scope,
                          { update, new_value },
                        ),
                        node.prefix
                          ? makeReadCacheExpression(new_value, path)
                          : makeReadCacheExpression(old_value, path),
                        path,
                      ),
                  ),
              ),
          ),
      );
    }
    case "UnaryExpression": {
      switch (node.operator) {
        case "typeof": {
          if (node.argument.type === "Identifier") {
            return makeScopeLoadExpression(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              scope,
              {
                type: "typeof",
                mode: getMode(scope),
                variable: /** @type {estree.Variable} */ (node.argument.name),
              },
            );
          } else {
            return makeUnaryExpression(
              node.operator,
              unbuildExpression(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "argument",
                ),
                scope,
                null,
              ),
              path,
            );
          }
        }
        case "delete": {
          return unbuildDeleteArgument(
            drillSite(
              node,
              path,
              forkMeta((meta = nextMeta(meta))),
              "argument",
            ),
            scope,
            null,
          );
        }
        default: {
          return makeUnaryExpression(
            node.operator,
            unbuildExpression(
              drillSite(
                node,
                path,
                forkMeta((meta = nextMeta(meta))),
                "argument",
              ),
              scope,
              null,
            ),
            path,
          );
        }
      }
    }
    case "BinaryExpression": {
      if (
        node.operator === "in" &&
        /** @type {any} */ (node.left).type === "PrivateIdentifier"
      ) {
        return bindSequence(
          cacheConstant(
            forkMeta((meta = nextMeta(meta))),
            unbuildExpression(
              drillSite(node, path, forkMeta((meta = nextMeta(meta))), "right"),
              scope,
              null,
            ),
            path,
          ),
          (target) =>
            makeScopeLoadExpression(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              scope,
              {
                type: "has-private",
                mode: getMode(scope),
                target,
                key: /** @type {estree.PrivateKey} */ (
                  /** @type {estree.PrivateIdentifier} */ (
                    /** @type {unknown} */ (node.left)
                  ).name
                ),
              },
            ),
        );
      } else {
        return makeBinaryExpression(
          node.operator,
          unbuildExpression(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "left"),
            scope,
            null,
          ),
          unbuildExpression(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "right"),
            scope,
            null,
          ),
          path,
        );
      }
    }
    case "SequenceExpression": {
      return makeSequenceExpression(
        concatEffect(
          mapIndex(node.expressions.length - 1, (index) =>
            unbuildEffect(
              drillDeepSite(node, path, meta, "expressions", index),
              scope,
              null,
            ),
          ),
        ),
        unbuildExpression(
          drillDeepSite(
            node,
            path,
            forkMeta((meta = nextMeta(meta))),
            "expressions",
            node.expressions.length - 1,
          ),
          scope,
          null,
        ),
        path,
      );
    }
    case "ConditionalExpression": {
      return makeConditionalExpression(
        unbuildExpression(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "test"),
          scope,
          null,
        ),
        unbuildExpression(
          drillSite(
            node,
            path,
            forkMeta((meta = nextMeta(meta))),
            "consequent",
          ),
          scope,
          null,
        ),
        unbuildExpression(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "alternate"),
          scope,
          null,
        ),
        path,
      );
    }
    case "LogicalExpression": {
      return bindSequence(
        cacheConstant(
          forkMeta((meta = nextMeta(meta))),
          unbuildExpression(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "left"),
            scope,
            null,
          ),
          path,
        ),
        (left) => {
          switch (node.operator) {
            case "&&": {
              return makeConditionalExpression(
                makeReadCacheExpression(left, path),
                unbuildExpression(
                  drillSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "right",
                  ),
                  scope,
                  null,
                ),
                makeReadCacheExpression(left, path),
                path,
              );
            }
            case "||": {
              return makeConditionalExpression(
                makeReadCacheExpression(left, path),
                makeReadCacheExpression(left, path),
                unbuildExpression(
                  drillSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "right",
                  ),
                  scope,
                  null,
                ),
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
                unbuildExpression(
                  drillSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "right",
                  ),
                  scope,
                  null,
                ),
                makeReadCacheExpression(left, path),
                path,
              );
            }
            default: {
              throw new AranTypeError(node);
            }
          }
        },
      );
    }
    case "AwaitExpression": {
      return makeAwaitExpression(
        unbuildExpression(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "argument"),
          scope,
          null,
        ),
        path,
      );
    }
    case "YieldExpression": {
      return makeYieldExpression(
        node.delegate,
        hasYieldArgument(node)
          ? unbuildExpression(
              drillSite(
                node,
                path,
                forkMeta((meta = nextMeta(meta))),
                "argument",
              ),
              scope,
              null,
            )
          : makePrimitiveExpression({ undefined: null }, path),
        path,
      );
    }
    case "CallExpression": {
      if (node.optional) {
        return makeEarlyErrorExpression(
          "Illegal optional call outside of chain expression",
          path,
        );
      } else {
        if (isDirectEvalCall(node)) {
          return bindSequence(
            flatSequence(
              mapIndex(node.arguments.length, (index) =>
                cacheConstant(
                  forkMeta((meta = nextMeta(meta))),
                  unbuildExpression(
                    drillDeepSite(
                      node,
                      path,
                      forkMeta((meta = nextMeta(meta))),
                      "arguments",
                      index,
                    ),
                    scope,
                    null,
                  ),
                  path,
                ),
              ),
            ),
            (input) =>
              makeConditionalExpression(
                makeBinaryExpression(
                  "===",
                  makeScopeLoadExpression(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    scope,
                    {
                      type: "read",
                      mode: getMode(scope),
                      variable: /** @type {estree.Variable} */ ("eval"),
                    },
                  ),
                  makeIntrinsicExpression("eval", path),
                  path,
                ),
                prependSequence(
                  [
                    makeContextPrelude([
                      path,
                      {
                        source: "aran-eval",
                        mode: getMode(scope),
                        scope: packScope(scope),
                        meta: packMeta(forkMeta((meta = nextMeta(meta)))),
                      },
                    ]),
                  ],
                  makeScopeLoadExpression(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    scope,
                    {
                      type: "eval",
                      mode: getMode(scope),
                      code: input[0],
                    },
                  ),
                ),
                makeApplyExpression(
                  makeScopeLoadExpression(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    scope,
                    {
                      type: "read",
                      mode: getMode(scope),
                      variable: /** @type {estree.Variable} */ ("eval"),
                    },
                  ),
                  makePrimitiveExpression({ undefined: null }, path),
                  map(input, (cache) => makeReadCacheExpression(cache, path)),
                  path,
                ),
                path,
              ),
          );
        } else {
          return sequenceChain(
            bindSequence(
              unbuildChainCallee(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "callee",
                ),
                scope,
                null,
              ),
              (callee) =>
                makeCallExpression(
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  scope,
                  {
                    callee,
                    argument_list: unbuildArgumentList(
                      drillSite(
                        node,
                        path,
                        forkMeta((meta = nextMeta(meta))),
                        "arguments",
                      ),
                      scope,
                      null,
                    ),
                  },
                ),
            ),
            path,
          );
        }
      }
    }
    case "ArrayExpression": {
      if (isArrayRegular(node)) {
        return makeArrayExpression(
          mapIndex(node.elements.length, (index) =>
            unbuildExpression(
              drillDeepSite(
                node,
                path,
                forkMeta((meta = nextMeta(meta))),
                "elements",
                index,
              ),
              scope,
              null,
            ),
          ),
          path,
        );
      } else {
        return makeApplyExpression(
          makeIntrinsicExpression("Array.prototype.concat", path),
          makeArrayExpression([], path),
          mapIndex(node.elements.length, (index) => {
            const site = drillDeepSite(
              node,
              path,
              forkMeta((meta = nextMeta(meta))),
              "elements",
              index,
            );
            if (isNotNullishItemSite(site)) {
              return unbuildSpreadable(site, scope, null);
            } else {
              // Array(1) is vulnerable to pollution of
              // Array.prototype and Object.prototype
              return makeApplyExpression(
                makeIntrinsicExpression("Object.setPrototypeOf", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeApplyExpression(
                    makeIntrinsicExpression("Object.fromEntries", path),
                    makePrimitiveExpression({ undefined: null }, path),
                    [
                      makeArrayExpression(
                        [
                          makeArrayExpression(
                            [
                              makePrimitiveExpression("length", path),
                              makePrimitiveExpression(1, path),
                            ],
                            path,
                          ),
                          makeArrayExpression(
                            [
                              makeIntrinsicExpression(
                                "Symbol.isConcatSpreadable",
                                path,
                              ),
                              makePrimitiveExpression(true, path),
                            ],
                            path,
                          ),
                        ],
                        path,
                      ),
                    ],
                    path,
                  ),
                  makePrimitiveExpression(null, path),
                ],
                path,
              );
            }
          }),
          path,
        );
      }
    }
    case "ImportExpression": {
      return makeApplyExpression(
        makeScopeLoadExpression(
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          scope,
          {
            type: "read-import-dynamic",
            mode: getMode(scope),
          },
        ),
        makePrimitiveExpression({ undefined: null }, path),
        [
          unbuildExpression(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "source"),
            scope,
            null,
          ),
        ],
        path,
      );
    }
    case "NewExpression": {
      if (isNotSuperNew(node)) {
        if (isNotSpreadNew(node)) {
          return makeConstructExpression(
            unbuildExpression(
              drillSite(
                node,
                path,
                forkMeta((meta = nextMeta(meta))),
                "callee",
              ),
              scope,
              null,
            ),
            mapIndex(node.arguments.length, (index) =>
              unbuildExpression(
                drillDeepSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "arguments",
                  index,
                ),
                scope,
                null,
              ),
            ),
            path,
          );
        } else {
          return makeApplyExpression(
            makeIntrinsicExpression("Reflect.construct", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              unbuildExpression(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "callee",
                ),
                scope,
                null,
              ),
              makeApplyExpression(
                makeIntrinsicExpression("Array.prototype.concat", path),
                makeArrayExpression([], path),
                mapIndex(node.arguments.length, (index) =>
                  unbuildSpreadable(
                    drillDeepSite(
                      node,
                      path,
                      forkMeta((meta = nextMeta(meta))),
                      "arguments",
                      index,
                    ),
                    scope,
                    null,
                  ),
                ),
                path,
              ),
            ],
            path,
          );
        }
      } else {
        return makeEarlyErrorExpression(
          "'super' cannot be invoked with 'new'",
          path,
        );
      }
    }
    case "ChainExpression": {
      return sequenceChain(
        unbuildChainElement(
          drillSite(
            node,
            path,
            forkMeta((meta = nextMeta(meta))),
            "expression",
          ),
          scope,
          null,
        ),
        path,
      );
    }
    case "MemberExpression": {
      if (node.optional) {
        return makeEarlyErrorExpression(
          "Illegal optional member outside of chain expression",
          path,
        );
      } else {
        return bindTwoSequence(
          unbuildObject(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "object"),
            scope,
            null,
          ),
          unbuildKey(
            drillSite(
              node,
              path,
              forkMeta((meta = nextMeta(meta))),
              "property",
            ),
            scope,
            { computed: node.computed },
          ),
          (object, key) =>
            makeGetMemberExpression(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              scope,
              { object, key },
            ),
        );
      }
    }
    case "ObjectExpression": {
      if (node.properties.length === 0) {
        return makeApplyExpression(
          makeIntrinsicExpression("Object.create", path),
          makePrimitiveExpression({ undefined: null }, path),
          [makeIntrinsicExpression("Object.prototype", path)],
          path,
        );
      } else {
        if (isInitObject(node)) {
          return makeApplyExpression(
            makeIntrinsicExpression("Object.fromEntries", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeArrayExpression(
                mapIndex(node.properties.length, (index) =>
                  unbuildInitProperty(
                    drillDeepSite(
                      node,
                      path,
                      forkMeta((meta = nextMeta(meta))),
                      "properties",
                      index,
                    ),
                    scope,
                  ),
                ),
                path,
              ),
            ],
            path,
          );
        } else {
          return bindSequence(
            cacheConstant(
              forkMeta((meta = nextMeta(meta))),
              makeApplyExpression(
                makeIntrinsicExpression("Object.create", path),
                makePrimitiveExpression({ undefined: null }, path),
                [makeIntrinsicExpression("Object.prototype", path)],
                path,
              ),
              path,
            ),
            (self) =>
              makeSequenceExpression(
                concatEffect(
                  mapIndex(node.properties.length, (index) =>
                    unbuildProperty(
                      drillDeepSite(
                        node,
                        path,
                        forkMeta((meta = nextMeta(meta))),
                        "properties",
                        index,
                      ),
                      scope,
                      { self },
                    ),
                  ),
                ),
                makeReadCacheExpression(self, path),
                path,
              ),
          );
        }
      }
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   site: import("../site").Site<estree.Expression>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     name: import("../name").Name,
 *   },
 * ) => import("../sequence").ExpressionSequence}
 */
export const unbuildNameExpression = (
  { node, path, meta },
  scope,
  { name },
) => {
  switch (node.type) {
    case "ArrowFunctionExpression": {
      return unbuildFunction({ node, path, meta }, scope, {
        type: "arrow",
        name,
      });
    }
    case "FunctionExpression": {
      return unbuildFunction({ node, path, meta }, scope, {
        type: "function",
        name,
      });
    }
    case "ClassExpression": {
      return unbuildClass({ node, path, meta }, scope, {
        name,
      });
    }
    default: {
      return unbuildExpression({ node, path, meta }, scope, null);
    }
  }
};
