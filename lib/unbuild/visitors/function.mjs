// https://tc39.github.io/ecma262/#sec-function-instances

import { SyntaxAranError } from "../../error.mjs";
import {
  hasFreeVariable,
  hoistClosure,
  isClosureStrict,
  listPatternVariable,
} from "../query/index.mjs";
import {
  StaticError,
  enumerate,
  every,
  filterOut,
  flatMap,
  hasOwn,
  includes,
  map,
  removeDuplicate,
} from "../../util/index.mjs";
import {
  makeAccessorDescriptorExpression,
  makeDataDescriptorExpression,
  makeGetExpression,
  makeLongSequenceExpression,
} from "../intrinsic.mjs";
import { mangleMetaVariable } from "../mangle.mjs";
import { ANONYMOUS, makeNameExpression } from "../name.mjs";
import {
  makeApplyExpression,
  makeBlockStatement,
  makeConditionalExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeFunctionExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeWriteEffect,
} from "../node.mjs";
import { makeScopeClosureBlock } from "../scope/block.mjs";
import { listScopeInitializeStatement } from "../scope/index.mjs";
import { unbuildControlBlock } from "./block.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildPatternStatement } from "./pattern.mjs";
import { drill, drillAll, drillArray } from "../../drill.mjs";
import { isBlockFunction, isExpressionFunction } from "../predicate.mjs";

const {
  Object: { values: listValue, fromEntries: reduceEntry },
} = globalThis;

const BASENAME = /** @type {__basename} */ ("function");

/**
 * @typedef {null | {
 *   origin: estree.Variable,
 *   target: unbuild.Variable,
 * }} Hidden
 */

// Two different scope frame:
// ==========================
// > function f (x = y) { var y; return x; }
// undefined
// > y
// Thrown:
// ReferenceError: y is not defined
// > f()
// Thrown:
// ReferenceError: y is not defined
//     at f (repl:1:17)

/** @type {(node: estree.Pattern) => boolean} */
const isRestElement = ({ type }) => type === "RestElement";

/**
 * @type {(
 *   variable: estree.Variable,
 * ) => [estree.Variable, estree.VariableKind]}
 */
const makeLetEntry = (variable) => [variable, "let"];

/**
 * @type {(
 *   kind: aran.FunctionKind,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeCompletion = (kind) => {
  switch (kind) {
    case "arrow":
      return makePrimitiveExpression({ undefined: null });
    case "method":
      return makePrimitiveExpression({ undefined: null });
    case "function":
      return makeConditionalExpression(
        makeReadExpression("new.target"),
        makeReadExpression("this"),
        makePrimitiveExpression({ undefined: null }),
      );
    case "constructor":
      return makeReadExpression("this");
    default:
      throw new StaticError("invalid function kind", kind);
  }
};

/**
 * @type {(
 *   pair: {
 *     node: estree.Pattern,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: { index: number },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
const unbuildParameter = ({ node, path }, context, { index }) => {
  const argument = mangleMetaVariable(
    BASENAME,
    /** @type {__unique} */ ("argument"),
    path,
  );
  return [
    makeEffectStatement(
      makeWriteEffect(
        argument,
        node.type === "RestElement"
          ? makeApplyExpression(
              makeIntrinsicExpression("Array.prototype.slice"),
              makeReadExpression("function.arguments"),
              [makePrimitiveExpression(index)],
            )
          : makeGetExpression(
              makeReadExpression("function.arguments"),
              makePrimitiveExpression(index),
            ),
        true,
      ),
    ),
    ...unbuildPatternStatement({ node, path }, context, { right: argument }),
  ];
};

