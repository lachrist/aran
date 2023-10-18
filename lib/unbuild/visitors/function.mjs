// https://tc39.github.io/ecma262/#sec-function-instances

import {
  hasFreeVariable,
  hoistClosure,
  isClosureStrict,
  listPatternVariable,
} from "../query/index.mjs";
import {
  AranTypeError,
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
  Object: { fromEntries: reduceEntry },
} = globalThis;

const BASENAME = /** @type {__basename} */ ("function");

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
 *   variable: estree.Variable,
 * ) => [estree.Variable, estree.VariableKind]}
 */
const makeVarEntry = (variable) => [variable, "var"];

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
      throw new AranTypeError("invalid function kind", kind);
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
 *     callee: estree.Variable | null,
 *     arguments: unbuild.Variable | null,
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
const listHeadStatement = (
  pairs,
  context,
  { path, self, callee, arguments: arguments_ },
) => [
  ...(callee === null
    ? []
    : listScopeInitializeStatement(context, callee, self, path)),
  ...(arguments_ === null
    ? []
    : [
        makeEffectStatement(
          makeWriteEffect(
            arguments_,
            makeApplyExpression(
              makeIntrinsicExpression("Object.fromEntries", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeApplyExpression(
                  makeIntrinsicExpression("Object.entries", path),
                  makePrimitiveExpression({ undefined: null }, path),
                  [makeReadExpression("function.arguments", path)],
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
                makeReadExpression(arguments_, path),
                makePrimitiveExpression("length", path),
                makeDataDescriptorExpression(
                  {
                    value: makeGetExpression(
                      makeReadExpression("function.arguments", path),
                      makePrimitiveExpression("length", path),
                      path,
                    ),
                    writable: true,
                    enumerable: false,
                    configurable: true,
                  },
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
                makeReadExpression(arguments_, path),
                makePrimitiveExpression("callee", path),
                context.strict
                  ? makeAccessorDescriptorExpression(
                      {
                        get: makeIntrinsicExpression(
                          "Function.prototype.arguments@get",
                          path,
                        ),
                        set: makeIntrinsicExpression(
                          "Function.prototype.arguments@set",
                          path,
                        ),
                        enumerable: false,
                        configurable: true,
                      },
                      path,
                    )
                  : makeDataDescriptorExpression(
                      {
                        value: makeReadExpression(self, path),
                        writable: true,
                        enumerable: false,
                        configurable: true,
                      },
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
                makeReadExpression(arguments_, path),
                makeIntrinsicExpression("Symbol.iterator", path),
                makeDataDescriptorExpression(
                  {
                    value: makeIntrinsicExpression(
                      "Array.prototype.values",
                      path,
                    ),
                    writable: true,
                    enumerable: false,
                    configurable: true,
                  },
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
          /** @type {estree.Variable} */ ("arguments"),
          arguments_,
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
 *   error: string,
 * }}
 */
const listClosureParameter = (node, kind, strict) => {
  const parameters = flatMap(node.params, listPatternVariable);
  if (kind === "arrow" || strict || every(node.params, isIdentifier)) {
    if (removeDuplicate(parameters).length !== parameters.length) {
      return {
        type: "failure",
        error: "duplicate parameter",
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
  const strict = context.strict || isClosureStrict(node);
  const outcome = listClosureParameter(node, kind, strict);
  if (outcome.type === "failure") {
    return makeSyntaxErrorExpression(outcome.error, path);
  }
  const parameters = outcome.value;
  const kinds =
    node.body.type === "BlockStatement" ? hoistClosure(node.body.body) : {};
  const callee =
    node.type !== "ArrowFunctionExpression" &&
    node.id != null &&
    isPresent(
      /** @type {estree.Variable} */ (node.id.name),
      parameters,
      kinds,
      node.body.type === "BlockStatement" ? node.body.body : [node.body],
    )
      ? /** @type {estree.Variable} */ (node.id.name)
      : null;
  const arguments_ =
    kind !== "arrow" &&
    isPresent(
      /** @type {estree.Variable} */ ("arguments"),
      parameters,
      kinds,
      node.body.type === "BlockStatement" ? node.body.body : [node.body],
    )
      ? mangleMetaVariable(
          BASENAME,
          /** @type {__unique} */ ("arguments"),
          path,
        )
      : null;
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
              kinds: reduceEntry([
                ...(callee === null ? [] : [[callee, "var"]]),
                ...(arguments_ === null ? [] : [["arguments", "var"]]),
                ...map(
                  parameters,
                  every(node.params, isIdentifier)
                    ? makeVarEntry
                    : makeLetEntry,
                ),
              ]),
            },
            (context) => [
              ...listHeadStatement(
                drillAll(drillArray({ node, path }, "params")),
                context,
                {
                  self,
                  callee,
                  arguments: arguments_,
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
              {
                value: makePrimitiveExpression(
                  filterOut(node.params, isRestElement).length,
                  path,
                ),
                writable: false,
                enumerable: false,
                configurable: true,
              },
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
              {
                value:
                  node.type !== "ArrowFunctionExpression" && node.id != null
                    ? makePrimitiveExpression(node.id.name, path)
                    : makeNameExpression(name, path),
                writable: false,
                enumerable: false,
                configurable: true,
              },
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
                    {
                      value: makePrimitiveExpression(null, path),
                      writable: false,
                      enumerable: false,
                      configurable: true,
                    },
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
                    {
                      value: makePrimitiveExpression(null, path),
                      writable: false,
                      enumerable: false,
                      configurable: true,
                    },
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
