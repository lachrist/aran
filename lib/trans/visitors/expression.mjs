import {
  everyNarrow,
  mapIndex,
  some,
  map,
  hasOwn,
  hasNarrowKey,
  concat_X,
  concat_,
  flat,
  concat__,
  flatenTree,
  bindSequence,
  callSequence_X_,
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
  slice,
} from "../../util/index.mjs";
import { AranExecError, AranTypeError } from "../../error.mjs";
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
import { transEffect } from "./effect.mjs";
import { transFunction } from "./function.mjs";
import { transSpreadable } from "./spreadable.mjs";
import { transQuasi } from "./quasi.mjs";
import {
  isProtoProperty,
  transInitProperty,
  transProperty,
  transProtoProperty,
} from "./property.mjs";
import { transClass } from "./class.mjs";
import { transDeleteArgument } from "./delete.mjs";
import {
  makeReadCacheExpression,
  cacheConstant,
  cacheWritable,
  makeWriteCacheEffect,
  cacheTemplate,
} from "../cache.mjs";
import { transChainElement } from "./chain.mjs";
import { transArgumentList } from "./argument.mjs";
import { makeCall, makeCallExpression } from "../call.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { transCallee } from "./callee.mjs";
import {
  makeHasPrivateExpression,
  makeHasPrivateOperation,
  makeReadImportExpression,
  makeReadImportMetaExpression,
  makeReadNewTargetExpression,
  makeReadThisExpression,
  makeReadVariableExpression,
  makeTypeofVariableExpression,
} from "../scope/index.mjs";
import { transWritePattern } from "./pattern.mjs";
import { transObject } from "./object.mjs";
import { transKey } from "./key.mjs";
import {
  listSetMemberEffect,
  makeGetMemberExpression,
  makeGetMember,
  makeSetMember,
} from "../member.mjs";
import { UPDATE_OPERATOR_RECORD, transUpdateExpression } from "./update.mjs";
import {
  resolveChain,
  incorporateExpression,
  initSyntaxErrorExpression,
} from "../prelude/index.mjs";
import { makeSpreadArgumentList } from "../arguments.mjs";
import { makeExpressionAssigner } from "../assigner.mjs";
import { ANONYMOUS_NAME } from "../name.mjs";
import { PLAIN_CLOSURE } from "../closure.mjs";

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
 *   node: import("estree-sentry").SpreadableObjectProperty<import("../hash.d.ts").HashProp>,
 * ) => node is import("estree-sentry").ValueObjectProperty<import("../hash.d.ts").HashProp>}
 */
const isPlainPropertyNode = (node) =>
  node.type === "Property" && node.kind === "init" && !node.method;

/**
 * @type {(
 *   node: import("estree-sentry").ObjectExpression<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *  import("../prelude/index.d.ts").BodyPrelude,
 *  {
 *    prototype: import("../atom.d.ts").Expression,
 *    properties: (
 *      | import("estree-sentry").SpreadElement<import("../hash.d.ts").HashProp>
 *      | import("estree-sentry").ObjectProperty<import("../hash.d.ts").HashProp>
 *    )[],
 *  },
 * >}
 */
