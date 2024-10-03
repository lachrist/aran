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
  callSequence___X,
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
import { UPDATE_OPERATOR_RECORD, unbuildUpdateExpression } from "./update.mjs";
import {
  resolveChain,
  incorporateExpression,
  initSyntaxErrorExpression,
} from "../prelude/index.mjs";
import { makeSpreadArgumentList } from "../arguments.mjs";
import { makeExpressionAssigner } from "../assigner.mjs";

const LOGICAL_ASSIGNMENT_OPERATOR_RECORD = {
  "&&=": null,
  "||=": null,
  "??=": null,
};

const {
  Number: { NEGATIVE_INFINITY, POSITIVE_INFINITY, isNaN },
  Reflect: { apply },
  RegExp: {
    prototype: { test: testRegExp },
  },
} = globalThis;

/**
 * @type {(
 *   node: import("estree-sentry").SpreadableObjectProperty<import("../../hash").HashProp>,
 * ) => node is import("estree-sentry").PlainObjectProperty<import("../../hash").HashProp>}
 */
const isPlainPropertyNode = (node) =>
  node.type === "Property" && node.kind === "init" && !node.method;

/**
 * @type {(
 *   node: import("estree-sentry").ObjectExpression<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context,
 * ) => import("../../sequence").Sequence<
 *  import("../prelude").BodyPrelude,
 *  {
 *    prototype: import("../atom").Expression,
 *    properties: (
 *      | import("estree-sentry").SpreadElement<import("../../hash").HashProp>
 *      | import("estree-sentry").ObjectProperty<import("../../hash").HashProp>
 *    )[],
 *  },
 * >}
 */
const unbuildPrototype = (node, meta, { scope, annotation }) => {
  const { _hash: hash } = node;
  if (node.properties.length === 0) {
    return zeroSequence({
      prototype: makeIntrinsicExpression("Object.prototype", hash),
      properties: [],
    });
  } else {
    const [head, ...rest] = node.properties;
    if (isProtoProperty(head)) {
      return mapSequence(
        unbuildProtoProperty(head, forkMeta((meta = nextMeta(meta))), {
          scope,
          annotation,
        }),
        (prototype) => ({
          prototype,
          properties: rest,
        }),
      );
    } else {
      return zeroSequence({
        prototype: makeIntrinsicExpression("Object.prototype", hash),
        properties: node.properties,
      });
    }
  }
};

// /**
//  * @type {(
//  *   node: import("estree-sentry").NewExpression<import("../../hash").HashProp>
//  * ) => node is import("estree-sentry").NewExpression<import("../../hash").HashProp> & {
//  *   callee: import("estree-sentry").Expression<import("../../hash").HashProp>,
//  * }}
//  */
// const isNotSuperNew = (node) => node.callee.type !== "Super";

/**
 * @type {(
 *   node: (
 *     | null
 *     | import("estree-sentry").SpreadableExpression<import("../../hash").HashProp>
 *   ),
 * ) => node is import("estree-sentry").Expression<import("../../hash").HashProp>}
 */
const isItemRegular = (node) => node != null && node.type !== "SpreadElement";

/**
 * @type {(
 *   node: import("estree-sentry").SpreadableExpression<import("../../hash").HashProp>,
 * ) => node is import("estree-sentry").Expression<import("../../hash").HashProp>}
 */
const isNotSpreadElement = (node) => node.type !== "SpreadElement";

// /**
//  * @type {(
//  *   node: import("estree-sentry").ArrayExpression<import("../../hash").HashProp>,
//  * ) => node is import("estree-sentry").ArrayExpression<import("../../hash").HashProp> & {
//  *   elements: import("estree-sentry").Expression<import("../../hash").HashProp>[],
//  * }}
//  */
// const isArrayRegular = (node) => everyNarrow(node.elements, isItemRegular);

