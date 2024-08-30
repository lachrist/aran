import {
  everyNarrow,
  mapIndex,
  flatMapIndex,
  some,
  map,
  hasOwn,
  hasNarrowKey,
  concat_X,
  concat_,
  flat,
  concat__,
  slice,
} from "../../util/index.mjs";
import { AranExecError, AranTypeError } from "../../report.mjs";
import {
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
  makeWriteCacheEffect,
  cacheTemplate,
} from "../cache.mjs";
import { unbuildChainElement } from "./chain.mjs";
import { unbuildArgumentList } from "./argument.mjs";
import { makeCall, makeCallExpression } from "../call.mjs";
import {
  bindSequence,
  callSequence_X_,
  callSequence__X,
  flatSequence,
  liftSequenceX,
  liftSequenceXX,
  liftSequenceXXX,
  liftSequenceXXX_,
  liftSequenceXX_,
  liftSequenceX_,
  liftSequenceX_X_,
  liftSequenceX__,
  liftSequence_X,
  liftSequence_XX_,
  liftSequence_X_,
  liftSequence_X__,
  liftSequence__X,
  liftSequence__X_,
  mapSequence,
  zeroSequence,
} from "../../sequence.mjs";
import {
  drillDeepSite,
  drillSite,
  drillSiteArray,
  drillVeryDeepSite,
} from "../site.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { unbuildCallee } from "./callee.mjs";
import {
  getMode,
  makeScopeLoadExpression,
  makeHasPrivateOperation,
} from "../scope/index.mjs";
import { unbuildPattern } from "./pattern.mjs";
import { unbuildObject } from "./object.mjs";
import { unbuildKey } from "./key.mjs";
import {
  listSetMemberEffect,
  makeGetMember,
  makeGetMemberExpression,
  makeSetMember,
} from "../member.mjs";
import { isBigIntLiteral, isRegExpLiteral } from "../query/index.mjs";
import { UPDATE_OPERATOR_RECORD, unbuildUpdateExpression } from "./update.mjs";
import { LOGICAL_ASSIGNMENT_OPERATOR_RECORD } from "../../estree.mjs";
import {
  resolveChain,
  incorporateExpression,
  initErrorExpression,
} from "../prelude/index.mjs";
import { makeSpreadArgumentList } from "../arguments.mjs";
import { makeExpressionAssigner } from "../assigner.mjs";

const {
  Number: { NEGATIVE_INFINITY, POSITIVE_INFINITY, isNaN },
  Reflect: { apply },
  RegExp: {
    prototype: { test: testRegExp },
  },
} = globalThis;

/**
 * @type {(
 *   node: import("../../estree").AssignmentExpression,
 * ) => node is import("../../estree").AssignmentExpression & {
 *   left: import("@babel/types").MemberExpression,
 * }}
 */
const isMemberAssignment = (node) =>
  node.left.type === "MemberExpression" && node.operator === "=";

/**
 * @type {(
 *   node: import("../../estree").BinaryExpression,
 * ) => node is import("../../estree").PrivateBinaryExpression}
 */
const isHasPrivate = (node) =>
  node.operator === "in" && node.left.type === "PrivateIdentifier";

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | import("../../estree").Expression
 *     | import("../../estree").SpreadElement
 *     | null
 *     | undefined
 *   ),
 * >) => site is import("../site").Site<(
 *   | import("../../estree").Expression
 *   | import("../../estree").SpreadElement
 * )>}
 */
const isNotNullishItemSite = (site) => site.node != null;

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | import("../../estree").ObjectProperty
 *     | import("../../estree").SpreadElement
 *   )>,
 * ) => site is import("../site").Site<
 *   import("../../estree").InitObjectProperty
 * >}
 */
const isInitPropertySite = (site) =>
  site.node.type === "Property" &&
  site.node.kind === "init" &&
  !site.node.method;

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | import("../../estree").ObjectProperty
 *     | import("../../estree").SpreadElement
 *   )>,
 * ) => site is import("../site").Site<
 *   import("../../estree").ProtoObjectProperty
 * >}
 */
const isProtoPropertySite = (site) => isProtoProperty(site.node);

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").ObjectExpression>,
 *   scope: import("../scope").Scope,
 * ) => import("../../sequence").Sequence<
 *  import("../prelude").BodyPrelude,
 *  {
 *    prototype: import("../atom").Expression,
 *    properties: import("../site").Site<
 *      | import("../../estree").SpreadElement
 *      | import("../../estree").ObjectProperty
 *    >[],
 *  },
 * >}
 */