const transPrototype = (node, meta, scope) => {
  const { _hash: hash } = node;
  if (node.properties.length === 0) {
    return zeroSequence({
      prototype: makeIntrinsicExpression("Object.prototype", hash),
      properties: [],
    });
  } else {
    const head = node.properties[0];
    if (isProtoProperty(head)) {
      return mapSequence(
        transProtoProperty(head, forkMeta((meta = nextMeta(meta))), scope),
        (prototype) => ({
          prototype,
          properties: slice(node.properties, 1, node.properties.length),
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
//  *   node: import("estree-sentry").NewExpression<import("../../hash.d.ts").HashProp>
//  * ) => node is import("estree-sentry").NewExpression<import("../../hash.d.ts").HashProp> & {
//  *   callee: import("estree-sentry").Expression<import("../../hash.d.ts").HashProp>,
//  * }}
//  */
// const isNotSuperNew = (node) => node.callee.type !== "Super";

/**
 * @type {(
 *   node: (
 *     | null
 *     | import("estree-sentry").SpreadableExpression<import("../hash.d.ts").HashProp>
 *   ),
 * ) => node is import("estree-sentry").Expression<import("../hash.d.ts").HashProp>}
 */
const isItemRegular = (node) => node != null && node.type !== "SpreadElement";

/**
 * @type {(
 *   node: import("estree-sentry").SpreadableExpression<import("../hash.d.ts").HashProp>,
 * ) => node is import("estree-sentry").Expression<import("../hash.d.ts").HashProp>}
 */
const isNotSpreadElement = (node) => node.type !== "SpreadElement";

// /**
//  * @type {(
//  *   node: import("estree-sentry").ArrayExpression<import("../../hash.d.ts").HashProp>,
//  * ) => node is import("estree-sentry").ArrayExpression<import("../../hash.d.ts").HashProp> & {
//  *   elements: import("estree-sentry").Expression<import("../../hash.d.ts").HashProp>[],
//  * }}
//  */
// const isArrayRegular = (node) => everyNarrow(node.elements, isItemRegular);

// /**
//  * @type {(
//  *   node: import("estree-sentry").SpreadElement<import("../../hash.d.ts").HashProp> | import("estree-sentry").Expression<import("../../hash.d.ts").HashProp>
//  * ) => node is import("estree-sentry").Expression<import("../../hash.d.ts").HashProp>}
//  */
// const isNotSpreadArgument = (node) => node.type !== "SpreadElement";

// /**
//  * @type {(
//  *   node: import("estree-sentry").NewExpression<import("../../hash.d.ts").HashProp> & {
//  *     callee: import("estree-sentry").Expression<import("../../hash.d.ts").HashProp>,
//  *   },
//  * ) => node is import("estree-sentry").NewExpression<import("../../hash.d.ts").HashProp> & {
//  *   callee: import("estree-sentry").Expression<import("../../hash.d.ts").HashProp>,
//  *   arguments: import("estree-sentry").Expression<import("../../hash.d.ts").HashProp>[],
//  * }}
//  */
// const isNotSpreadNew = (node) =>
//   everyNarrow(node.arguments, isNotSpreadArgument);

// /**
//  * @type {(
//  *   node: import("estree-sentry").YieldExpression<import("../../hash.d.ts").HashProp>
//  * ) => node is import("estree-sentry").YieldExpression<import("../../hash.d.ts").HashProp> & {
//  *   argument: import("estree-sentry").Expression<import("../../hash.d.ts").HashProp>,
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
 *   hash: import("../hash.d.ts").Hash,
 * ) => import("../atom.d.ts").Expression}
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
 *   node: import("estree-sentry").Expression<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   import("../atom.d.ts").Expression,
 * >}
 */
export const transExpression = (node, meta, scope) => {
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
          scope.mode === "strict" &&
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
          flatSequence(
            flatenTree([
              mapIndex(node.expressions.length, (index) => [
                transQuasi(
                  node.quasis[index],
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                  { cooked: true },
                ),
                transExpression(
                  node.expressions[index],
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                ),
              ]),
              transQuasi(
                node.quasis[node.quasis.length - 1],
                forkMeta((meta = nextMeta(meta))),
                scope,
                { cooked: true },
              ),
            ]),
          ),
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
            transCallee(node.tag, forkMeta((meta = nextMeta(meta))), scope),
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
                    transExpression(
                      node,
                      forkMeta((meta = nextMeta(meta))),
                      scope,
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
      return makeReadThisExpression(hash, meta, scope, {});
    }
    case "MetaProperty": {
      if (node.meta.name === "new" && node.property.name === "target") {
        return makeReadNewTargetExpression(hash, meta, scope, {});
      } else if (node.meta.name === "import" && node.property.name === "meta") {
        return makeReadImportMetaExpression(hash, meta, scope, {});
      } else {
        return initSyntaxErrorExpression(
          `Illegal meta property: '${node.meta.name}.${node.property.name}'`,
          hash,
        );
      }
    }
    case "Identifier": {
      return makeReadVariableExpression(hash, meta, scope, {
        variable: node.name,
      });
    }
    case "ArrowFunctionExpression": {
      return transFunction(node, meta, scope, PLAIN_CLOSURE, ANONYMOUS_NAME);
    }
    case "FunctionExpression": {
      return transFunction(
        node,
        meta,
        scope,
        PLAIN_CLOSURE,
        node.id == null
          ? ANONYMOUS_NAME
          : { type: "assignment", variable: node.id.name },
      );
    }
    case "ClassExpression": {
      return transClass(
        node,
        meta,
        scope,
        node.id == null
          ? ANONYMOUS_NAME
          : { type: "assignment", variable: node.id.name },
      );
    }
    case "AssignmentExpression": {
      /** @type {import("../name.d.ts").Name} */
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
            liftSequenceX(
              flatenTree,
              transEffect(node.left, forkMeta((meta = nextMeta(meta))), scope),
            ),
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
            cacheWritable(
              forkMeta((meta = nextMeta(meta))),
              "aran.deadzone_symbol",
            ),
            (result) =>
              liftSequenceX__(
                makeSequenceExpression,
                liftSequenceX(
                  flatenTree,
                  callSequence___X(
                    listSetMemberEffect,
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    scope,
                    liftSequenceXXX(
                      makeSetMember,
                      transObject(
                        ts_node_left.object,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                      ),
                      transKey(
                        ts_node_left.property,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        ts_node_left.computed,
                      ),
                      liftSequenceX__(
                        makeSequenceExpression,
                        liftSequenceX(
                          concat_,
                          liftSequence_X_(
                            makeWriteCacheEffect,
                            result,
                            transExpression(
                              node.right,
                              forkMeta((meta = nextMeta(meta))),
                              scope,
                            ),
                            hash,
                          ),
                        ),
                        makeReadCacheExpression(result, hash),
                        hash,
                      ),
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
                transNameExpression(
                  node.right,
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                  name,
                ),
                hash,
              ),
              (right) =>
                liftSequenceX__(
                  makeSequenceExpression,
                  liftSequenceX(
                    flatenTree,
                    transWritePattern(
                      ts_node_left,
                      forkMeta((meta = nextMeta(meta))),
                      scope,
                      makeReadCacheExpression(right, hash),
                    ),
                  ),
                  makeReadCacheExpression(right, hash),
                  hash,
                ),
            ),
            hash,
          );
        }
      } else {
        return callSequence___X(
          transUpdateExpression,
          node.left,
          forkMeta((meta = nextMeta(meta))),
          scope,
          liftSequence__X(
            makeExpressionAssigner,
            "new",
            UPDATE_OPERATOR_RECORD[node.operator],
            // eslint-disable-next-line no-use-before-define
            transNameExpression(
              node.right,
              forkMeta((meta = nextMeta(meta))),
              scope,
              hasNarrowKey(LOGICAL_ASSIGNMENT_OPERATOR_RECORD, node.operator) &&
                node.left.type === "Identifier"
                ? { type: "assignment", variable: node.left.name }
                : ANONYMOUS_NAME,
            ),
          ),
        );
      }
    }
    case "UpdateExpression": {
      return transUpdateExpression(
        node.argument,
        forkMeta((meta = nextMeta(meta))),
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
            return makeTypeofVariableExpression(
              hash,
              forkMeta((meta = nextMeta(meta))),
              scope,
              { variable: node.argument.name },
            );
          } else {
            return liftSequence_X_(
              makeUnaryExpression,
              node.operator,
              transExpression(
                node.argument,
                forkMeta((meta = nextMeta(meta))),
                scope,
              ),
              hash,
            );
          }
        }
        case "delete": {
          return transDeleteArgument(
            node.argument,
            forkMeta((meta = nextMeta(meta))),
            scope,
          );
        }
        default: {
          return liftSequence_X_(
            makeUnaryExpression,
            node.operator,
            transExpression(
              node.argument,
              forkMeta((meta = nextMeta(meta))),
              scope,
            ),
            hash,
          );
        }
      }
    }
    case "BinaryExpression": {
      if (node.left.type === "PrivateIdentifier") {
        return callSequence___X(
          makeHasPrivateExpression,
          hash,
          forkMeta((meta = nextMeta(meta))),
          scope,
          liftSequenceX_(
            makeHasPrivateOperation,
            transExpression(
              node.right,
              forkMeta((meta = nextMeta(meta))),
              scope,
            ),
            node.left.name,
          ),
        );
      } else {
        return liftSequence_XX_(
          makeBinaryExpression,
          node.operator,
          transExpression(node.left, forkMeta((meta = nextMeta(meta))), scope),
          transExpression(node.right, forkMeta((meta = nextMeta(meta))), scope),
          hash,
        );
      }
    }
    case "SequenceExpression": {
      return liftSequenceXX_(
        makeSequenceExpression,
        liftSequenceX(
          flatenTree,
          flatSequence(
            mapIndex(node.expressions.length - 1, (index) =>
              transEffect(
                node.expressions[index],
                forkMeta((meta = nextMeta(meta))),
                scope,
              ),
            ),
          ),
        ),
        transExpression(
          node.expressions[node.expressions.length - 1],
          forkMeta((meta = nextMeta(meta))),
          scope,
        ),
        hash,
      );
    }
    case "ConditionalExpression": {
      return liftSequenceXXX_(
        makeConditionalExpression,
        transExpression(node.test, forkMeta((meta = nextMeta(meta))), scope),
        transExpression(
          node.consequent,
          forkMeta((meta = nextMeta(meta))),
          scope,
        ),
        transExpression(
          node.alternate,
          forkMeta((meta = nextMeta(meta))),
          scope,
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
            transExpression(
              node.left,
              forkMeta((meta = nextMeta(meta))),
              scope,
            ),
            hash,
          ),
          (left) => {
            switch (node.operator) {
              case "&&": {
                return liftSequence_X__(
                  makeConditionalExpression,
                  makeReadCacheExpression(left, hash),
                  transExpression(
                    node.right,
                    forkMeta((meta = nextMeta(meta))),
                    scope,
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
                  transExpression(
                    node.right,
                    forkMeta((meta = nextMeta(meta))),
                    scope,
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
                  transExpression(
                    node.right,
                    forkMeta((meta = nextMeta(meta))),
                    scope,
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
        transExpression(
          node.argument,
          forkMeta((meta = nextMeta(meta))),
          scope,
        ),
        hash,
      );
    }
    case "YieldExpression": {
      return liftSequence_X_(
        makeYieldExpression,
        node.delegate,
        node.argument != null
          ? transExpression(
              node.argument,
              forkMeta((meta = nextMeta(meta))),
              scope,
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
              transCallee(
                node.callee,
                forkMeta((meta = nextMeta(meta))),
                scope,
              ),
              transArgumentList(
                node.arguments,
                forkMeta((meta = nextMeta(meta))),
                scope,
                hash,
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
              transExpression(node, forkMeta((meta = nextMeta(meta))), scope),
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
                return transSpreadable(
                  node,
                  forkMeta((meta = nextMeta(meta))),
                  scope,
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
        makeReadImportExpression(
          hash,
          forkMeta((meta = nextMeta(meta))),
          scope,
          {},
        ),
        makeIntrinsicExpression("undefined", hash),
        liftSequenceX(
          concat_,
          transExpression(
            node.source,
            forkMeta((meta = nextMeta(meta))),
            scope,
          ),
        ),
        hash,
      );
    }
    case "NewExpression": {
      if (everyNarrow(node.arguments, isNotSpreadElement)) {
        return liftSequenceXX_(
          makeConstructExpression,
          transExpression(
            node.callee,
            forkMeta((meta = nextMeta(meta))),
            scope,
          ),
          flatSequence(
            map(node.arguments, (node) =>
              transExpression(node, forkMeta((meta = nextMeta(meta))), scope),
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
            transExpression(
              node.callee,
              forkMeta((meta = nextMeta(meta))),
              scope,
            ),
            liftSequence__X_(
              makeApplyExpression,
              makeIntrinsicExpression("Array.prototype.concat", hash),
              makeArrayExpression([], hash),
              flatSequence(
                map(node.arguments, (node) =>
                  transSpreadable(
                    node,
                    forkMeta((meta = nextMeta(meta))),
                    scope,
                  ),
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
        transChainElement(
          node.expression,
          forkMeta((meta = nextMeta(meta))),
          scope,
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
            transObject(node.object, forkMeta((meta = nextMeta(meta))), scope),
            transKey(
              node.property,
              forkMeta((meta = nextMeta(meta))),
              scope,
              node.computed,
            ),
          ),
        );
      }
    }
    case "ObjectExpression": {
      return bindSequence(
        transPrototype(node, forkMeta((meta = nextMeta(meta))), scope),
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
                      transInitProperty(
                        property,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
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
                      flatenTree,
                      flatSequence(
                        map(properties, (property) =>
                          transProperty(
                            property,
                            forkMeta((meta = nextMeta(meta))),
                            scope,
                            self,
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
 *   node: import("estree-sentry").Expression<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 *   name: import("../name.d.ts").Name,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   import("../atom.d.ts").Expression,
 * >}
 */
export const transNameExpression = (node, meta, scope, name) => {
  switch (node.type) {
    case "ArrowFunctionExpression": {
      return transFunction(node, meta, scope, PLAIN_CLOSURE, name);
    }
    case "FunctionExpression": {
      return transFunction(
        node,
        meta,
        scope,
        PLAIN_CLOSURE,
        node.id == null ? name : { type: "assignment", variable: node.id.name },
      );
    }
    case "ClassExpression": {
      return transClass(
        node,
        meta,
        scope,
        node.id == null ? name : { type: "assignment", variable: node.id.name },
      );
    }
    default: {
      return transExpression(node, meta, scope);
    }
  }
};