// /**
//  * @type {(
//  *   node: import("estree-sentry").SpreadElement<import("../../hash").HashProp> | import("estree-sentry").Expression<import("../../hash").HashProp>
//  * ) => node is import("estree-sentry").Expression<import("../../hash").HashProp>}
//  */
// const isNotSpreadArgument = (node) => node.type !== "SpreadElement";

// /**
//  * @type {(
//  *   node: import("estree-sentry").NewExpression<import("../../hash").HashProp> & {
//  *     callee: import("estree-sentry").Expression<import("../../hash").HashProp>,
//  *   },
//  * ) => node is import("estree-sentry").NewExpression<import("../../hash").HashProp> & {
//  *   callee: import("estree-sentry").Expression<import("../../hash").HashProp>,
//  *   arguments: import("estree-sentry").Expression<import("../../hash").HashProp>[],
//  * }}
//  */
// const isNotSpreadNew = (node) =>
//   everyNarrow(node.arguments, isNotSpreadArgument);

// /**
//  * @type {(
//  *   node: import("estree-sentry").YieldExpression<import("../../hash").HashProp>
//  * ) => node is import("estree-sentry").YieldExpression<import("../../hash").HashProp> & {
//  *   argument: import("estree-sentry").Expression<import("../../hash").HashProp>,
//  * }}
//  */
// const hasYieldArgument = (node) => node.argument != null;

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
 *   hash: import("../../hash").Hash,
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
 *   node: import("estree-sentry").Expression<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
