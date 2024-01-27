import {
  every,
  mapIndex,
  flatMapIndex,
  some,
  map,
  hasOwn,
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
  unbuildProtoProperty,
} from "./property.mjs";
import { unbuildClass } from "./class.mjs";
import { unbuildDeleteArgument } from "./delete.mjs";
import {
  makeReadCacheExpression,
  cacheConstant,
  cacheWritable,
  listWriteCacheEffect,
} from "../cache.mjs";
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
  bindThreeSequence,
  bindTwoSequence,
  sequenceChain,
} from "../sequence.mjs";
import {
  drillDeepSite,
  drillSite,
  drillSiteArray,
  drillVeryDeepSite,
} from "../site.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { unbuildChainCallee } from "./callee.mjs";
import { getMode, makeScopeLoadExpression } from "../scope/index.mjs";
import { unbuildPattern } from "./pattern.mjs";
import { unbuildObject } from "./object.mjs";
import { unbuildKey } from "./key.mjs";
import { listSetMemberEffect, makeGetMemberExpression } from "../member.mjs";
import { isBigIntLiteral, isRegExpLiteral } from "../query/index.mjs";
import { cacheTemplate } from "../template.mjs";

const {
  Reflect: { apply },
  RegExp: {
    prototype: { test: testRegExp },
  },
} = globalThis;

/**
 * @type {(
 *   node: estree.AssignmentExpression,
 * ) => node is estree.AssignmentExpression & {
 *   left: import("@babel/types").MemberExpression,
 * }}
 */
const isMemberAssignment = (node) =>
  node.left.type === "MemberExpression" && node.operator === "=";

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
 * ) => node is estree.InitProperty}
 */
const isInitProperty = (node) =>
  node.type === "Property" && node.kind === "init" && !node.method;

/**
 * @type {(
 *   site: import("../site").Site<estree.InitProperty>,
 * ) => site is import("../site").Site<estree.ProtoProperty>}
 */
const isProtoPropertySite = (site) => isProtoProperty(site.node);

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   site: import("../site").Site<estree.InitProperty>[],
 * ) => ({
 *   body: {
 *     head: import("../site").Site<estree.ProtoProperty>[],
 *     main: import("../site").Site<estree.InitProperty>,
 *   }[],
 *   tail: import("../site").Site<estree.ProtoProperty>[],
 * })}
 */
const attachProtoProperty = (sites) => {
  /**
   * @type {{
   *   head: import("../site").Site<estree.ProtoProperty>[],
   *   main: import("../site").Site<estree.InitProperty>,
   * }[]}
   */
  const body = [];
  /**
   * @type {import("../site").Site<estree.ProtoProperty>[]}
   */
  let head = [];
  for (const site of sites) {
    if (isProtoPropertySite(site)) {
      head[head.length] = site;
    } else {
      body[body.length] = {
        head,
        main: site,
      };
      head = [];
    }
  }
  return {
    body,
    tail: head,
  };
};
/* eslint-enable local/no-impure */

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
const isInitObject = (node) => every(node.properties, isInitProperty);

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

const LEGACY_OCTAL_REGEXP = /^0[0-7]+$/;

const LEADING_ZERO_DECIMAL_REGEXP = /^0\d+$/;

/**
 * @type {(
 *   raw: string,
 * ) => boolean}
 */
const isLegacyOctalLiteral = (raw) =>
  apply(testRegExp, LEGACY_OCTAL_REGEXP, [raw]);

/**
 * @type {(
 *   raw: string,
 * ) => boolean}
 */
const isZeroLeadingDecimalLiteral = (raw) =>
  apply(testRegExp, LEADING_ZERO_DECIMAL_REGEXP, [raw]);

/**
 * @type {(
 *   site: import("../site").Site<estree.Expression>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../sequence").ExpressionSequence}
 */