const unbuildPrototype = ({ node, path, meta }, scope) => {
  if (node.properties.length === 0) {
    return zeroSequence({
      prototype: makeIntrinsicExpression("Object.prototype", path),
      properties: [],
    });
  } else {
    const sites = drillSiteArray(drillSite(node, path, meta, "properties"));
    const head = sites[0];
    if (isProtoPropertySite(head)) {
      return mapSequence(unbuildProtoProperty(head, scope), (prototype) => ({
        prototype,
        properties: slice(sites, 1, sites.length),
      }));
    } else {
      return zeroSequence({
        prototype: makeIntrinsicExpression("Object.prototype", path),
        properties: sites,
      });
    }
  }
};

/**
 * @type {(
 *   node: import("../../estree").NewExpression
 * ) => node is import("../../estree").NewExpression & {
 *   callee: import("../../estree").Expression,
 * }}
 */
const isNotSuperNew = (node) => node.callee.type !== "Super";

/**
 * @type {(
 *   node: (
 *     | import("../../estree").SpreadElement
 *     | import("../../estree").Expression
 *     | null
 *     | undefined
 *   ),
 * ) => node is import("../../estree").Expression}
 */
const isItemRegular = (node) => node != null && node.type !== "SpreadElement";

/**
 * @type {(
 *   node: import("../../estree").ArrayExpression,
 * ) => node is import("../../estree").ArrayExpression & {
 *   elements: import("../../estree").Expression[],
 * }}
 */
const isArrayRegular = (node) => everyNarrow(node.elements, isItemRegular);

/**
 * @type {(
 *   node: import("../../estree").SpreadElement | import("../../estree").Expression
 * ) => node is import("../../estree").Expression}
 */
const isNotSpreadArgument = (node) => node.type !== "SpreadElement";

/**
 * @type {(
 *   node: import("../../estree").NewExpression & {
 *     callee: import("../../estree").Expression,
 *   },
 * ) => node is import("../../estree").NewExpression & {
 *   callee: import("../../estree").Expression,
 *   arguments: import("../../estree").Expression[],
 * }}
 */
const isNotSpreadNew = (node) =>
  everyNarrow(node.arguments, isNotSpreadArgument);

/**
 * @type {(
 *   node: import("../../estree").YieldExpression
 * ) => node is import("../../estree").YieldExpression & {
 *   argument: import("../../estree").Expression,
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
 *   value: number,
 *   path: import("../../path").Path,
 * ) => import("../atom").Expression}
 */