export const unbuildExpression = (node, meta, { scope, annotation }) => {
  const { _hash: hash } = node;
  switch (node.type) {
    case "Literal": {
      if (node.regex != null) {
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
      } else if (node.bigint != null) {
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
                node.quasis[index],
                forkMeta((meta = nextMeta(meta))),
                { scope, annotation, cooked: true },
              ),
              unbuildExpression(
                node.expressions[index],
                forkMeta((meta = nextMeta(meta))),
                { scope, annotation },
              ),
            ]),
            unbuildQuasi(
              node.quasis[node.quasis.length - 1],
              forkMeta((meta = nextMeta(meta))),
              { scope, annotation, cooked: true },
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
        callSequence___X(
          makeCallExpression,
          hash,
          forkMeta((meta = nextMeta(meta))),
          scope,
          liftSequenceXX(
            makeCall,
            unbuildCallee(node.tag, forkMeta((meta = nextMeta(meta))), {
              scope,
              annotation,
            }),
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
                  cacheTemplate(node, forkMeta((meta = nextMeta(meta)))),
                  hash,
                ),
                flatSequence(
                  map(node.quasi.expressions, (node) =>
                    unbuildExpression(node, forkMeta((meta = nextMeta(meta))), {
                      scope,
                      annotation,
                    }),
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
      return makeScopeLoadExpression(hash, meta, scope, {
        type: "read-this",
        mode: getMode(scope),
      });
    }
    case "MetaProperty": {
      if (node.meta.name === "new" && node.property.name === "target") {
        return makeScopeLoadExpression(hash, meta, scope, {
          type: "read-new-target",
          mode: getMode(scope),
        });
      } else if (node.meta.name === "import" && node.property.name === "meta") {
        return makeScopeLoadExpression(hash, meta, scope, {
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
      return makeScopeLoadExpression(hash, meta, scope, {
        type: "read",
        mode: getMode(scope),
        variable: node.name,
      });
    }
    case "ArrowFunctionExpression": {
      return unbuildFunction(node, meta, {
        scope,
        annotation,
        type: "arrow",
        name: { type: "anonymous" },
      });
    }
    case "FunctionExpression": {
      return unbuildFunction(node, meta, {
        scope,
        annotation,
        type: "function",
        name:
          node.id == null
            ? { type: "anonymous" }
            : { type: "assignment", variable: node.id.name },
      });
    }
    case "ClassExpression": {
      return unbuildClass(node, meta, {
        scope,
        annotation,
        name:
          node.id == null
            ? { type: "anonymous" }
            : { type: "assignment", variable: node.id.name },
      });
    }
    case "AssignmentExpression": {
      /** @type {import("../name").Name} */
      const name =
        node.left.type === "Identifier"
          ? {
              type: "assignment",
              variable: node.left.name,
            }
          : { type: "anonymous" };
      if (node.operator === "=") {
        // TODO this looks like redundant logic that could be removed
        // > (console.log('foo') = 123);
        // foo
        // Uncaught ReferenceError: Invalid left-hand side in assignment
        if (node.left.type === "CallExpression") {
          return liftSequenceX__(
            makeSequenceExpression,
            unbuildEffect(node.left, forkMeta((meta = nextMeta(meta))), {
              scope,
              annotation,
            }),
            makeThrowErrorExpression(
              "ReferenceError",
              "Invalid left-hand side in assignment",
              hash,
            ),
            hash,
          );
        } else if (node.left.type === "MemberExpression") {
          const ts_node_left = node.left;
          // eval order: node.left.object >> node.left.property >> node.right
          return bindSequence(
            cacheWritable(forkMeta((meta = nextMeta(meta))), "aran.deadzone"),
            (result) =>
              liftSequenceX__(
                makeSequenceExpression,
                callSequence___X(
                  listSetMemberEffect,
                  hash,
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                  liftSequenceXXX(
                    makeSetMember,
                    unbuildObject(
                      ts_node_left.object,
                      forkMeta((meta = nextMeta(meta))),
                      { scope, annotation },
                    ),
                    unbuildKey(
                      ts_node_left.property,
                      forkMeta((meta = nextMeta(meta))),
                      { scope, annotation, computed: ts_node_left.computed },
                    ),
                    liftSequenceX__(
                      makeSequenceExpression,
                      liftSequenceX(
                        concat_,
                        liftSequence_X_(
                          makeWriteCacheEffect,
                          result,
                          unbuildExpression(
                            node.right,
                            forkMeta((meta = nextMeta(meta))),
                            { scope, annotation },
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
          const ts_node_left = node.left;
          return incorporateExpression(
            bindSequence(
              callSequence_X_(
                cacheConstant,
                forkMeta((meta = nextMeta(meta))),
                // eslint-disable-next-line no-use-before-define
                unbuildNameExpression(
                  node.right,
                  forkMeta((meta = nextMeta(meta))),
                  { scope, annotation, name },
                ),
                hash,
              ),
              (right) =>
                liftSequenceX__(
                  makeSequenceExpression,
                  unbuildPattern(
                    ts_node_left,
                    forkMeta((meta = nextMeta(meta))),
                    {
                      scope,
                      annotation,
                      kind: null,
                      right: makeReadCacheExpression(right, hash),
                    },
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
          node.left,
          forkMeta((meta = nextMeta(meta))),
          mapSequence(
            liftSequence__X(
              makeExpressionAssigner,
              "new",
              UPDATE_OPERATOR_RECORD[node.operator],
              // eslint-disable-next-line no-use-before-define
              unbuildNameExpression(
                node.right,
                forkMeta((meta = nextMeta(meta))),
                {
                  scope,
                  annotation,
                  name:
                    hasNarrowKey(
                      LOGICAL_ASSIGNMENT_OPERATOR_RECORD,
                      node.operator,
                    ) && node.left.type === "Identifier"
                      ? { type: "assignment", variable: node.left.name }
                      : { type: "anonymous" },
                },
              ),
            ),
            (assigner) => ({ scope, annotation, assigner }),
          ),
        );
      }
    }
    case "UpdateExpression": {
      return unbuildUpdateExpression(
        node.argument,
        forkMeta((meta = nextMeta(meta))),
        {
          scope,
          annotation,
          assigner: {
            result: node.prefix ? "new" : "old",
            operator: UPDATE_OPERATOR_RECORD[node.operator],
            increment: null,
          },
        },
      );
    }
    case "UnaryExpression": {
      switch (node.operator) {
        case "typeof": {
          if (node.argument.type === "Identifier") {
            return makeScopeLoadExpression(
              hash,
              forkMeta((meta = nextMeta(meta))),
              scope,
              {
                type: "typeof",
                mode: getMode(scope),
                variable: node.argument.name,
              },
            );
          } else {
            return liftSequence_X_(
              makeUnaryExpression,
              node.operator,
              unbuildExpression(
                node.argument,
                forkMeta((meta = nextMeta(meta))),
                { scope, annotation },
              ),
              hash,
            );
          }
        }
        case "delete": {
          return unbuildDeleteArgument(
            node.argument,
            forkMeta((meta = nextMeta(meta))),
            { scope, annotation },
          );
        }
        default: {
          return liftSequence_X_(
            makeUnaryExpression,
            node.operator,
            unbuildExpression(
              node.argument,
              forkMeta((meta = nextMeta(meta))),
              { scope, annotation },
            ),
            hash,
          );
        }
      }
    }
    case "BinaryExpression": {
      if (node.left.type === "PrivateIdentifier") {
        return callSequence___X(
          makeScopeLoadExpression,
          hash,
          forkMeta((meta = nextMeta(meta))),
          scope,
          liftSequence_X_(
            makeHasPrivateOperation,
            getMode(scope),
            unbuildExpression(node.right, forkMeta((meta = nextMeta(meta))), {
              scope,
              annotation,
            }),
            node.left.name,
          ),
        );
      } else {
        return liftSequence_XX_(
          makeBinaryExpression,
          node.operator,
          unbuildExpression(node.left, forkMeta((meta = nextMeta(meta))), {
            scope,
            annotation,
          }),
          unbuildExpression(node.right, forkMeta((meta = nextMeta(meta))), {
            scope,
            annotation,
          }),
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
                node.expressions[index],
                forkMeta((meta = nextMeta(meta))),
                { scope, annotation },
              ),
            ),
          ),
        ),
        unbuildExpression(
          node.expressions[node.expressions.length - 1],
          forkMeta((meta = nextMeta(meta))),
          { scope, annotation },
        ),
        hash,
      );
    }
    case "ConditionalExpression": {
      return liftSequenceXXX_(
        makeConditionalExpression,
        unbuildExpression(node.test, forkMeta((meta = nextMeta(meta))), {
          scope,
          annotation,
        }),
        unbuildExpression(node.consequent, forkMeta((meta = nextMeta(meta))), {
          scope,
          annotation,
        }),
        unbuildExpression(node.alternate, forkMeta((meta = nextMeta(meta))), {
          scope,
          annotation,
        }),
        hash,
      );
    }
    case "LogicalExpression": {
      return incorporateExpression(
        bindSequence(
          callSequence_X_(
            cacheConstant,
            forkMeta((meta = nextMeta(meta))),
            unbuildExpression(node.left, forkMeta((meta = nextMeta(meta))), {
              scope,
              annotation,
            }),
            hash,
          ),
          (left) => {
            switch (node.operator) {
              case "&&": {
                return liftSequence_X__(
                  makeConditionalExpression,
                  makeReadCacheExpression(left, hash),
                  unbuildExpression(
                    node.right,
                    forkMeta((meta = nextMeta(meta))),
                    { scope, annotation },
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
                    node.right,
                    forkMeta((meta = nextMeta(meta))),
                    { scope, annotation },
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
                    node.right,
                    forkMeta((meta = nextMeta(meta))),
                    { scope, annotation },
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
        unbuildExpression(node.argument, forkMeta((meta = nextMeta(meta))), {
          scope,
          annotation,
        }),
        hash,
      );
    }
    case "YieldExpression": {
      return liftSequence_X_(
        makeYieldExpression,
        node.delegate,
        node.argument != null
          ? unbuildExpression(
              node.argument,
              forkMeta((meta = nextMeta(meta))),
              { scope, annotation },
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
          callSequence___X(
            makeCallExpression,
            hash,
            forkMeta((meta = nextMeta(meta))),
            scope,
            liftSequenceXX(
              makeCall,
              unbuildCallee(node.callee, forkMeta((meta = nextMeta(meta))), {
                scope,
                annotation,
              }),
              unbuildArgumentList(
                node.arguments,
                forkMeta((meta = nextMeta(meta))),
                { hash, scope, annotation },
              ),
            ),
          ),
          hash,
        );
      }
    }
    case "ArrayExpression": {
      if (everyNarrow(node.elements, isItemRegular)) {
        return liftSequenceX_(
          makeArrayExpression,
          flatSequence(
            map(node.elements, (node) =>
              unbuildExpression(node, forkMeta((meta = nextMeta(meta))), {
                scope,
                annotation,
              }),
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
            map(node.elements, (node) => {
              if (node != null) {
                return unbuildSpreadable(
                  node,
                  forkMeta((meta = nextMeta(meta))),
                  { scope, annotation },
                );
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
          hash,
          forkMeta((meta = nextMeta(meta))),
          scope,
          {
            type: "read-import",
            mode: getMode(scope),
          },
        ),
        makeIntrinsicExpression("undefined", hash),
        liftSequenceX(
          concat_,
          unbuildExpression(node.source, forkMeta((meta = nextMeta(meta))), {
            scope,
            annotation,
          }),
        ),
        hash,
      );
    }
    case "NewExpression": {
      if (everyNarrow(node.arguments, isNotSpreadElement)) {
        return liftSequenceXX_(
          makeConstructExpression,
          unbuildExpression(node.callee, forkMeta((meta = nextMeta(meta))), {
            scope,
            annotation,
          }),
          flatSequence(
            map(node.arguments, (node) =>
              unbuildExpression(node, forkMeta((meta = nextMeta(meta))), {
                scope,
                annotation,
              }),
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
            unbuildExpression(node.callee, forkMeta((meta = nextMeta(meta))), {
              scope,
              annotation,
            }),
            liftSequence__X_(
              makeApplyExpression,
              makeIntrinsicExpression("Array.prototype.concat", hash),
              makeArrayExpression([], hash),
              flatSequence(
                map(node.arguments, (node) =>
                  unbuildSpreadable(node, forkMeta((meta = nextMeta(meta))), {
                    scope,
                    annotation,
                  }),
                ),
              ),
              hash,
            ),
          ),
          hash,
        );
      }
    }
    case "ChainExpression": {
      return resolveChain(
        unbuildChainElement(
          node.expression,
          forkMeta((meta = nextMeta(meta))),
          { scope, annotation },
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
        return callSequence___X(
          makeGetMemberExpression,
          hash,
          forkMeta((meta = nextMeta(meta))),
          scope,
          liftSequenceXX(
            makeGetMember,
            unbuildObject(node.object, forkMeta((meta = nextMeta(meta))), {
              scope,
              annotation,
            }),
            unbuildKey(node.property, forkMeta((meta = nextMeta(meta))), {
              scope,
              annotation,
              computed: node.computed,
            }),
          ),
        );
      }
    }
    case "ObjectExpression": {
      return bindSequence(
        unbuildPrototype(node, forkMeta((meta = nextMeta(meta))), {
          scope,
          annotation,
        }),
        ({ prototype, properties }) => {
          if (
            everyNarrow(properties, isPlainPropertyNode) &&
            !some(properties, isProtoProperty)
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
                      unbuildInitProperty(
                        property,
                        forkMeta((meta = nextMeta(meta))),
                        {
                          scope,
                          annotation,
                        },
                      ),
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
                          unbuildProperty(
                            property,
                            forkMeta((meta = nextMeta(meta))),
                            { self, scope, annotation },
                          ),
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
 *   node: import("estree-sentry").Expression<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context & {
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
            : { type: "assignment", variable: node.id.name },
      });
    }
    case "ClassExpression": {
      return unbuildClass(node, meta, {
        scope,
        annotation,
        name:
          node.id == null
            ? name
            : { type: "assignment", variable: node.id.name },
      });
    }
    default: {
      return unbuildExpression(node, meta, { scope, annotation });
    }
  }
};