export const unbuildExpression = ({ node, path, meta }, scope, _options) => {
  switch (node.type) {
    case "Literal": {
      if (isRegExpLiteral(node)) {
        return makeApplyExpression(
          makeIntrinsicExpression("RegExp", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makePrimitiveExpression(node.regex.pattern, path),
            makePrimitiveExpression(node.regex.flags, path),
          ],
          path,
        );
      } else if (isBigIntLiteral(node)) {
        return makePrimitiveExpression({ bigint: node.bigint }, path);
      } else {
        if (
          getMode(scope) === "strict" &&
          typeof node.value === "number" &&
          hasOwn(node, "raw") &&
          typeof node.raw === "string"
        ) {
          if (isLegacyOctalLiteral(node.raw)) {
            return makeEarlyErrorExpression(
              "Octal literals are not allowed in strict mode.",
              path,
            );
          } else if (isZeroLeadingDecimalLiteral(node.raw)) {
            return makeEarlyErrorExpression(
              "Decimal integer literals with a leading zero are forbidden in strict mode.",
              path,
            );
          } else {
            return makePrimitiveExpression(node.value, path);
          }
        } else {
          return makePrimitiveExpression(
            /** @type {estree.SimpleLiteral} */ (node).value,
            path,
          );
        }
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
                    cacheTemplate({
                      node,
                      path,
                      meta: forkMeta((meta = nextMeta(meta))),
                    }),
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
        } else if (isMemberAssignment(node)) {
          // eval order: node.left.object >> node.left.property >> node.right
          return bindThreeSequence(
            unbuildObject(
              drillDeepSite(
                node,
                path,
                forkMeta((meta = nextMeta(meta))),
                "left",
                "object",
              ),
              scope,
              null,
            ),
            unbuildKey(
              drillDeepSite(
                node,
                path,
                forkMeta((meta = nextMeta(meta))),
                "left",
                "property",
              ),
              scope,
              { computed: node.left.computed, eager_cooking: false },
            ),
            cacheConstant(
              forkMeta((meta = nextMeta(meta))),
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
            ),
            (object, key, value) =>
              makeSequenceExpression(
                listSetMemberEffect(
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  scope,
                  { object, key, value },
                ),
                makeReadCacheExpression(value, path),
                path,
              ),
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
            { computed: node.computed, eager_cooking: true },
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
      } else if (
        node.properties.length === 1 &&
        isProtoProperty(node.properties[0])
      ) {
        return makeApplyExpression(
          makeIntrinsicExpression("Object.create", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            unbuildProtoProperty(
              /** @type {import("../site").Site<estree.ProtoProperty>} */ (
                drillDeepSite(node, path, meta, "properties", 0)
              ),
              scope,
            ),
          ],
          path,
        );
      } else if (isInitObject(node)) {
        if (some(node.properties, isProtoProperty)) {
          const { body, tail } = attachProtoProperty(
            drillSiteArray(
              drillSite(
                node,
                path,
                forkMeta((meta = nextMeta(meta))),
                "properties",
              ),
            ),
          );
          return bindSequence(
            cacheWritable(
              forkMeta((meta = nextMeta(meta))),
              makeIntrinsicExpression("aran.deadzone", path),
              path,
            ),
            (prototype) =>
              makeApplyExpression(
                makeIntrinsicExpression("Object.setPrototypeOf", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeApplyExpression(
                    makeIntrinsicExpression("Object.fromEntries", path),
                    makePrimitiveExpression({ undefined: null }, path),
                    [
                      makeArrayExpression(
                        map(body, ({ head, main }) =>
                          makeSequenceExpression(
                            concatEffect(
                              map(head, (site) =>
                                listWriteCacheEffect(
                                  prototype,
                                  unbuildProtoProperty(site, scope),
                                  path,
                                ),
                              ),
                            ),
                            unbuildInitProperty(main, scope),
                            path,
                          ),
                        ),
                        path,
                      ),
                    ],
                    path,
                  ),
                  makeSequenceExpression(
                    concatEffect(
                      map(tail, (site) =>
                        listWriteCacheEffect(
                          prototype,
                          unbuildProtoProperty(site, scope),
                          path,
                        ),
                      ),
                    ),
                    makeReadCacheExpression(prototype, path),
                    path,
                  ),
                ],
                path,
              ),
          );
        } else {
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
        }
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
        name:
          node.id == null
            ? name
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
            ? name
            : {
                type: "assignment",
                variable: /** @type {estree.Variable} */ (node.id.name),
              },
      });
    }
    default: {
      return unbuildExpression({ node, path, meta }, scope, null);
    }
  }
};
