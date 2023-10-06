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

const {
  Reflect: { apply },
  String: {
    prototype: { slice: sliceString },
  },
} = globalThis;

const BASENAME = /** @basename */ "expression";

/**
 * @type {<N extends estree.Property | estree.SpreadElement, S>(
 *   pair: {
 *     node: N,
 *     path: unbuild.Path,
 *   }[],
 *   context: import("../context.js").Context<S>,
 *   options: { serial: S },
 * ) => {
 *   prototype: aran.Expression<unbuild.Atom<S>>,
 *   properties: {
 *     node: N,
 *     path: unbuild.Path,
 *   }[],
 * }}
 */
const extractPrototype = (pairs, context, { serial }) =>
  pairs.length > 0 && isProtoProperty(pairs[0].node)
    ? {
        prototype: unbuildProtoProperty(/** @type {any} */ (pairs[0]), context),
        properties: slice(pairs, 1, pairs.length),
      }
    : {
        prototype: makeIntrinsicExpression("Object.prototype", serial),
        properties: pairs,
      };

/** @type {(node: estree.Node) => boolean} */
const isSuperProperty = (node) =>
  node.type === "Property" && (node.method || node.kind !== "init");

/**
 * @type {<S>(
 *   pair: {
 *     node: estree.Expression,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context<S>,
 *   options: { name: import("../name.mjs").Name }
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const unbuildExpression = ({ node, path }, context, { name }) => {
  const { serialize, digest } = context;
  const serial = serialize(node, path);
  const hash = digest(node, path);
  switch (node.type) {
    case "Literal":
      if (hasOwn(node, "regex")) {
        return makeApplyExpression(
          makeIntrinsicExpression("RegExp", serial),
          makePrimitiveExpression({ undefined: null }, serial),
          [
            makePrimitiveExpression(
              /** @type {estree.RegExpLiteral} */ (node).regex.pattern,
              serial,
            ),
            makePrimitiveExpression(
              /** @type {estree.RegExpLiteral} */ (node).regex.flags,
              serial,
            ),
          ],
          serial,
        );
      } else if (hasOwn(node, "bigint")) {
        return makePrimitiveExpression(
          { bigint: /** @type {estree.BigIntLiteral} */ (node).bigint },
          serial,
        );
      } else {
        return makePrimitiveExpression(
          /** @type {estree.SimpleLiteral} */ (node).value,
          serial,
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
              serial,
            ),
            accumulation,
            serial,
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
              makeIntrinsicExpression("Object.freeze", serial),
              makePrimitiveExpression({ undefined: null }, serial),
              [
                makeApplyExpression(
                  makeIntrinsicExpression("Object.defineProperty", serial),
                  makePrimitiveExpression({ undefined: null }, serial),
                  [
                    makeArrayExpression(
                      map(
                        drillAll(
                          drillArray(drill({ node, path }, "quasi"), "quasis"),
                        ),
                        (pair) => unbuildQuasi(pair, context, { cooked: true }),
                      ),
                      serial,
                    ),
                    makePrimitiveExpression("raw", serial),
                    makeDataDescriptorExpression(
                      makePrimitiveExpression(false, serial),
                      makePrimitiveExpression(false, serial),
                      makePrimitiveExpression(false, serial),
                      makeApplyExpression(
                        makeIntrinsicExpression("Object.freeze", serial),
                        makePrimitiveExpression({ undefined: null }, serial),
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
                            serial,
                          ),
                        ],
                        serial,
                      ),
                      serial,
                    ),
                  ],
                  serial,
                ),
              ],
              serial,
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
      return makeThisExpression(context, { serial, origin: node });
    case "MetaProperty":
      if (node.meta.name === "new" && node.property.name === "target") {
        return makeNewTargetExpression(context, { serial, origin: node });
      } else if (node.meta.name === "import" && node.property.name === "meta") {
        return makeImportMetaExpression(context, { serial, origin: node });
      } else {
        throw new DynamicError("invalid meta property", node);
      }
    case "Identifier":
      return makeScopeReadExpression(
        context,
        /** @type {estree.Variable} */ (node.name),
        serial,
      );
    case "AssignmentExpression":
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
              serial,
            ),
            serial,
          );
        } else {
          const right = mangleMetaVariable(hash, BASENAME, "right");
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
                serial,
                true,
              ),
              ...unbuildPatternEffect(
                drill({ node, path }, "left"),
                context,
                right,
              ),
            ],
            makeReadExpression(right, serial),
            serial,
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
          serial,
          hash,
        });
      }
    case "UpdateExpression":
      return unbuildUpdateExpression(
        drill({ node, path }, "argument"),
        context,
        {
          update: makePrimitiveExpression(1, serial),
          prefix: node.prefix,
          operator: /** @type {estree.BinaryOperator} */ (node.operator[0]),
          serial,
          hash,
        },
      );
    case "UnaryExpression":
      switch (node.operator) {
        case "typeof":
          return node.argument.type === "Identifier"
            ? makeScopeTypeofExpression(
                context,
                /** @type {estree.Variable} */ (node.argument.name),
                serial,
              )
            : makeUnaryExpression(
                node.operator,
                unbuildExpression(drill({ node, path }, "argument"), context, {
                  name: ANONYMOUS,
                }),
                serial,
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
            serial,
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
        serial,
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
        serial,
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
        serial,
      );
    case "LogicalExpression": {
      const left = mangleMetaVariable(hash, BASENAME, "left");
      const setup = makeWriteEffect(
        left,
        unbuildExpression(drill({ node, path }, "left"), context, {
          name: ANONYMOUS,
        }),
        serial,
        true,
      );
      switch (node.operator) {
        case "&&":
          return makeSequenceExpression(
            setup,
            makeConditionalExpression(
              makeReadExpression(left, serial),
              unbuildExpression(drill({ node, path }, "right"), context, {
                name: ANONYMOUS,
              }),
              makeReadExpression(left, serial),
              serial,
            ),
            serial,
          );
        case "||":
          return makeSequenceExpression(
            setup,
            makeConditionalExpression(
              makeReadExpression(left, serial),
              makeReadExpression(left, serial),
              unbuildExpression(drill({ node, path }, "right"), context, {
                name: ANONYMOUS,
              }),
              serial,
            ),
            serial,
          );
        case "??":
          return makeSequenceExpression(
            setup,
            makeConditionalExpression(
              makeBinaryExpression(
                "==",
                makeReadExpression(left, serial),
                makePrimitiveExpression(null, serial),
                serial,
              ),
              unbuildExpression(drill({ node, path }, "right"), context, {
                name: ANONYMOUS,
              }),
              makeReadExpression(left, serial),
              serial,
            ),
            serial,
          );
        default:
          throw new SyntaxAranError("Invalid logical operator", node);
      }
    }
    case "AwaitExpression":
      return makeAwaitExpression(
        unbuildExpression(drill({ node, path }, "argument"), context, {
          name: ANONYMOUS,
        }),
        serial,
      );
    case "YieldExpression":
      return makeYieldExpression(
        node.delegate,
        hasArgument(node)
          ? unbuildExpression(drill({ node, path }, "argument"), context, {
              name: ANONYMOUS,
            })
          : makePrimitiveExpression({ undefined: null }, serial),
        serial,
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
        const caches = map(
          drillAll(drillArray({ node, path }, "arguments")),
          ({ node, path }) => ({
            var: mangleMetaVariable(hash, BASENAME, `eval_arg_${index}`),
            val: unbuildExpression({ node, path }, context, {
              name: ANONYMOUS,
            }),
          }),
        );
        return makeLongSequenceExpression(
          map(caches, (cache) =>
            makeWriteEffect(cache.var, cache.val, serial, true),
          ),
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeScopeReadExpression(
                context,
                /** @type {estree.Variable} */ ("eval"),
                serial,
              ),
              makeIntrinsicExpression("eval", serial),
              serial,
            ),
            makeEvalExpression(
              makeReadExpression(caches[0].var, serial),
              serial,
              {
                ...context,
                path,
              },
            ),
            makeApplyExpression(
              makeScopeReadExpression(
                context,
                /** @type {estree.Variable} */ ("eval"),
                serial,
              ),
              makePrimitiveExpression({ undefined: null }, serial),
              map(caches, (cache) => makeReadExpression(cache.var, serial)),
              serial,
            ),
            serial,
          ),
          serial,
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
                  makeIntrinsicExpression("Array.prototype.concat", serial),
                  makeArrayExpression([], serial),
                  map(
                    drillAll(drillArray({ node, path }, "arguments")),
                    (pair) => unbuildSpreadable(pair, context),
                  ),
                  serial,
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
          serial,
        );
      } else {
        return makeApplyExpression(
          makeIntrinsicExpression("Array.prototype.concat", serial),
          makeArrayExpression([], serial),
          map(
            drillAll(drillArray({ node, path }, "elements")),
            ({ node, path }) =>
              node === null
                ? // Array(1) is succeptible to pollution of
                  // Array.prototype and Object.prototype
                  makeObjectExpression(
                    makePrimitiveExpression(null, serial),
                    [
                      [
                        makePrimitiveExpression("length", serial),
                        makePrimitiveExpression(1, serial),
                      ],
                      [
                        makeIntrinsicExpression(
                          "Symbol.isConcatSpreadable",
                          serial,
                        ),
                        makePrimitiveExpression(true, serial),
                      ],
                    ],
                    serial,
                  )
                : unbuildSpreadable({ node, path }, context),
          ),
          serial,
        );
      }
    }
    case "ImportExpression":
      return makeApplyExpression(
        makeReadExpression("import", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [
          unbuildExpression(drill({ node, path }, "source"), context, {
            name: ANONYMOUS,
          }),
        ],
        serial,
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
          serial,
        );
      } else {
        return makeApplyExpression(
          makeIntrinsicExpression("Reflect.construct", serial),
          makePrimitiveExpression({ undefined: null }, serial),
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
              makeIntrinsicExpression("Array.prototype.concat", serial),
              makeArrayExpression([], serial),
              map(drillAll(drillArray({ node, path }, "arguments")), (pair) =>
                unbuildSpreadable(pair, context),
              ),
              serial,
            ),
          ],
          serial,
        );
      }
    case "ChainExpression":
      return unbuildExpression(drill({ node, path }, "expression"), context, {
        name: ANONYMOUS,
      });
    case "MemberExpression":
      if (node.optional) {
        if (isNotSuperMemberExpression(node)) {
          const object = mangleMetaVariable(hash, BASENAME, "object");
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
              serial,
              true,
            ),
            makeConditionalExpression(
              makeBinaryExpression(
                "==",
                makeReadExpression(object, serial),
                makePrimitiveExpression(null, serial),
                serial,
              ),
              makePrimitiveExpression({ undefined: null }, serial),
              makeGetExpression(
                makeReadExpression(object, serial),
                unbuildKeyExpression(
                  drill({ node, path }, "property"),
                  context,
                  node,
                ),
                serial,
              ),
              serial,
            ),
            serial,
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
            serial,
          );
        } else {
          return makeGetSuperExpression(
            context,
            unbuildKeyExpression(
              drill({ node, path }, "property"),
              context,
              node,
            ),
            { serial, origin: node },
          );
        }
      }
    case "ObjectExpression": {
      if (isInitObjectExpression(node)) {
        const { prototype, properties } = extractPrototype(
          drillAll(drillArray({ node, path }, "properties")),
          context,
          { serial },
        );
        if (some(node.properties, isSuperProperty)) {
          const self_var = mangleMetaVariable(hash, BASENAME, "self");
          const self_val = makeObjectExpression(
            prototype,
            map(properties, (pair) =>
              unbuildInitProperty(pair, context, {
                self: self_var,
              }),
            ),
            serial,
          );
          return makeSequenceExpression(
            makeWriteEffect(self_var, self_val, serial, true),
            makeReadExpression(self_var, serial),
            serial,
          );
        } else {
          return makeObjectExpression(
            prototype,
            map(properties, (pair) =>
              unbuildInitProperty(pair, context, {
                self: null,
              }),
            ),
            serial,
          );
        }
      } else {
        const { prototype, properties } = extractPrototype(
          drillAll(drillArray({ node, path }, "properties")),
          context,
          { serial },
        );
        const self = mangleMetaVariable(hash, BASENAME, "self");
        return makeLongSequenceExpression(
          [
            makeWriteEffect(
              self,
              makeObjectExpression(prototype, [], serial),
              serial,
              true,
            ),
            ...flatMap(properties, (pair) =>
              unbuildProperty(pair, context, { self }),
            ),
          ],
          makeReadExpression(self, serial),
          serial,
        );
      }
    }
    default:
      throw new StaticError("invalid expression node", node);
  }
};
