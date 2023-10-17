// https://tc39.github.io/ecma262/#sec-function-instances

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
import { makeSyntaxErrorExpression } from "../report.mjs";

const {
  Object: { values: listValue, fromEntries: reduceEntry },
} = globalThis;

const BASENAME = /** @type {__basename} */ ("function");

/**
 * @typedef {null | {
 *   path: estree.Variable,
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
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeCompletion = (kind, path) => {
  switch (kind) {
    case "arrow": {
      return makePrimitiveExpression({ undefined: null }, path);
    }
    case "method": {
      return makePrimitiveExpression({ undefined: null }, path);
    }
    case "function": {
      return makeConditionalExpression(
        makeReadExpression("new.target", path),
        makeReadExpression("this", path),
        makePrimitiveExpression({ undefined: null }, path),
        path,
      );
    }
    case "constructor": {
      return makeReadExpression("this", path);
    }
    default: {
      throw new StaticError("invalid function kind", kind);
    }
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
 * ) => (aran.Statement<unbuild.Atom>)[]}
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
              makeIntrinsicExpression("Array.prototype.slice", path),
              makeReadExpression("function.arguments", path),
              [makePrimitiveExpression(index, path)],
              path,
            )
          : makeGetExpression(
              makeReadExpression("function.arguments", path),
              makePrimitiveExpression(index, path),
              path,
            ),
        true,
        path,
      ),
      path,
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
 *     path: unbuild.Path,
 *     self: unbuild.Variable,
 *     callee: Hidden,
 *     arguments: Hidden,
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
const listHeadStatement = (pairs, context, { path, self, ...hidden }) => [
  ...(hidden.callee === null
    ? []
    : listScopeInitializeStatement(
        context,
        hidden.callee.path,
        hidden.callee.target,
        path,
      )),
  ...(hidden.arguments === null
    ? []
    : [
        makeEffectStatement(
          makeWriteEffect(
            hidden.arguments.target,
            makeApplyExpression(
              makeIntrinsicExpression("Object.fromEntries", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeApplyExpression(
                  makeIntrinsicExpression("Object.entries", path),
                  makeReadExpression("function.arguments", path),
                  [],
                  path,
                ),
              ],
              path,
            ),
            true,
            path,
          ),
          path,
        ),
        makeEffectStatement(
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.defineProperty", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeReadExpression(hidden.arguments.target, path),
                makePrimitiveExpression("length", path),
                makeDataDescriptorExpression(
                  makePrimitiveExpression(true, path),
                  makePrimitiveExpression(false, path),
                  makePrimitiveExpression(true, path),
                  makeGetExpression(
                    makeReadExpression("function.arguments", path),
                    makePrimitiveExpression("length", path),
                    path,
                  ),
                  path,
                ),
              ],
              path,
            ),
            path,
          ),
          path,
        ),
        makeEffectStatement(
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.defineProperty", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeReadExpression(hidden.arguments.target, path),
                makePrimitiveExpression("callee", path),
                context.strict
                  ? makeAccessorDescriptorExpression(
                      makeIntrinsicExpression(
                        "Function.prototype.arguments@get",
                        path,
                      ),
                      makeIntrinsicExpression(
                        "Function.prototype.arguments@set",
                        path,
                      ),
                      makePrimitiveExpression(false, path),
                      makePrimitiveExpression(false, path),
                      path,
                    )
                  : makeDataDescriptorExpression(
                      makePrimitiveExpression(true, path),
                      makePrimitiveExpression(false, path),
                      makePrimitiveExpression(true, path),
                      makeReadExpression(self, path),
                      path,
                    ),
              ],
              path,
            ),
            path,
          ),
          path,
        ),
        makeEffectStatement(
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.defineProperty", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeReadExpression(hidden.arguments.target, path),
                makeIntrinsicExpression("Symbol.iterator", path),
                makeDataDescriptorExpression(
                  makePrimitiveExpression(true, path),
                  makePrimitiveExpression(false, path),
                  makePrimitiveExpression(true, path),
                  makeIntrinsicExpression("Array.prototype.values", path),
                  path,
                ),
              ],
              path,
            ),
            path,
          ),
          path,
        ),
        ...listScopeInitializeStatement(
          context,
          hidden.arguments.path,
          hidden.arguments.target,
          path,
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
 * ) => {
 *   type: "success",
 *   value: estree.Variable[],
 * } | {
 *   type: "failure",
 *   message: string,
 * }}
 */