const makeNumberPrimitiveExpression = (value, path) => {
  if (value === NEGATIVE_INFINITY) {
    return makeIntrinsicExpression("Number.NEGATIVE_INFINITY", path);
  } else if (value === POSITIVE_INFINITY) {
    return makeIntrinsicExpression("Number.POSITIVE_INFINITY", path);
  } else if (isNaN(value)) {
    throw new AranExecError("Literal should not be able to create NaN", {
      value,
      path,
    });
  } else if (value === 0 && 1 / value === NEGATIVE_INFINITY) {
    throw new AranExecError(
      "Literal should not be able to create negative zero",
      {
        value,
        path,
      },
    );
  } else {
    return makePrimitiveExpression(value, path);
  }
};

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").Expression>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
export const unbuildExpression = ({ node, path, meta }, scope, _options) => {
  switch (node.type) {
    case "Literal": {
      if (isRegExpLiteral(node)) {
        return zeroSequence(
          makeApplyExpression(
            makeIntrinsicExpression("RegExp", path),
            makeIntrinsicExpression("undefined", path),
            [
              makePrimitiveExpression(node.regex.pattern, path),
              makePrimitiveExpression(node.regex.flags, path),
            ],
            path,
          ),
        );
      } else if (isBigIntLiteral(node)) {
        return zeroSequence(
          makePrimitiveExpression({ bigint: node.bigint }, path),
        );
      } else if (typeof node.value === "number") {
        if (
          getMode(scope) === "strict" &&
          hasOwn(node, "raw") &&
          typeof node.raw === "string"
        ) {
          if (isLegacyOctalLiteral(node.raw)) {
            return initErrorExpression(
              "Octal literals are not allowed in strict mode.",
              path,
            );
          } else if (isZeroLeadingDecimalLiteral(node.raw)) {
            return initErrorExpression(
              "Decimal integer literals with a leading zero are forbidden in strict mode.",
              path,
            );
          } else {
            return zeroSequence(
              makeNumberPrimitiveExpression(node.value, path),
            );
          }
        } else {
          return zeroSequence(makeNumberPrimitiveExpression(node.value, path));
        }
      } else {
        return zeroSequence(makePrimitiveExpression(node.value, path));
      }
    }
    case "TemplateLiteral": {
      if (node.expressions.length !== node.quasis.length - 1) {
        return initErrorExpression(
          "Template literal quasis/expressions length mismatch",
          path,
        );
      } else {
        // String.prototype.concat rather than nested `+`.
        // Object.defineProperty(Number.prototype, "toString", { value: function () { return "foo"; } });
        // console.log("" + Object(123));
        // console.log(`${Object(123)}`);
        // console.log(String(Object(123)));
        // cf https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-template-literals-runtime-semantics-evaluation
        return liftSequence__X_(
          makeApplyExpression,
          makeIntrinsicExpression("String.prototype.concat", path),
          makePrimitiveExpression("", path),
          flatSequence([
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
          ]),
          path,
        );
      }
    }
    // Tagged template cannot lead to a direct eval call because it receives an array instead of a string:
    // cf: https://www.ecma-international.org/ecma-262/10.0/index.html#sec-performeval
    case "TaggedTemplateExpression": {
      return incorporateExpression(
        callSequence__X(
          makeCallExpression,
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          scope,
          liftSequenceXX(
            makeCall,
            unbuildCallee(
              drillSite(node, path, forkMeta((meta = nextMeta(meta))), "tag"),
              scope,
              null,
            ),
            liftSequenceX(
              makeSpreadArgumentList,
              liftSequenceXX(
                concat_X,
                // For any particular tagged template literal expression, the tag
                // function will always be called with the exact same literal array,
                // no matter how many times the literal is evaluated.
                // -- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates
                liftSequenceX_(
                  makeReadCacheExpression,
                  cacheTemplate(forkMeta((meta = nextMeta(meta))), {
                    node,
                    path,
                    meta: forkMeta((meta = nextMeta(meta))),
                  }),
                  path,
                ),
                flatSequence(
                  mapIndex(node.quasi.expressions.length, (index) =>
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
                ),
              ),
            ),
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
        return initErrorExpression(
          `Illegal meta property: '${node.meta.name}.${node.property.name}'`,
          path,
        );
      }
    }
    case "Identifier": {
      return makeScopeLoadExpression({ path, meta }, scope, {
        type: "read",
        mode: getMode(scope),
        variable: /** @type {import("../../estree").Variable} */ (node.name),
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
                variable: /** @type {import("../../estree").Variable} */ (
                  node.id.name
                ),
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
                variable: /** @type {import("../../estree").Variable} */ (
                  node.id.name
                ),
              },
      });
    }
    case "AssignmentExpression": {
      /** @type {import("../name").Name} */
      const name =
        node.left.type === "Identifier"
          ? {
              type: "assignment",
              variable: /** @type {import("../../estree").Variable} */ (
                node.left.name
              ),
            }
          : { type: "anonymous" };
      if (node.operator === "=") {
        // TODO this looks like redundant logic that could be removed
        // > (console.log('foo') = 123);
        // foo
        // Uncaught ReferenceError: Invalid left-hand side in assignment
        if (/** @type {any} */ (node).left.type === "CallExpression") {
          return liftSequenceX__(
            makeSequenceExpression,
            unbuildEffect(
              drillSite(
                /** @type {{left: import("../../estree").Expression}} */ (node),
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
          return bindSequence(
            cacheWritable(forkMeta((meta = nextMeta(meta))), "aran.deadzone"),
            (result) =>
              liftSequenceX__(
                makeSequenceExpression,
                callSequence__X(
                  listSetMemberEffect,
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  scope,
                  liftSequenceXXX(
                    makeSetMember,
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
                      { computed: node.left.computed },
                    ),
                    liftSequenceX__(
                      makeSequenceExpression,
                      liftSequenceX(
                        concat_,
                        liftSequence_X_(
                          makeWriteCacheEffect,
                          result,
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
                      ),
                      makeReadCacheExpression(result, path),
                      path,
                    ),
                  ),
                ),
                makeReadCacheExpression(result, path),
                path,
              ),
          );
        } else {
          return incorporateExpression(
            bindSequence(
              callSequence_X_(
                cacheConstant,
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
                liftSequenceX__(
                  makeSequenceExpression,
                  unbuildPattern(
                    drillSite(
                      node,
                      path,
                      forkMeta((meta = nextMeta(meta))),
                      "left",
                    ),
                    scope,
                    { kind: null, right: makeReadCacheExpression(right, path) },
                  ),
                  makeReadCacheExpression(right, path),
                  path,
                ),
            ),
            path,
          );
        }
      } else {
        return callSequence__X(
          unbuildUpdateExpression,
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "left"),
          scope,
          liftSequence__X(
            makeExpressionAssigner,
            "new",
            UPDATE_OPERATOR_RECORD[node.operator],
            // eslint-disable-next-line no-use-before-define
            unbuildNameExpression(
              drillSite(node, path, forkMeta((meta = nextMeta(meta))), "right"),
              scope,
              {
                name:
                  hasNarrowKey(
                    LOGICAL_ASSIGNMENT_OPERATOR_RECORD,
                    node.operator,
                  ) && node.left.type === "Identifier"
                    ? {
                        type: "assignment",
                        variable:
                          /** @type {import("../../estree").Variable} */ (
                            node.left.name
                          ),
                      }
                    : { type: "anonymous" },
              },
            ),
          ),
        );
      }
    }
    case "UpdateExpression": {
      return unbuildUpdateExpression(
        drillSite(node, path, forkMeta((meta = nextMeta(meta))), "argument"),
        scope,
        {
          result: node.prefix ? "new" : "old",
          operator: UPDATE_OPERATOR_RECORD[node.operator],
          increment: null,
        },
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
                variable: /** @type {import("../../estree").Variable} */ (
                  node.argument.name
                ),
              },
            );
          } else {
            return liftSequence_X_(
              makeUnaryExpression,
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
          return liftSequence_X_(
            makeUnaryExpression,
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
      if (isHasPrivate(node)) {
        return callSequence__X(
          makeScopeLoadExpression,
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          scope,
          liftSequence_X_(
            makeHasPrivateOperation,
            getMode(scope),
            unbuildExpression(
              drillSite(node, path, forkMeta((meta = nextMeta(meta))), "right"),
              scope,
              null,
            ),
            node.left.name,
          ),
        );
      } else {
        return liftSequence_XX_(
          makeBinaryExpression,
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
      return liftSequenceXX_(
        makeSequenceExpression,
        liftSequenceX(
          flat,
          flatSequence(
            mapIndex(node.expressions.length - 1, (index) =>
              unbuildEffect(
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
      return liftSequenceXXX_(
        makeConditionalExpression,
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
      return incorporateExpression(
        bindSequence(
          callSequence_X_(
            cacheConstant,
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
                return liftSequence_X__(
                  makeConditionalExpression,
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
                return liftSequence__X_(
                  makeConditionalExpression,
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
                return liftSequence_X__(
                  makeConditionalExpression,
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
        ),
        path,
      );
    }
    case "AwaitExpression": {
      return liftSequenceX_(
        makeAwaitExpression,
        unbuildExpression(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "argument"),
          scope,
          null,
        ),
        path,
      );
    }
    case "YieldExpression": {
      return liftSequence_X_(
        makeYieldExpression,
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
          : zeroSequence(makeIntrinsicExpression("undefined", path)),
        path,
      );
    }
    case "CallExpression": {
      if (node.optional) {
        return initErrorExpression(
          "Illegal optional call outside of chain expression",
          path,
        );
      } else {
        return incorporateExpression(
          callSequence__X(
            makeCallExpression,
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            liftSequenceXX(
              makeCall,
              unbuildCallee(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "callee",
                ),
                scope,
                null,
              ),
              unbuildArgumentList(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "arguments",
                ),
                scope,
                null,
              ),
            ),
          ),
          path,
        );
      }
    }
    case "ArrayExpression": {
      if (isArrayRegular(node)) {
        return liftSequenceX_(
          makeArrayExpression,
          flatSequence(
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
          ),
          path,
        );
      } else {
        return liftSequence__X_(
          makeApplyExpression,
          makeIntrinsicExpression("Array.prototype.concat", path),
          makeArrayExpression([], path),
          flatSequence(
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
                return zeroSequence(
                  makeApplyExpression(
                    makeIntrinsicExpression("aran.createObject", path),
                    makeIntrinsicExpression("undefined", path),
                    [
                      makePrimitiveExpression(null, path),
                      makePrimitiveExpression("length", path),
                      makePrimitiveExpression(1, path),
                      makeIntrinsicExpression(
                        "Symbol.isConcatSpreadable",
                        path,
                      ),
                      makePrimitiveExpression(true, path),
                    ],
                    path,
                  ),
                );
              }
            }),
          ),
          path,
        );
      }
    }
    case "ImportExpression": {
      return liftSequenceX_X_(
        makeApplyExpression,
        makeScopeLoadExpression(
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          scope,
          {
            type: "read-import",
            mode: getMode(scope),
          },
        ),
        makeIntrinsicExpression("undefined", path),
        liftSequenceX(
          concat_,
          unbuildExpression(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "source"),
            scope,
            null,
          ),
        ),
        path,
      );
    }
    case "NewExpression": {
      if (isNotSuperNew(node)) {
        if (isNotSpreadNew(node)) {
          return liftSequenceXX_(
            makeConstructExpression,
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
            flatSequence(
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
            ),
            path,
          );
        } else {
          return liftSequence__X_(
            makeApplyExpression,
            makeIntrinsicExpression("Reflect.construct", path),
            makeIntrinsicExpression("undefined", path),
            liftSequenceXX(
              concat__,
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
              liftSequence__X_(
                makeApplyExpression,
                makeIntrinsicExpression("Array.prototype.concat", path),
                makeArrayExpression([], path),
                flatSequence(
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
                ),
                path,
              ),
            ),
            path,
          );
        }
      } else {
        return initErrorExpression(
          "'super' cannot be invoked with 'new'",
          path,
        );
      }
    }
    case "ChainExpression": {
      return resolveChain(
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
        return initErrorExpression(
          "Illegal optional member outside of chain expression",
          path,
        );
      } else {
        return callSequence__X(
          makeGetMemberExpression,
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          scope,
          liftSequenceXX(
            makeGetMember,
            unbuildObject(
              drillSite(
                node,
                path,
                forkMeta((meta = nextMeta(meta))),
                "object",
              ),
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
          ),
        );
      }
    }
    case "ObjectExpression": {
      return bindSequence(
        unbuildPrototype(
          { node, path, meta: forkMeta((meta = nextMeta(meta))) },
          scope,
        ),
        ({ prototype, properties }) => {
          if (
            everyNarrow(properties, isInitPropertySite) &&
            !some(properties, isProtoPropertySite)
          ) {
            return liftSequence__X_(
              makeApplyExpression,
              makeIntrinsicExpression("aran.createObject", path),
              makeIntrinsicExpression("undefined", path),
              liftSequence_X(
                concat_X,
                prototype,
                liftSequenceX(
                  flat,
                  flatSequence(
                    map(properties, (property) =>
                      unbuildInitProperty(property, scope),
                    ),
                  ),
                ),
              ),
              path,
            );
          } else {
            return incorporateExpression(
              bindSequence(
                cacheConstant(
                  forkMeta((meta = nextMeta(meta))),
                  makeApplyExpression(
                    makeIntrinsicExpression("aran.createObject", path),
                    makeIntrinsicExpression("undefined", path),
                    [prototype],
                    path,
                  ),
                  path,
                ),
                (self) =>
                  liftSequenceX__(
                    makeSequenceExpression,
                    liftSequenceX(
                      flat,
                      flatSequence(
                        map(properties, (property) =>
                          unbuildProperty(property, scope, { self }),
                        ),
                      ),
                    ),
                    makeReadCacheExpression(self, path),
                    path,
                  ),
              ),
              path,
            );
          }
        },
      );
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").Expression>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     name: import("../name").Name,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
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
                variable: /** @type {import("../../estree").Variable} */ (
                  node.id.name
                ),
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
                variable: /** @type {import("../../estree").Variable} */ (
                  node.id.name
                ),
              },
      });
    }
    default: {
      return unbuildExpression({ node, path, meta }, scope, null);
    }
  }
};
