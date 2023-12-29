import {
  map,
  slice,
  hasOwn,
  every,
  mapIndex,
  flatMapIndex,
  findLastIndex,
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
} from "../intrinsic.mjs";
import { unbuildEffect } from "./effect.mjs";
import {
  listSaveUpdateEffect,
  makeLoadUpdateExpression,
  unbuildUpdateLeft,
} from "./update.mjs";
import { makeSyntaxErrorExpression } from "../syntax-error.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildSpreadable } from "./spreadable.mjs";
import { unbuildQuasi } from "./quasi.mjs";
import {
  isProtoProperty,
  unbuildInitNonMethodProperty,
  unbuildInitProperty,
  unbuildProperty,
  unbuildProtoProperty,
} from "./property.mjs";
import { unbuildClass } from "./class.mjs";
import { unbuildDeleteArgument } from "./delete.mjs";
import {
  makeReadCacheExpression,
  cacheConstant,
  cacheSelf,
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
  flatSequence,
  mapSequence,
  mapTwoSequence,
  sequenceCondition,
  sequenceExpression,
  zeroSequence,
} from "../sequence.mjs";
import { drillDeepSite, drillSite, drillVeryDeepSite } from "../site.mjs";
import { forkMeta, nextMeta, packMeta } from "../meta.mjs";
import { unbuildChainCallee } from "./callee.mjs";
import {
  getMode,
  listScopeSaveEffect,
  makeScopeLoadExpression,
} from "../scope/index.mjs";
import { unbuildPattern } from "./pattern.mjs";
import { unbuildObject } from "./object.mjs";
import { unbuildKey } from "./key.mjs";
import { makeGetMemberExpression } from "../member.mjs";

const {
  JSON: { parse: parseJson, stringify: stringifyJson },
} = globalThis;

/**
 * @type {(
 *   site: import("../site").Site<estree.Property | estree.SpreadElement>,
 * ) => site is import("../site").Site<estree.ProtoProperty>}
 */
const isProtoPropertySite = (site) => isProtoProperty(site.node);

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
 * ) => site is import("../site").Site<(
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
 *   properties: (estree.Property & {kind: "init"})[],
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
 *   node: estree.Property & { kind: "init" },
 * ) => node is estree.Property & {
 *   kind: "init",
 *   method: false,
 * }}
 */
const isNotMethodProperty = (node) => !node.method;

/**
 * @type {<N extends estree.Property>(
 *   sites: import("../site").Site<N>[],
 *   scope: import("../scope").Scope,
 *   options: {
 *     path: unbuild.Path,
 *   },
 * ) => {
 *   head: aran.Expression<unbuild.Atom>
 *   tail: import("../site").Site<N>[]
 * }}
 */
const unbuildProto = (sites, scope, { path }) => {
  if (sites.length > 0) {
    const head = sites[0];
    if (isProtoPropertySite(head)) {
      return {
        head: unbuildProtoProperty(head, scope, null),
        tail: slice(sites, 1, sites.length),
      };
    } else {
      return {
        head: makeIntrinsicExpression("Object.prototype", path),
        tail: sites,
      };
    }
  } else {
    return {
      head: makeIntrinsicExpression("Object.prototype", path),
      tail: [],
    };
  }
};

/**
 * @type {(
 *   node: estree.ObjectExpression & {
 *     properties: (estree.Property & {
 *       kind: "init"
 *    })[],
 *   },
 * ) => node is estree.ObjectExpression & {
 *   properties: (estree.Property & {
 *     kind: "init",
 *     method: false,
 *   })[],
 * }}
 */
