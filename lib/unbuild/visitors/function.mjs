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
  makeBinaryExpression,
  makeDataDescriptorExpression,
  makeGetExpression,
  makeLongSequenceExpression,
  makeObjectExpression,
  makeThrowErrorExpression,
} from "../intrinsic.mjs";
import { mangleMetaVariable } from "../mangle.mjs";
import { ANONYMOUS, makeNameExpression } from "../name.mjs";
import {
  makeApplyExpression,
  makeBlockStatement,
  makeConditionalEffect,
  makeConditionalExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeFunctionExpression,
  makeArrowExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeWriteEffect,
} from "../node.mjs";
import { makeScopeClosureBlock } from "../scope/block.mjs";
import { listScopeInitializeStatement } from "../scope/index.mjs";
import { unbuildClosureBody } from "./body.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildPatternStatement } from "./pattern.mjs";
import { drill, drillAll, drillArray } from "../../drill.mjs";
import { isBlockFunction, isExpressionFunction } from "../predicate.mjs";
import { makeSyntaxErrorExpression } from "../report.mjs";
import {
  listThisWriteEffect,
  makeNewTargetExpression,
  makeThisExpression,
} from "../record.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

const BASENAME = /** @type {__basename} */ ("function");

/**
 * @typedef {(
 *   | "arrow"
 *   | "function"
 *   | "method"
 *   | "constructor"
 *   | "constructor*"
 * )} FunctionKind
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
 *   variable: estree.Variable,
 * ) => [estree.Variable, estree.VariableKind]}
 */
const makeVarEntry = (variable) => [variable, "var"];

