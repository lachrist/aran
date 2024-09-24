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
  initSyntaxErrorExpression,
} from "../prelude/index.mjs";
import { makeSpreadArgumentList } from "../arguments.mjs";
import { makeExpressionAssigner } from "../assigner.mjs";
import { digest } from "../annotation/index.mjs";

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
const unbuildPrototype = ({ node, hash, meta }, scope) => {
  if (node.properties.length === 0) {
    return zeroSequence({
      prototype: makeIntrinsicExpression("Object.prototype", hash),
      properties: [],
    });
  } else {
    const sites = drillSiteArray(drillSite(node, hash, meta, "properties"));
    const head = sites[0];
    if (isProtoPropertySite(head)) {
      return mapSequence(unbuildProtoProperty(head, scope), (prototype) => ({
        prototype,
        properties: slice(sites, 1, sites.length),
      }));
    } else {
      return zeroSequence({
        prototype: makeIntrinsicExpression("Object.prototype", hash),
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
 *   hash: import("../../hash").Path,
 * ) => import("../atom").Expression}
 */
const makeNumberPrimitiveExpression = (value, hash) => {
  if (value === NEGATIVE_INFINITY) {
    return makeIntrinsicExpression("Number.NEGATIVE_INFINITY", hash);
  } else if (value === POSITIVE_INFINITY) {
    return makeIntrinsicExpression("Number.POSITIVE_INFINITY", hash);
  } else if (isNaN(value)) {
    throw new AranExecError("Literal should not be able to create NaN", {
      value,
      hash,
    });
  } else if (value === 0 && 1 / value === NEGATIVE_INFINITY) {
    throw new AranExecError(
      "Literal should not be able to create negative zero",
      {
        value,
        hash,
      },
    );
  } else {
    return makePrimitiveExpression(value, hash);
  }
};

/**
 * @type {(
 *   node: import("../../estree").Expression,
 *   meta: import("../meta").Meta,
 *   context: {
 *     annotation: import("../annotation").Annotation,
 *     scope: import("../scope").Scope,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
export const unbuildExpression = (node, meta, { annotation, scope }) => {
  const hash = digest(node, annotation);
  switch (node.type) {
    case "Literal": {
      if (isRegExpLiteral(node)) {
        return zeroSequence(
          makeApplyExpression(
            makeIntrinsicExpression("RegExp", hash),
            makeIntrinsicExpression("undefined", hash),
            [
              makePrimitiveExpression(node.regex.pattern, hash),
              makePrimitiveExpression(node.regex.flags, hash),
            ],
            hash,
          ),
        );
      } else if (isBigIntLiteral(node)) {
        return zeroSequence(
          makePrimitiveExpression({ bigint: node.bigint }, hash),
        );
      } else if (typeof node.value === "number") {
        if (
          getMode(scope) === "strict" &&
          hasOwn(node, "raw") &&
          typeof node.raw === "string"
        ) {
          if (isLegacyOctalLiteral(node.raw)) {
            return initSyntaxErrorExpression(
              "Octal literals are not allowed in strict mode.",
              hash,
            );
          } else if (isZeroLeadingDecimalLiteral(node.raw)) {
            return initSyntaxErrorExpression(
              "Decimal integer literals with a leading zero are forbidden in strict mode.",
              hash,
            );
          } else {
            return zeroSequence(
              makeNumberPrimitiveExpression(node.value, hash),
            );
          }
        } else {
          return zeroSequence(makeNumberPrimitiveExpression(node.value, hash));
        }
      } else {
        return zeroSequence(makePrimitiveExpression(node.value, hash));
      }
    }
    case "TemplateLiteral": {
      if (node.expressions.length !== node.quasis.length - 1) {
        return initSyntaxErrorExpression(
          "Template literal quasis/expressions length mismatch",
          hash,
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
          makeIntrinsicExpression("String.prototype.concat", hash),
          makePrimitiveExpression("", hash),
          flatSequence([
            ...flatMapIndex(node.expressions.length, (index) => [
              unbuildQuasi(
                drillDeepSite(
                  node,
                  hash,
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
                  hash,
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
                hash,
                forkMeta((meta = nextMeta(meta))),
                "quasis",
                node.quasis.length - 1,
              ),
              scope,
              { cooked: true },
            ),
          ]),
          hash,
        );
      }
    }
    // Tagged template cannot lead to a direct eval call because it receives an array instead of a string:
    // cf: https://www.ecma-international.org/ecma-262/10.0/index.html#sec-performeval
    case "TaggedTemplateExpression": {
      return incorporateExpression(
        callSequence__X(
          makeCallExpression,
          { hash, meta: forkMeta((meta = nextMeta(meta))) },
          scope,
          liftSequenceXX(
            makeCall,
            unbuildCallee(
              drillSite(node, hash, forkMeta((meta = nextMeta(meta))), "tag"),
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
                    hash,
                    meta: forkMeta((meta = nextMeta(meta))),
                  }),
                  hash,
                ),
                flatSequence(
                  mapIndex(node.quasi.expressions.length, (index) =>
                    unbuildExpression(
                      drillVeryDeepSite(
                        node,
                        hash,
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
        hash,
      );
    }
    case "ThisExpression": {
      return makeScopeLoadExpression({ hash, meta }, scope, {
        type: "read-this",
        mode: getMode(scope),
      });
    }
    case "MetaProperty": {
      if (node.meta.name === "new" && node.property.name === "target") {
        return makeScopeLoadExpression({ hash, meta }, scope, {
          type: "read-new-target",
          mode: getMode(scope),
        });
      } else if (node.meta.name === "import" && node.property.name === "meta") {
        return makeScopeLoadExpression({ hash, meta }, scope, {
          type: "read-import-meta",
          mode: getMode(scope),
        });
      } else {
        return initSyntaxErrorExpression(
          `Illegal meta property: '${node.meta.name}.${node.property.name}'`,
          hash,
        );
      }
    }
    case "Identifier": {
      return makeScopeLoadExpression({ hash, meta }, scope, {
        type: "read",
        mode: getMode(scope),
        variable: /** @type {import("../../estree").Variable} */ (node.name),
      });
    }
    case "ArrowFunctionExpression": {
      return unbuildFunction({ node, hash, meta }, scope, {
        type: "arrow",
        name: { type: "anonymous" },
      });
    }
    case "FunctionExpression": {
      return unbuildFunction({ node, hash, meta }, scope, {
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
      return unbuildClass({ node, hash, meta }, scope, {
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
                hash,
                forkMeta((meta = nextMeta(meta))),
                "left",
              ),
              scope,
              null,
            ),
            makeThrowErrorExpression(
              "ReferenceError",
              "Invalid left-hand side in assignment",
              hash,
            ),
            hash,
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
                  { hash, meta: forkMeta((meta = nextMeta(meta))) },
                  scope,
                  liftSequenceXXX(
                    makeSetMember,
                    unbuildObject(
                      drillDeepSite(
                        node,
                        hash,
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
                        hash,
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
                              hash,
                              forkMeta((meta = nextMeta(meta))),
                              "right",
                            ),
                            scope,
                            null,
                          ),
                          hash,
                        ),
                      ),
                      makeReadCacheExpression(result, hash),
                      hash,
                    ),
                  ),
                ),
                makeReadCacheExpression(result, hash),
                hash,
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
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    "right",
                  ),
                  scope,
                  { name },
                ),
                hash,
              ),
              (right) =>
                liftSequenceX__(
                  makeSequenceExpression,
                  unbuildPattern(
                    drillSite(
                      node,
                      hash,
                      forkMeta((meta = nextMeta(meta))),
                      "left",
                    ),
                    scope,
                    { kind: null, right: makeReadCacheExpression(right, hash) },
                  ),
                  makeReadCacheExpression(right, hash),
                  hash,
                ),
            ),
            hash,
          );
        }
      } else {
        return callSequence__X(
          unbuildUpdateExpression,
          drillSite(node, hash, forkMeta((meta = nextMeta(meta))), "left"),
          scope,
          liftSequence__X(
            makeExpressionAssigner,
            "new",
            UPDATE_OPERATOR_RECORD[node.operator],
            // eslint-disable-next-line no-use-before-define
            unbuildNameExpression(
              drillSite(node, hash, forkMeta((meta = nextMeta(meta))), "right"),
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
        drillSite(node, hash, forkMeta((meta = nextMeta(meta))), "argument"),
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
              { hash, meta: forkMeta((meta = nextMeta(meta))) },
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
                  hash,
                  forkMeta((meta = nextMeta(meta))),
                  "argument",
                ),
                scope,
                null,
              ),
              hash,
            );
          }
        }
        case "delete": {
          return unbuildDeleteArgument(
            drillSite(
              node,
              hash,
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
                hash,
                forkMeta((meta = nextMeta(meta))),
                "argument",
              ),
              scope,
              null,
            ),
            hash,
          );
        }
      }
    }
    case "BinaryExpression": {
      if (isHasPrivate(node)) {
        return callSequence__X(
          makeScopeLoadExpression,
          { hash, meta: forkMeta((meta = nextMeta(meta))) },
          scope,
          liftSequence_X_(
            makeHasPrivateOperation,
            getMode(scope),
            unbuildExpression(
              drillSite(node, hash, forkMeta((meta = nextMeta(meta))), "right"),
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
            drillSite(node, hash, forkMeta((meta = nextMeta(meta))), "left"),
            scope,
            null,
          ),
          unbuildExpression(
            drillSite(node, hash, forkMeta((meta = nextMeta(meta))), "right"),
            scope,
            null,
          ),
          hash,
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
                  hash,
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
            hash,
            forkMeta((meta = nextMeta(meta))),
            "expressions",
            node.expressions.length - 1,
          ),
          scope,
          null,
        ),
        hash,
      );
    }
    case "ConditionalExpression": {
      return liftSequenceXXX_(
        makeConditionalExpression,
        unbuildExpression(
          drillSite(node, hash, forkMeta((meta = nextMeta(meta))), "test"),
          scope,
          null,
        ),
        unbuildExpression(
          drillSite(
            node,
            hash,
            forkMeta((meta = nextMeta(meta))),
            "consequent",
          ),
          scope,
          null,
        ),
        unbuildExpression(
          drillSite(node, hash, forkMeta((meta = nextMeta(meta))), "alternate"),
          scope,
          null,
        ),
        hash,
      );
    }
    case "LogicalExpression": {
      return incorporateExpression(
        bindSequence(
          callSequence_X_(
            cacheConstant,
            forkMeta((meta = nextMeta(meta))),
            unbuildExpression(
              drillSite(node, hash, forkMeta((meta = nextMeta(meta))), "left"),
              scope,
              null,
            ),
            hash,
          ),
          (left) => {
            switch (node.operator) {
              case "&&": {
                return liftSequence_X__(
                  makeConditionalExpression,
                  makeReadCacheExpression(left, hash),
                  unbuildExpression(
                    drillSite(
                      node,
                      hash,
                      forkMeta((meta = nextMeta(meta))),
                      "right",
                    ),
                    scope,
                    null,
                  ),
                  makeReadCacheExpression(left, hash),
                  hash,
                );
              }
              case "||": {
                return liftSequence__X_(
                  makeConditionalExpression,
                  makeReadCacheExpression(left, hash),
                  makeReadCacheExpression(left, hash),
                  unbuildExpression(
                    drillSite(
                      node,
                      hash,
                      forkMeta((meta = nextMeta(meta))),
                      "right",
                    ),
                    scope,
                    null,
                  ),
                  hash,
                );
              }
              case "??": {
                return liftSequence_X__(
                  makeConditionalExpression,
                  makeBinaryExpression(
                    "==",
                    makeReadCacheExpression(left, hash),
                    makePrimitiveExpression(null, hash),
                    hash,
                  ),
                  unbuildExpression(
                    drillSite(
                      node,
                      hash,
                      forkMeta((meta = nextMeta(meta))),
                      "right",
                    ),
                    scope,
                    null,
                  ),
                  makeReadCacheExpression(left, hash),
                  hash,
                );
              }
              default: {
                throw new AranTypeError(node);
              }
            }
          },
        ),
        hash,
      );
    }
    case "AwaitExpression": {
      return liftSequenceX_(
        makeAwaitExpression,
        unbuildExpression(
          drillSite(node, hash, forkMeta((meta = nextMeta(meta))), "argument"),
          scope,
          null,
        ),
        hash,
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
                hash,
                forkMeta((meta = nextMeta(meta))),
                "argument",
              ),
              scope,
              null,
            )
          : zeroSequence(makeIntrinsicExpression("undefined", hash)),
        hash,
      );
    }
    case "CallExpression": {
      if (node.optional) {
        return initSyntaxErrorExpression(
          "Illegal optional call outside of chain expression",
          hash,
        );
      } else {
        return incorporateExpression(
          callSequence__X(
            makeCallExpression,
            { hash, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            liftSequenceXX(
              makeCall,
              unbuildCallee(
                drillSite(
                  node,
                  hash,
                  forkMeta((meta = nextMeta(meta))),
                  "callee",
                ),
                scope,
                null,
              ),
              unbuildArgumentList(
                drillSite(
                  node,
                  hash,
                  forkMeta((meta = nextMeta(meta))),
                  "arguments",
                ),
                scope,
                null,
              ),
            ),
          ),
          hash,
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
                  hash,
                  forkMeta((meta = nextMeta(meta))),
                  "elements",
                  index,
                ),
                scope,
                null,
              ),
            ),
          ),
          hash,
        );
      } else {
        return liftSequence__X_(
          makeApplyExpression,
          makeIntrinsicExpression("Array.prototype.concat", hash),
          makeArrayExpression([], hash),
          flatSequence(
            mapIndex(node.elements.length, (index) => {
              const site = drillDeepSite(
                node,
                hash,
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
                    makeIntrinsicExpression("aran.createObject", hash),
                    makeIntrinsicExpression("undefined", hash),
                    [
                      makePrimitiveExpression(null, hash),
                      makePrimitiveExpression("length", hash),
                      makePrimitiveExpression(1, hash),
                      makeIntrinsicExpression(
                        "Symbol.isConcatSpreadable",
                        hash,
                      ),
                      makePrimitiveExpression(true, hash),
                    ],
                    hash,
                  ),
                );
              }
            }),
          ),
          hash,
        );
      }
    }
    case "ImportExpression": {
      return liftSequenceX_X_(
        makeApplyExpression,
        makeScopeLoadExpression(
          { hash, meta: forkMeta((meta = nextMeta(meta))) },
          scope,
          {
            type: "read-import",
            mode: getMode(scope),
          },
        ),
        makeIntrinsicExpression("undefined", hash),
        liftSequenceX(
          concat_,
          unbuildExpression(
            drillSite(node, hash, forkMeta((meta = nextMeta(meta))), "source"),
            scope,
            null,
          ),
        ),
        hash,
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
                hash,
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
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    "arguments",
                    index,
                  ),
                  scope,
                  null,
                ),
              ),
            ),
            hash,
          );
        } else {
          return liftSequence__X_(
            makeApplyExpression,
            makeIntrinsicExpression("Reflect.construct", hash),
            makeIntrinsicExpression("undefined", hash),
            liftSequenceXX(
              concat__,
              unbuildExpression(
                drillSite(
                  node,
                  hash,
                  forkMeta((meta = nextMeta(meta))),
                  "callee",
                ),
                scope,
                null,
              ),
              liftSequence__X_(
                makeApplyExpression,
                makeIntrinsicExpression("Array.prototype.concat", hash),
                makeArrayExpression([], hash),
                flatSequence(
                  mapIndex(node.arguments.length, (index) =>
                    unbuildSpreadable(
                      drillDeepSite(
                        node,
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        "arguments",
                        index,
                      ),
                      scope,
                      null,
                    ),
                  ),
                ),
                hash,
              ),
            ),
            hash,
          );
        }
      } else {
        return initSyntaxErrorExpression(
          "'super' cannot be invoked with 'new'",
          hash,
        );
      }
    }
    case "ChainExpression": {
      return resolveChain(
        unbuildChainElement(
          drillSite(
            node,
            hash,
            forkMeta((meta = nextMeta(meta))),
            "expression",
          ),
          scope,
          null,
        ),
        hash,
      );
    }
    case "MemberExpression": {
      if (node.optional) {
        return initSyntaxErrorExpression(
          "Illegal optional member outside of chain expression",
          hash,
        );
      } else {
        return callSequence__X(
          makeGetMemberExpression,
          { hash, meta: forkMeta((meta = nextMeta(meta))) },
          scope,
          liftSequenceXX(
            makeGetMember,
            unbuildObject(
              drillSite(
                node,
                hash,
                forkMeta((meta = nextMeta(meta))),
                "object",
              ),
              scope,
              null,
            ),
            unbuildKey(
              drillSite(
                node,
                hash,
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
          { node, hash, meta: forkMeta((meta = nextMeta(meta))) },
          scope,
        ),
        ({ prototype, properties }) => {
          if (
            everyNarrow(properties, isInitPropertySite) &&
            !some(properties, isProtoPropertySite)
          ) {
            return liftSequence__X_(
              makeApplyExpression,
              makeIntrinsicExpression("aran.createObject", hash),
              makeIntrinsicExpression("undefined", hash),
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
              hash,
            );
          } else {
            return incorporateExpression(
              bindSequence(
                cacheConstant(
                  forkMeta((meta = nextMeta(meta))),
                  makeApplyExpression(
                    makeIntrinsicExpression("aran.createObject", hash),
                    makeIntrinsicExpression("undefined", hash),
                    [prototype],
                    hash,
                  ),
                  hash,
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
                    makeReadCacheExpression(self, hash),
                    hash,
                  ),
              ),
              hash,
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
 *   node: import("../../estree").Expression,
 *   meta: import("../meta").Meta,
 *   context: {
 *     scope: import("../scope").Scope,
 *     annotation: import("../annotation").Annotation,
 *     name: import("../name").Name,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
export const unbuildNameExpression = (
  node,
  meta,
  { scope, annotation, name },
) => {
  switch (node.type) {
    case "ArrowFunctionExpression": {
      return unbuildFunction(node, meta, {
        scope,
        annotation,
        type: "arrow",
        name,
      });
    }
    case "FunctionExpression": {
      return unbuildFunction(node, meta, {
        scope,
        annotation,
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
      return unbuildClass(node, meta, {
        scope,
        annotation,
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
      return unbuildExpression(node, meta, { scope, annotation });
    }
  }
};