/**
 * @type {(
 *   pairs: {
 *     node: estree.Pattern,
 *     path: unbuild.Path,
 *   }[],
 *   context: import("../context.js").Context,
 *   options: {
 *     self: unbuild.Variable,
 *     callee: Hidden,
 *     arguments: Hidden,
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
const listHeadStatement = (pairs, context, options) => [
  ...(options.callee === null
    ? []
    : listScopeInitializeStatement(
        context,
        options.callee.origin,
        options.callee.target,
      )),
  ...(options.arguments === null
    ? []
    : [
        makeEffectStatement(
          makeWriteEffect(
            options.arguments.target,
            makeApplyExpression(
              makeIntrinsicExpression("Object.fromEntries"),
              makePrimitiveExpression({ undefined: null }),
              [
                makeApplyExpression(
                  makeIntrinsicExpression("Object.entries"),
                  makeReadExpression("function.arguments"),
                  [],
                ),
              ],
            ),
            true,
          ),
        ),
        makeEffectStatement(
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.defineProperty"),
              makePrimitiveExpression({ undefined: null }),
              [
                makeReadExpression(options.arguments.target),
                makePrimitiveExpression("length"),
                makeDataDescriptorExpression(
                  makePrimitiveExpression(true),
                  makePrimitiveExpression(false),
                  makePrimitiveExpression(true),
                  makeGetExpression(
                    makeReadExpression("function.arguments"),
                    makePrimitiveExpression("length"),
                  ),
                ),
              ],
            ),
          ),
        ),
        makeEffectStatement(
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.defineProperty"),
              makePrimitiveExpression({ undefined: null }),
              [
                makeReadExpression(options.arguments.target),
                makePrimitiveExpression("callee"),
                context.strict
                  ? makeAccessorDescriptorExpression(
                      makeIntrinsicExpression(
                        "Function.prototype.arguments@get",
                      ),
                      makeIntrinsicExpression(
                        "Function.prototype.arguments@set",
                      ),
                      makePrimitiveExpression(false),
                      makePrimitiveExpression(false),
                    )
                  : makeDataDescriptorExpression(
                      makePrimitiveExpression(true),
                      makePrimitiveExpression(false),
                      makePrimitiveExpression(true),
                      makeReadExpression(options.self),
                    ),
              ],
            ),
          ),
        ),
        makeEffectStatement(
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.defineProperty"),
              makePrimitiveExpression({ undefined: null }),
              [
                makeReadExpression(options.arguments.target),
                makeIntrinsicExpression("Symbol.iterator"),
                makeDataDescriptorExpression(
                  makePrimitiveExpression(true),
                  makePrimitiveExpression(false),
                  makePrimitiveExpression(true),
                  makeIntrinsicExpression("Array.prototype.values"),
                ),
              ],
            ),
          ),
        ),
        ...listScopeInitializeStatement(
          context,
          options.arguments.origin,
          options.arguments.target,
        ),
      ]),
  ...(pairs.length === 1 && pairs[0].node.type === "RestElement"
    ? unbuildPatternStatement(
        drill(
          /** @type {{node: estree.RestElement, path: unbuild.Path}} */ (
            pairs[0]
          ),
          "argument",
        ),
        context,
        { right: "function.arguments" },
      )
    : flatMap(enumerate(pairs.length), (index) =>
        unbuildParameter(pairs[index], context, { index }),
      )),
];

/** @type {(node: estree.Pattern) => node is estree.Identifier} */
const isIdentifier = (node) => node.type === "Identifier";

/**
 * @type {(
 *   node: estree.Function,
 *   kind: aran.FunctionKind,
 *   strict: boolean,
 * ) => estree.Variable[]}
 */
const listClosureParameter = (node, kind, strict) => {
  const parameters = flatMap(node.params, listPatternVariable);
  if (kind === "arrow" || strict || every(node.params, isIdentifier)) {
    if (removeDuplicate(parameters).length !== parameters.length) {
      throw new SyntaxAranError("duplicate parameter", node);
    } else {
      return parameters;
    }
  } else {
    return removeDuplicate(parameters);
  }
};

/**
 * @type {(
 *   target: estree.Variable,
 *   parameters: estree.Variable[],
 *   record: Record<estree.Variable, unknown>,
 *   body: estree.Node[],
 * ) => boolean}
 */
const isPresent = (target, parameters, record, body) => {
  if (includes(parameters, target)) {
    return true;
  }
  if (hasOwn(record, target)) {
    return false;
  }
  return hasFreeVariable(body, target);
};

/**
 * @type {(
 *  hidden: Hidden,
 * ) => estree.Variable[]}
 */
const listHiddenParameter = (hidden) =>
  hidden === null ? [] : [hidden.origin];