/**
 * @type {(
 *   kind: FunctionKind,
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
    case "constructor*": {
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
const unbuildParameter = ({ node, path }, context, { index }) =>
  unbuildPatternStatement({ node, path }, context, {
    right: {
      var: mangleMetaVariable(
        BASENAME,
        /** @type {__unique} */ ("argument"),
        path,
      ),
      val:
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
    },
  });

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     record: import("../context.d.ts").Record,
 *   },
 *   options: {
 *     self: unbuild.Variable,
 *     kind: FunctionKind,
 *     path: unbuild.Path,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listThisEffect = ({ strict, record }, { self, kind, path }) => {
  switch (kind) {
    case "arrow": {
      return [];
    }
    case "constructor*": {
      return [];
    }
    case "constructor": {
      return listThisWriteEffect(
        record,
        makeObjectExpression(
          makeGetExpression(
            makeReadExpression(self, path),
            makePrimitiveExpression("prototype", path),
            path,
          ),
          [],
          path,
        ),
        path,
      );
    }
    case "method": {
      return strict
        ? []
        : listThisWriteEffect(
            record,
            makeConditionalExpression(
              makeBinaryExpression(
                "==",
                makeThisExpression(record, path),
                makePrimitiveExpression(null, path),
                path,
              ),
              makeIntrinsicExpression("globalThis", path),
              makeApplyExpression(
                makeIntrinsicExpression("Object", path),
                makePrimitiveExpression({ undefined: null }, path),
                [makeThisExpression(record, path)],
                path,
              ),
              path,
            ),
            path,
          );
    }
    case "function": {
      return strict
        ? [
            makeConditionalEffect(
              makeNewTargetExpression(record, path),
              listThisWriteEffect(
                record,
                makeObjectExpression(
                  makeGetExpression(
                    makeReadExpression(self, path),
                    makePrimitiveExpression("prototype", path),
                    path,
                  ),
                  [],
                  path,
                ),
                path,
              ),
              [],
              path,
            ),
          ]
        : listThisWriteEffect(
            record,
            makeConditionalExpression(
              makeNewTargetExpression(record, path),
              makeObjectExpression(
                makeGetExpression(
                  makeReadExpression(self, path),
                  makePrimitiveExpression("prototype", path),
                  path,
                ),
                [],
                path,
              ),
              makeConditionalExpression(
                makeBinaryExpression(
                  "==",
                  makeThisExpression(record, path),
                  makePrimitiveExpression(null, path),
                  path,
                ),
                makeIntrinsicExpression("globalThis", path),
                makeApplyExpression(
                  makeIntrinsicExpression("Object", path),
                  makePrimitiveExpression({ undefined: null }, path),
                  [makeThisExpression(record, path)],
                  path,
                ),
                path,
              ),
              path,
            ),
            path,
          );
    }
    default: {
      throw new AranTypeError("invalid function kind", kind);
    }
  }
};

/**
 * @type {(
 *   context: {
 *     record: import("../context.d.ts").Record,
 *   },
 *   options: {
 *     kind: FunctionKind,
 *     path: unbuild.Path,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listNewTargetEffect = ({ record }, { kind, path }) => {
  if (kind === "method") {
    return [
      makeConditionalEffect(
        makeNewTargetExpression(record, path),
        [
          makeExpressionEffect(
            makeThrowErrorExpression(
              "TypeError",
              "Methods cannot be constructed",
              path,
            ),
            path,
          ),
        ],
        [],
        path,
      ),
    ];
  } else if (kind === "constructor" || kind === "constructor*") {
    return [
      makeConditionalEffect(
        makeNewTargetExpression(record, path),
        [],
        [
          makeExpressionEffect(
            makeThrowErrorExpression(
              "TypeError",
              "Constructors cannot be applied",
              path,
            ),
            path,
          ),
        ],
        path,
      ),
    ];
  } else if (kind === "arrow" || kind === "function") {
    return [];
  } else {
    throw new AranTypeError("invalid kind", kind);
  }
};

/**
 * @type {(
 *   pairs: {
 *     node: estree.Pattern,
 *     path: unbuild.Path,
 *   }[],
 *   context: import("../context.js").Context,
 *   options: {
 *     kind: FunctionKind,
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
  { kind, path, self, callee, arguments: arguments_ },
) => [
  ...map(listNewTargetEffect(context, { kind, path }), (effect) =>
    makeEffectStatement(effect, path),
  ),
  ...map(listThisEffect(context, { self, kind, path }), (effect) =>
    makeEffectStatement(effect, path),
  ),
  ...(callee === null
    ? []
    : listScopeInitializeStatement(
        context,
        callee,
        { var: null, val: makeReadExpression(self, path) },
        path,
      )),
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
        makeEffectStatement(
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.defineProperty", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeReadExpression(arguments_, path),
                makeIntrinsicExpression("Symbol.toStringTag", path),
                makeDataDescriptorExpression(
                  {
                    value: makePrimitiveExpression("Arguments", path),
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
          {
            var: null,
            val: makeReadExpression(arguments_, path),
          },
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
        {
          right: {
            var: null,
            val: makeReadExpression("function.arguments", path),
          },
        },
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
 *   strict: boolean,
 * ) => {
 *   type: "success",
 *   value: estree.Variable[],
 * } | {
 *   type: "failure",
 *   error: string,
 * }}
 */
const listClosureParameter = (node, strict) => {
  const parameters = flatMap(node.params, listPatternVariable);
  if (
    node.type === "ArrowFunctionExpression" ||
    strict ||
    !every(node.params, isIdentifier)
  ) {
    const { length } = parameters;
    /* eslint-disable local/no-impure */
    for (let index1 = 0; index1 < length; index1 += 1) {
      for (let index2 = index1 + 1; index2 < length; index2 += 1) {
        if (parameters[index1] === parameters[index2]) {
          return {
            type: "failure",
            error: `Duplicate parameter: ${parameters[index1]}`,
          };
        }
      }
    }
    /* eslint-enable local/no-impure */
    return {
      type: "success",
      value: parameters,
    };
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
 *   pair: {
 *     node: estree.Function,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     kind: FunctionKind,
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
  const outcome = listClosureParameter(node, strict);
  switch (outcome.type) {
    case "failure": {
      return makeSyntaxErrorExpression(outcome.error, path);
    }
    case "success": {
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
            (kind === "arrow" ? makeArrowExpression : makeFunctionExpression)(
              hasOwn(node, "async")
                ? /** @type {{async: boolean}} */ (node).async
                : false,
              /** @type {any} */ (
                kind !== "arrow" && hasOwn(node, "generator")
                  ? /** @type {{generator: boolean}} */ (node).generator
                  : false
              ),
              makeScopeClosureBlock(
                {
                  ...context,
                  strict,
                  record: {
                    ...context.record,
                    ...(kind === "arrow"
                      ? {}
                      : {
                          "this": /** @type {aran.Parameter} */ ("this"),
                          "new.target": /** @type {aran.Parameter} */ (
                            "new.target"
                          ),
                        }),
                    "function.arguments": /** @type {"function.arguments"} */ (
                      "function.arguments"
                    ),
                  },
                },
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
                      kind,
                      self,
                      callee,
                      arguments: arguments_,
                      path,
                    },
                  ),
                  ...(isBlockFunction(node)
                    ? [
                        makeBlockStatement(
                          unbuildClosureBody(
                            drill({ node, path }, "body"),
                            context,
                          ),
                          path,
                        ),
                      ]
                    : []),
                ],
                (context) =>
                  isExpressionFunction(node)
                    ? unbuildExpression(
                        drill({ node, path }, "body"),
                        context,
                        {
                          name: ANONYMOUS,
                        },
                      )
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
          ...(strict
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
    }
    default: {
      throw new AranTypeError("invalid outcome", outcome);
    }
  }
};