const listClosureParameter = (node, kind, strict) => {
  const parameters = flatMap(node.params, listPatternVariable);
  if (kind === "arrow" || strict || every(node.params, isIdentifier)) {
    if (removeDuplicate(parameters).length !== parameters.length) {
      return {
        type: "failure",
        message: "duplicate parameter",
      };
    } else {
      return {
        type: "success",
        value: parameters,
      };
    }
  } else {
    return {
      type: "success",
      value: removeDuplicate(parameters),
    };
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
const listHiddenParameter = (hidden) => (hidden === null ? [] : [hidden.path]);

/**
 * @type {(
 *   kind: "arrow" | "method" | "function" | "constructor",
 *   asynchronous: boolean,
 *   generator: boolean,
 *   body: aran.ClosureBlock<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeUnsafeFunctionExpression = (
  kind,
  asynchronous,
  generator,
  body,
  path,
) => {
  switch (kind) {
    case "constructor": {
      if (asynchronous || generator) {
        return makeSyntaxErrorExpression(
          "Constructors cannot be asynchronous or iterator",
          path,
        );
      } else {
        return makeFunctionExpression(
          kind,
          asynchronous,
          generator,
          body,
          path,
        );
      }
    }
    case "arrow": {
      if (generator) {
        return makeSyntaxErrorExpression(
          "Arrow functions cannot be iterator",
          path,
        );
      } else {
        return makeFunctionExpression(
          kind,
          asynchronous,
          generator,
          body,
          path,
        );
      }
    }
    default: {
      return makeFunctionExpression(kind, asynchronous, generator, body, path);
    }
  }
};

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
  const outcome = listClosureParameter(node, kind, strict);
  if (outcome.type === "failure") {
    return makeSyntaxErrorExpression(outcome.message, path);
  }
  const parameters = outcome.value;
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
            path: /** @type {estree.Variable} */ (node.id.name),
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
            path: /** @type {estree.Variable} */ ("arguments"),
            target: arguments_,
          }
        : null,
  };
  return makeLongSequenceExpression(
    [
      makeWriteEffect(
        self,
        makeUnsafeFunctionExpression(
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
                  path,
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
                      path,
                    ),
                  ]
                : []),
            ],
            (context) =>
              isExpressionFunction(node)
                ? unbuildExpression(drill({ node, path }, "body"), context, {
                    name: ANONYMOUS,
                  })
                : makeCompletion(kind, path),
            path,
          ),
          path,
        ),
        true,
        path,
      ),
      makeExpressionEffect(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.defineProperty", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeReadExpression(self, path),
            makePrimitiveExpression("length", path),
            makeDataDescriptorExpression(
              makePrimitiveExpression(false, path),
              makePrimitiveExpression(false, path),
              makePrimitiveExpression(true, path),
              makePrimitiveExpression(
                filterOut(node.params, isRestElement).length,
                path,
              ),
              path,
            ),
          ],
          path,
        ),
        path,
      ),
      makeExpressionEffect(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.defineProperty", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeReadExpression(self, path),
            makePrimitiveExpression("name", path),
            makeDataDescriptorExpression(
              makePrimitiveExpression(false, path),
              makePrimitiveExpression(false, path),
              makePrimitiveExpression(true, path),
              node.type !== "ArrowFunctionExpression" && node.id != null
                ? makePrimitiveExpression(node.id.name, path)
                : makeNameExpression(name, path),
              path,
            ),
          ],
          path,
        ),
        path,
      ),
      ...(context.strict
        ? []
        : [
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.defineProperty", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeReadExpression(self, path),
                  makePrimitiveExpression("arguments", path),
                  makeDataDescriptorExpression(
                    makePrimitiveExpression(false, path),
                    makePrimitiveExpression(false, path),
                    makePrimitiveExpression(false, path),
                    makePrimitiveExpression(null, path),
                    path,
                  ),
                ],
                path,
              ),
              path,
            ),
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.defineProperty", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeReadExpression(self, path),
                  makePrimitiveExpression("caller", path),
                  makeDataDescriptorExpression(
                    makePrimitiveExpression(false, path),
                    makePrimitiveExpression(false, path),
                    makePrimitiveExpression(false, path),
                    makePrimitiveExpression(null, path),
                    path,
                  ),
                ],
                path,
              ),
              path,
            ),
          ]),
    ],
    makeReadExpression(self, path),
    path,
  );
};