const isNotMethodObject = (node) => every(node.properties, isNotMethodProperty);

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
 * ) => aran.Expression<unbuild.Atom>}
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
      return sequenceCondition(
        mapSequence(
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
                      sequenceExpression(
                        mapSequence(
                          cacheConstant(
                            forkMeta((meta = nextMeta(meta))),
                            makeApplyExpression(
                              makeIntrinsicExpression("Object.freeze", path),
                              makePrimitiveExpression(
                                { undefined: null },
                                path,
                              ),
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
        return makeSyntaxErrorExpression(
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
          return sequenceExpression(
            mapSequence(
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
                    { operation: "write", right },
                  ),
                  makeReadCacheExpression(right, path),
                  path,
                ),
            ),
            path,
          );
        }
      } else {
        return sequenceExpression(
          bindSequence(
            unbuildUpdateLeft(
              drillSite(node, path, forkMeta((meta = nextMeta(meta))), "left"),
              scope,
              null,
            ),
            (update) => {
              /**
               * @type {() => aran.Expression<unbuild.Atom>}
               */
              const load = () =>
                makeLoadUpdateExpression(
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  scope,
                  { update },
                );
              /**
               * @type {() => aran.Expression<unbuild.Atom>}
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
               *   node: aran.Expression<unbuild.Atom>,
               * ) => aran.Expression<unbuild.Atom>}
               */
              const save = (node) =>
                sequenceExpression(
                  mapSequence(
                    cacheConstant(
                      forkMeta((meta = nextMeta(meta))),
                      node,
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
                  ),
                  path,
                );
              switch (node.operator) {
                case "??=": {
                  return mapSequence(
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
                  return mapSequence(
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
                  return mapSequence(
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
                  return mapSequence(
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
          ),
          path,
        );
      }
    }
    case "UpdateExpression": {
      return sequenceExpression(
        bindSequence(
          unbuildUpdateLeft(
            drillSite(
              node,
              path,
              forkMeta((meta = nextMeta(meta))),
              "argument",
            ),
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
                        zeroSequence(
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
            ),
        ),
        path,
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
        return sequenceExpression(
          mapSequence(
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
          ),
          path,
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
        flatMapIndex(node.expressions.length - 1, (index) =>
          unbuildEffect(
            drillDeepSite(node, path, meta, "expressions", index),
            scope,
            null,
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
      return sequenceExpression(
        mapSequence(
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
                throw new AranTypeError("Invalid logical operator", node);
              }
            }
          },
        ),
        path,
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
      // const metas = splitMeta(meta, [
      //   "drill",
      //   "arguments",
      //   "eval",
      //   "eval_read_1",
      //   "eval_read_2",
      //   "call",
      // ]);
      // const sites = mapObject(
      //   drill({ node, path, meta: metas.drill }, ["callee", "arguments"]),
      //   "arguments",
      //   drillArray,
      // );
      if (node.optional) {
        return makeSyntaxErrorExpression(
          "Illegal optional call outside of chain expression",
          path,
        );
      } else {
        if (isDirectEvalCall(node)) {
          return sequenceExpression(
            mapSequence(
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
                  makeEvalExpression(
                    makeReadCacheExpression(input[0], path),
                    // Deep clone scope to make sure it is an actual json
                    // Additional non-json field suchc as the location
                    // function may be there and cause problem in weave.
                    parseJson(
                      stringifyJson({
                        scope,
                        meta: packMeta(forkMeta((meta = nextMeta(meta)))),
                      }),
                    ),
                    path,
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
            ),
            path,
          );
        } else {
          return sequenceCondition(
            mapSequence(
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
              return makeObjectExpression(
                makePrimitiveExpression(null, path),
                [
                  [
                    makePrimitiveExpression("length", path),
                    makePrimitiveExpression(1, path),
                  ],
                  [
                    makeIntrinsicExpression("Symbol.isConcatSpreadable", path),
                    makePrimitiveExpression(true, path),
                  ],
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
            type: "read-import",
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
        return makeSyntaxErrorExpression(
          "'super' cannot be invoked with 'new'",
          path,
        );
      }
    }
    case "ChainExpression": {
      return sequenceCondition(
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
        return makeSyntaxErrorExpression(
          "Illegal optional member outside of chain expression",
          path,
        );
      } else {
        return sequenceExpression(
          mapTwoSequence(
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
            (object, key) =>
              makeGetMemberExpression(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                { object, key },
              ),
          ),
          path,
        );
      }
    }
    case "ObjectExpression": {
      if (node.properties.length === 0) {
        return makeObjectExpression(
          makeIntrinsicExpression("Object.prototype", path),
          [],
          path,
        );
      } else {
        if (isInitObject(node)) {
          if (isNotMethodObject(node)) {
            const { head, tail } = unbuildProto(
              mapIndex(node.properties.length, (index) =>
                drillDeepSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "properties",
                  index,
                ),
              ),
              scope,
              { path },
            );
            return makeObjectExpression(
              head,
              map(tail, (site) =>
                makeUglyProperty(
                  unbuildInitNonMethodProperty(site, scope, null),
                  path,
                ),
              ),
              path,
            );
          } else {
            const { head, tail } = unbuildProto(
              mapIndex(node.properties.length, (index) =>
                drillDeepSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "properties",
                  index,
                ),
              ),
              scope,
              { path },
            );
            return sequenceExpression(
              mapSequence(
                cacheSelf(
                  forkMeta((meta = nextMeta(meta))),
                  (self) =>
                    makeObjectExpression(
                      head,
                      map(tail, (site) =>
                        makeUglyProperty(
                          unbuildInitProperty(site, scope, { self }),
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
          }
        } else {
          return sequenceExpression(
            mapSequence(
              cacheConstant(
                forkMeta((meta = nextMeta(meta))),
                makeObjectExpression(
                  makeIntrinsicExpression("Object.prototype", path),
                  [],
                  path,
                ),
                path,
              ),
              (self) =>
                makeSequenceExpression(
                  flatMapIndex(node.properties.length, (index) =>
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
                  makeReadCacheExpression(self, path),
                  path,
                ),
            ),
            path,
          );
        }
      }
    }
    default: {
      throw new AranTypeError("invalid expression node", node);
    }
  }
};

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.Expression>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     name: import("../name.js").Name,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
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