/**
 * @type {(
 *   pair: {
 *     node: estree.Function,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     kind: aran.FunctionKind,
 *     name: import("../name.mjs").Name,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildFunction = ({ node, path }, context, { kind, name }) => {
  const self = mangleMetaVariable(
    BASENAME,
    /** @type {__unique} */ ("self"),
    path,
  );
  const callee = mangleMetaVariable(
    BASENAME,
    /** @type {__unique} */ ("callee"),
    path,
  );
  const arguments_ = mangleMetaVariable(
    BASENAME,
    /** @type {__unique} */ ("arguments"),
    path,
  );
  const strict = context.strict || isClosureStrict(node);
  const parameters = listClosureParameter(node, kind, strict);
  const kinds =
    node.body.type === "BlockStatement" ? hoistClosure(node.body.body) : {};
  const hidden = {
    callee:
      node.type !== "ArrowFunctionExpression" &&
      node.id != null &&
      isPresent(
        /** @type {estree.Variable} */ (node.id.name),
        parameters,
        kinds,
        node.body.type === "BlockStatement" ? node.body.body : [node.body],
      )
        ? {
            origin: /** @type {estree.Variable} */ (node.id.name),
            target: callee,
          }
        : null,
    arguments:
      kind !== "arrow" &&
      isPresent(
        /** @type {estree.Variable} */ ("arguments"),
        parameters,
        kinds,
        node.body.type === "BlockStatement" ? node.body.body : [node.body],
      )
        ? {
            origin: /** @type {estree.Variable} */ ("arguments"),
            target: arguments_,
          }
        : null,
  };
  return makeLongSequenceExpression(
    [
      makeWriteEffect(
        self,
        makeFunctionExpression(
          kind,
          !!node.async,
          !!node.generator,
          makeScopeClosureBlock(
            { ...context, strict },
            {
              type: "block",
              kinds: reduceEntry(
                map(
                  [
                    ...flatMap(listValue(hidden), listHiddenParameter),
                    ...parameters,
                  ],
                  makeLetEntry,
                ),
              ),
            },
            (context) => [
              ...listHeadStatement(
                drillAll(drillArray({ node, path }, "params")),
                context,
                {
                  self,
                  ...hidden,
                },
              ),
              ...(isBlockFunction(node)
                ? [
                    makeBlockStatement(
                      unbuildControlBlock(
                        drill({ node, path }, "body"),
                        context,
                        {
                          kinds,
                          labels: [],
                          completion: null,
                          loop: {
                            break: null,
                            continue: null,
                          },
                        },
                      ),
                    ),
                  ]
                : []),
            ],
            (context) =>
              isExpressionFunction(node)
                ? unbuildExpression(drill({ node, path }, "body"), context, {
                    name: ANONYMOUS,
                  })
                : makeCompletion(kind),
          ),
        ),
        true,
      ),
      makeExpressionEffect(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.defineProperty"),
          makePrimitiveExpression({ undefined: null }),
          [
            makeReadExpression(self),
            makePrimitiveExpression("length"),
            makeDataDescriptorExpression(
              makePrimitiveExpression(false),
              makePrimitiveExpression(false),
              makePrimitiveExpression(true),
              makePrimitiveExpression(
                filterOut(node.params, isRestElement).length,
              ),
            ),
          ],
        ),
      ),
      makeExpressionEffect(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.defineProperty"),
          makePrimitiveExpression({ undefined: null }),
          [
            makeReadExpression(self),
            makePrimitiveExpression("name"),
            makeDataDescriptorExpression(
              makePrimitiveExpression(false),
              makePrimitiveExpression(false),
              makePrimitiveExpression(true),
              node.type !== "ArrowFunctionExpression" && node.id != null
                ? makePrimitiveExpression(node.id.name)
                : makeNameExpression(name),
            ),
          ],
        ),
      ),
      ...(context.strict
        ? []
        : [
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.defineProperty"),
                makePrimitiveExpression({ undefined: null }),
                [
                  makeReadExpression(self),
                  makePrimitiveExpression("arguments"),
                  makeDataDescriptorExpression(
                    makePrimitiveExpression(false),
                    makePrimitiveExpression(false),
                    makePrimitiveExpression(false),
                    makePrimitiveExpression(null),
                  ),
                ],
              ),
            ),
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.defineProperty"),
                makePrimitiveExpression({ undefined: null }),
                [
                  makeReadExpression(self),
                  makePrimitiveExpression("caller"),
                  makeDataDescriptorExpression(
                    makePrimitiveExpression(false),
                    makePrimitiveExpression(false),
                    makePrimitiveExpression(false),
                    makePrimitiveExpression(null),
                  ),
                ],
              ),
            ),
          ]),
    ],
    makeReadExpression(self),
  );
};
