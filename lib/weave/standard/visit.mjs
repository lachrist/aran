/* eslint-disable no-use-before-define */
/* eslint-disable local/no-method-call */

import { AranError, AranTypeError } from "../../error.mjs";
import { isParameter, unpackPrimitive } from "../../lang.mjs";
import {
  concatXX,
  concatXXX,
  concatXXXX,
  concatX_,
  concat_XX,
  concat_X_,
  flatMap,
  hasOwn,
  map,
} from "../../util/index.mjs";
import {
  makeApplyExpression,
  makeBlockStatement,
  makeBreakStatement,
  makeClosureExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeConstructExpression,
  makeControlBlock,
  makeDebuggerStatement,
  makeEffectStatement,
  makeExportEffect,
  makeExpressionEffect,
  makeIfStatement,
  makeImportExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeProgram,
  makeReadExpression,
  makeReturnStatement,
  makeRoutineBlock,
  makeSequenceExpression,
  makeTryStatement,
  makeWhileStatement,
  makeWriteEffect,
} from "../node.mjs";
import {
  ADVICE_VARIABLE,
  COMPLETION_VARIABLE,
  FRAME_VARIABLE,
  mangleOriginalVariable,
  mangleStateVariable,
} from "../variable.mjs";
import { makeJsonExpression } from "../json.mjs";
import { incrementDepth } from "../depth.mjs";
import { listParameter } from "./parametrization.mjs";
import {
  getParentHead,
  listParentPreludeBinding,
  listParentPreludeStatement,
} from "./parent.mjs";

/**
 * @type {(
 *   name:  keyof import("./pointcut").NormalPointcut,
 *   depth: import("../depth").Depth,
 *   input: import("../atom").ResExpression[],
 *   path: import("../../path").Path,
 * ) => import("../atom").ResExpression}
 */
const makeTrapExpression = (name, depth, input, path) =>
  makeApplyExpression(
    makeApplyExpression(
      makeIntrinsicExpression("aran.get"),
      makeIntrinsicExpression("undefined"),
      [makeReadExpression(ADVICE_VARIABLE), makePrimitiveExpression(name)],
    ),
    makeReadExpression(ADVICE_VARIABLE),
    concat_X_(
      makeReadExpression(mangleStateVariable(depth)),
      input,
      makePrimitiveExpression(path),
    ),
  );

/////////////
// Program //
/////////////

/**
 * @type {(
 *   node: import("../atom").ArgProgram,
 *   advice: import("../../estree").Variable,
 *   context: import("./context").Context
 * ) => import("../atom").ResProgram}
 */
export const weaveProgram = (node, advice, context) =>
  makeProgram(
    node.kind,
    node.situ,
    node.head,
    weaveRoutineBlock(
      node.body,
      {
        type: "program",
        node,
        advice,
      },
      context,
    ),
  );

///////////
// Block //
///////////

/**
 * @type {(
 *   node: (
 *     | import("../atom").ArgProgram
 *     | import("../atom").ArgExpression & { type: "ClosureExpression" }
 *   ),
 * ) => import("./pointcut").RoutineKind}
 */
const makeRoutineKind = (node) => {
  if (node.type === "Program") {
    if (node.kind === "module") {
      return "module";
    } else if (node.kind === "script") {
      return "script";
    } else if (node.kind === "eval") {
      return `eval.${node.situ}`;
    } else {
      throw new AranTypeError(node);
    }
  } else if (node.type === "ClosureExpression") {
    if (node.kind === "arrow") {
      return node.asynchronous ? "arrow.async" : "arrow";
    } else if (node.kind === "function") {
      if (node.asynchronous) {
        return node.generator ? "function.async.generator" : "function.async";
      } else {
        return node.generator ? "function.generator" : "function";
      }
    } else {
      throw new AranTypeError(node);
    }
  } else {
    throw new AranTypeError(node);
  }
};

/**
 * @type {(
 *   variable: import("../atom").ArgVariable,
 * ) => [
 *   import("../atom").ResExpression,
 *   import("../atom").ResExpression,
 * ]}
 */
const makeVariableEntry = (variable) => [
  makePrimitiveExpression(variable),
  makeReadExpression(mangleOriginalVariable(variable)),
];

/**
 * @type {(
 *   parameter: import("../../lang").Parameter,
 * ) => [
 *   import("../atom").ResExpression,
 *   import("../atom").ResExpression,
 * ]}
 */
const makeParameterEntry = (parameter) => [
  makePrimitiveExpression(parameter),
  makeReadExpression(parameter),
];

/**
 * @type {(
 *   parameters: import("../../lang").Parameter[],
 *   variables: import("../atom").ArgVariable[],
 * ) => import("../atom").ResExpression}
 */
export const makeFrameExpression = (parameters, variables) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject"),
    makeIntrinsicExpression("undefined"),
    concat_XX(
      makePrimitiveExpression(null),
      flatMap(parameters, makeParameterEntry),
      flatMap(variables, makeVariableEntry),
    ),
  );

/**
 * @type {(
 *   binding: [
 *     import("../atom").ArgVariable,
 *     import("../../lang").Intrinsic,
 *   ],
 * ) => import("../atom").ArgVariable}
 */
const getBindingVariable = ([variable, _intrinsic]) => variable;

/**
 * @type {(
 *   parameter: import("../../lang").Parameter,
 * ) => import("../atom").ResStatement}
 */
const makeOverwriteParameterStatement = (parameter) =>
  makeEffectStatement(
    makeWriteEffect(
      parameter,
      makeApplyExpression(
        makeIntrinsicExpression("aran.get"),
        makeIntrinsicExpression("undefined"),
        [
          makeReadExpression(FRAME_VARIABLE),
          makePrimitiveExpression(parameter),
        ],
      ),
    ),
  );

/**
 * @type {(
 *   parameter: import("../atom").ArgVariable,
 * ) => import("../atom").ResStatement}
 */
const makeOverwriteVariableStatement = (variable) =>
  makeEffectStatement(
    makeWriteEffect(
      mangleOriginalVariable(variable),
      makeApplyExpression(
        makeIntrinsicExpression("aran.get"),
        makeIntrinsicExpression("undefined"),
        [makeReadExpression(FRAME_VARIABLE), makePrimitiveExpression(variable)],
      ),
    ),
  );

/**
 * @type {(
 *   binding: [
 *     import("../atom").ArgVariable,
 *     import("../../lang").Intrinsic,
 *   ],
 * ) => [
 *   import("../atom").ResVariable,
 *   import("../../lang").Intrinsic,
 * ]}
 */
const mangleBinding = ([variable, intrinsic]) => [
  mangleOriginalVariable(variable),
  intrinsic,
];

/**
 * @type {[
 *   import("../atom").ResVariable,
 *   import("../../lang").Intrinsic,
 * ]}
 */
const FRAME_BINDING = [FRAME_VARIABLE, "undefined"];

/**
 * @type {(
 *   depth: import("../depth").Depth,
 * ) => [
 *   import("../atom").ResVariable,
 *   import("../../lang").Intrinsic,
 * ]}
 */
const makeStateBinding = (depth) => [mangleStateVariable(depth), "undefined"];

/**
 * @type {(
 *   kind: import("./pointcut").BlockKind,
 *   head: import("../../json").Json,
 *   node: (
 *     | import("../atom").ArgControlBlock
 *     | import("../atom").ArgRoutineBlock
 *   ),
 *   context: import("./context").Context,
 * ) => {
 *   frame: [
 *     import("../atom").ResVariable,
 *     import("../../lang").Intrinsic,
 *   ][],
 *   body: import("../atom").ResStatement[],
 *   success: null | import("../atom").ResExpression,
 *   failure: import("../atom").ResExpression,
 *   teardown: import("../atom").ResStatement[],
 * }}
 */
const trapBlock = (kind, head, node, context1) => {
  const parameters = listParameter(kind);
  const variables = map(node.frame, getBindingVariable);
  const setup = context1.pointcut["block@setup"](kind, node.tag)
    ? [
        makeEffectStatement(
          makeWriteEffect(
            mangleStateVariable(incrementDepth(context1.depth)),
            makeTrapExpression(
              "block@setup",
              context1.depth,
              [makePrimitiveExpression(kind), makeJsonExpression(head)],
              node.tag,
            ),
          ),
        ),
      ]
    : [];
  const context2 = { ...context1, depth: incrementDepth(context1.depth) };
  const underframe = context2.pointcut["block@frame"](kind, node.tag)
    ? [
        makeEffectStatement(
          makeExpressionEffect(
            makeTrapExpression(
              "block@frame",
              context2.depth,
              [
                makePrimitiveExpression(kind),
                makeFrameExpression(parameters, variables),
              ],
              node.tag,
            ),
          ),
        ),
      ]
    : [];
  const overframe = context2.pointcut["block@frame"](kind, node.tag)
    ? concat_XX(
        makeEffectStatement(
          makeWriteEffect(
            FRAME_VARIABLE,
            makeTrapExpression(
              "block@overframe",
              context2.depth,
              [
                makePrimitiveExpression(kind),
                makeFrameExpression(parameters, variables),
              ],
              node.tag,
            ),
          ),
        ),
        map(parameters, makeOverwriteParameterStatement),
        map(variables, makeOverwriteVariableStatement),
      )
    : [];
  const frame = concatXXX(
    setup.length === 0 ? [] : [makeStateBinding(context2.depth)],
    overframe.length === 0 ? [] : [FRAME_BINDING],
    map(node.frame, mangleBinding),
  );
  const main = flatMap(node.body, (child) => weaveStatement(child, context2));
  const success = context2.pointcut["block@success"](kind, node.tag)
    ? makeTrapExpression(
        "block@success",
        context2.depth,
        [
          makePrimitiveExpression(kind),
          node.type === "RoutineBlock"
            ? weaveExpression(node.completion, context2)
            : makeIntrinsicExpression("undefined"),
        ],
        node.tag,
      )
    : node.type === "RoutineBlock"
    ? weaveExpression(node.completion, context2)
    : null;
  const failure = context2.pointcut["block@failure"](kind, node.tag)
    ? makeTrapExpression(
        "block@failure",
        context2.depth,
        [makePrimitiveExpression(kind), makeReadExpression("catch.error")],
        node.tag,
      )
    : makeReadExpression("catch.error");
  const teardown = context2.pointcut["block@teardown"](kind, node.tag)
    ? [
        makeEffectStatement(
          makeExpressionEffect(
            makeTrapExpression(
              "block@teardown",
              context2.depth,
              [makePrimitiveExpression(kind)],
              node.tag,
            ),
          ),
        ),
      ]
    : [];
  return {
    frame,
    body: concatXXXX(setup, underframe, overframe, main),
    success,
    failure,
    teardown,
  };
};

/**
 * @type {[
 *   import("../atom").ResVariable,
 *   import("../../lang").Intrinsic,
 * ]}
 */
const COMPLETION_BINDING = [COMPLETION_VARIABLE, "undefined"];

/**
 * @type {(
 *   node: import("../atom").ArgRoutineBlock,
 *   parent: import("./parent").Parent,
 *   context: import("./context").Context,
 * ) => import("../atom").ResRoutineBlock}
 */
const weaveRoutineBlock = (node, parent, context) => {
  const kind = makeRoutineKind(parent.node);
  const { frame, body, success, failure, teardown } = trapBlock(
    kind,
    getParentHead(parent),
    node,
    context,
  );
  const main = concatXX(listParentPreludeStatement(parent), body);
  if (
    failure.type === "ReadExpression" &&
    failure.variable === "catch.error" &&
    teardown.length === 0
  ) {
    return makeRoutineBlock(
      concatXX(listParentPreludeBinding(parent), frame),
      main,
      /** @type {import("../atom").ResExpression} */ (success),
    );
  } else {
    return makeRoutineBlock(
      concat_XX(COMPLETION_BINDING, listParentPreludeBinding(parent), frame),
      [
        makeTryStatement(
          makeControlBlock(
            [],
            [],
            concatX_(
              main,
              makeEffectStatement(
                makeWriteEffect(
                  COMPLETION_VARIABLE,
                  /** @type {import("../atom").ResExpression} */ (success),
                ),
              ),
            ),
          ),
          makeControlBlock(
            [],
            [],
            [
              makeEffectStatement(
                makeExpressionEffect(
                  makeApplyExpression(
                    makeIntrinsicExpression("aran.throw"),
                    makeIntrinsicExpression("undefined"),
                    [failure],
                  ),
                ),
              ),
            ],
          ),
          makeControlBlock([], [], teardown),
        ),
      ],
      makeReadExpression(COMPLETION_VARIABLE),
    );
  }
};

/**
 * @type {(
 *   node: import("../atom").ArgControlBlock,
 *   kind: import("./pointcut").ControlKind,
 *   context: import("./context").Context,
 * ) => import("../atom").ResControlBlock}
 */
const weaveControlBlock = (node, kind, context) => {
  const { frame, body, success, failure, teardown } = trapBlock(
    kind,
    node.labels,
    node,
    context,
  );
  const main = concatXX(
    body,
    success === null
      ? []
      : [makeEffectStatement(makeExpressionEffect(success))],
  );
  if (
    failure.type === "ReadExpression" &&
    failure.variable === "catch.error" &&
    teardown.length === 0
  ) {
    return makeControlBlock(node.labels, frame, main);
  } else {
    return makeControlBlock(node.labels, frame, [
      makeTryStatement(
        makeControlBlock([], [], main),
        makeControlBlock(
          [],
          [],
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("aran.throw"),
                  makeIntrinsicExpression("undefined"),
                  [failure],
                ),
              ),
            ),
          ],
        ),
        makeControlBlock([], [], teardown),
      ),
    ]);
  }
};

///////////////
// Statement //
///////////////

/**
 * @type {(
 *   node: import("../atom").ArgStatement,
 *   context: import("./context").Context
 * ) => import("../atom").ResStatement[]}
 */
const weaveStatement = (node, context) => {
  switch (node.type) {
    case "EffectStatement": {
      return [makeEffectStatement(weaveEffect(node.inner, context))];
    }
    case "DebuggerStatement": {
      return [makeDebuggerStatement()];
    }
    case "BreakStatement": {
      return concatX_(
        context.pointcut["break@before"](node.label, node.tag)
          ? [
              makeEffectStatement(
                makeExpressionEffect(
                  makeTrapExpression(
                    "break@before",
                    context.depth,
                    [makePrimitiveExpression(node.label)],
                    node.tag,
                  ),
                ),
              ),
            ]
          : [],
        makeBreakStatement(node.label),
      );
    }
    case "ReturnStatement": {
      const foobar = weaveExpression(node.result, context);
      return [
        makeReturnStatement(
          context.pointcut["return@before"](node.tag)
            ? makeTrapExpression(
                "return@before",
                context.depth,
                [foobar],
                node.tag,
              )
            : foobar,
        ),
      ];
    }
    case "BlockStatement": {
      return [
        makeBlockStatement(weaveControlBlock(node.body, "bare", context)),
      ];
    }
    case "IfStatement": {
      const foobar = weaveExpression(node.test, context);
      return [
        makeIfStatement(
          context.pointcut["test@before"]("if", node.tag)
            ? makeTrapExpression(
                "test@before",
                context.depth,
                [makePrimitiveExpression("if"), foobar],
                node.tag,
              )
            : foobar,
          weaveControlBlock(node.then, "then", context),
          weaveControlBlock(node.else, "else", context),
        ),
      ];
    }
    case "WhileStatement": {
      const foobar = weaveExpression(node.test, context);
      return [
        makeWhileStatement(
          context.pointcut["test@before"]("while", node.tag)
            ? makeTrapExpression(
                "test@before",
                context.depth,
                [makePrimitiveExpression("while"), foobar],
                node.tag,
              )
            : foobar,
          weaveControlBlock(node.body, "while", context),
        ),
      ];
    }
    case "TryStatement": {
      return [
        makeTryStatement(
          weaveControlBlock(node.try, "try", context),
          weaveControlBlock(node.catch, "catch", context),
          weaveControlBlock(node.finally, "finally", context),
        ),
      ];
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

////////////
// Effect //
////////////

/**
 * @type {(
 *   node: import("../atom").ArgEffect,
 *   context: import("./context").Context
 * ) => import("../atom").ResEffect}
 */
const weaveEffect = (node, context) => {
  switch (node.type) {
    case "ExpressionEffect": {
      const foobar = weaveExpression(node.discard, context);
      return makeExpressionEffect(
        context.pointcut["drop@before"](node.tag)
          ? makeTrapExpression("drop@before", context.depth, [foobar], node.tag)
          : foobar,
      );
    }
    case "WriteEffect": {
      const foobar = weaveExpression(node.value, context);
      return makeWriteEffect(
        isParameter(node.variable)
          ? node.variable
          : mangleOriginalVariable(node.variable),
        context.pointcut["write@before"](node.variable, node.tag)
          ? makeTrapExpression(
              "write@before",
              context.depth,
              [makePrimitiveExpression(node.variable), foobar],
              node.tag,
            )
          : foobar,
      );
    }
    case "ExportEffect": {
      const foobar = weaveExpression(node.value, context);
      return makeExportEffect(
        node.export,
        context.pointcut["export@before"](node.export, node.tag)
          ? makeTrapExpression(
              "export@before",
              context.depth,
              [makePrimitiveExpression(node.export), foobar],
              node.tag,
            )
          : foobar,
      );
    }
    case "ConditionalEffect": {
      const foobar = weaveExpression(node.test, context);
      return makeConditionalEffect(
        context.pointcut["test@before"]("conditional", node.tag)
          ? makeTrapExpression(
              "test@before",
              context.depth,
              [makePrimitiveExpression("conditional"), foobar],
              node.tag,
            )
          : foobar,
        map(node.positive, (child) => weaveEffect(child, context)),
        map(node.negative, (child) => weaveEffect(child, context)),
      );
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

////////////////
// Expression //
////////////////

/**
 * @type {(
 *   node: import("../atom").ArgExpression,
 *   context: import("./context").Context
 * ) => import("../atom").ResExpression}
 */
const weaveExpression = (node, context) => {
  switch (node.type) {
    case "PrimitiveExpression": {
      const result = makePrimitiveExpression(node.primitive);
      return context.pointcut["primitive@after"](
        unpackPrimitive(node.primitive),
        node.tag,
      )
        ? makeTrapExpression(
            "primitive@after",
            context.depth,
            [result],
            node.tag,
          )
        : result;
    }
    case "IntrinsicExpression": {
      const result = makeIntrinsicExpression(node.intrinsic);
      return context.pointcut["intrinsic@after"](node.intrinsic, node.tag)
        ? makeTrapExpression(
            "intrinsic@after",
            context.depth,
            [makePrimitiveExpression(node.intrinsic), result],
            node.tag,
          )
        : result;
    }
    case "ReadExpression": {
      const result = makeReadExpression(
        isParameter(node.variable)
          ? node.variable
          : mangleOriginalVariable(node.variable),
      );
      return context.pointcut["read@after"](node.variable, node.tag)
        ? makeTrapExpression(
            "read@after",
            context.depth,
            [makePrimitiveExpression(node.variable), result],
            node.tag,
          )
        : result;
    }
    case "ImportExpression": {
      const result = makeImportExpression(node.source, node.import);
      return context.pointcut["import@after"](
        node.source,
        node.import,
        node.tag,
      )
        ? makeTrapExpression(
            "import@after",
            context.depth,
            [
              makePrimitiveExpression(node.source),
              makePrimitiveExpression(node.import),
              result,
            ],
            node.tag,
          )
        : result;
    }
    case "ClosureExpression": {
      const result = makeClosureExpression(
        node.kind,
        node.asynchronous,
        node.generator,
        weaveRoutineBlock(node.body, { type: "closure", node }, context),
      );
      return context.pointcut["closure@after"](
        node.kind,
        node.asynchronous,
        node.generator,
        node.tag,
      )
        ? makeTrapExpression(
            "closure@after",
            context.depth,
            [
              makePrimitiveExpression(node.kind),
              makePrimitiveExpression(node.asynchronous),
              makePrimitiveExpression(node.generator),
              result,
            ],
            node.tag,
          )
        : result;
    }
    case "YieldExpression": {
      const result1 = weaveExpression(node.item, context);
      const result2 = context.pointcut["yield@before"](node.delegate, node.tag)
        ? makeTrapExpression(
            "yield@before",
            context.depth,
            [makePrimitiveExpression(node.delegate), result1],
            node.tag,
          )
        : result1;
      return context.pointcut["yield@after"](node.delegate, node.tag)
        ? makeTrapExpression(
            "yield@after",
            context.depth,
            [makePrimitiveExpression(node.delegate), result2],
            node.tag,
          )
        : result2;
    }
    case "AwaitExpression": {
      const result1 = weaveExpression(node.promise, context);
      const result2 = context.pointcut["await@before"](node.tag)
        ? makeTrapExpression("await@before", context.depth, [result1], node.tag)
        : result1;
      return context.pointcut["await@after"](node.tag)
        ? makeTrapExpression("await@after", context.depth, [result2], node.tag)
        : result2;
    }
    case "SequenceExpression": {
      return makeSequenceExpression(
        map(node.head, (header) => weaveEffect(header, context)),
        weaveExpression(node.tail, context),
      );
    }
    case "ConditionalExpression": {
      return makeConditionalExpression(
        context.pointcut["test@before"]("conditional", node.tag)
          ? makeTrapExpression(
              "test@before",
              context.depth,
              [makePrimitiveExpression("conditional")],
              node.tag,
            )
          : weaveExpression(node.test, context),
        weaveExpression(node.consequent, context),
        weaveExpression(node.alternate, context),
      );
    }
    case "EvalExpression": {
      if (hasOwn(context.evals, node.tag)) {
        const result1 = weaveExpression(node.code, context);
        if (context.pointcut["eval@before"](node.tag)) {
          const result2 = makeTrapExpression(
            "eval@before",
            context.depth,
            [result1, makeJsonExpression(context.evals[node.tag])],
            node.tag,
          );
          return context.pointcut["eval@after"](node.tag)
            ? makeTrapExpression(
                "eval@after",
                context.depth,
                [result2],
                node.tag,
              )
            : result2;
        } else {
          return makeSequenceExpression(
            [makeExpressionEffect(result1)],
            makeApplyExpression(
              makeIntrinsicExpression("aran.throw"),
              makeIntrinsicExpression("undefined"),
              [
                makeConstructExpression(
                  makeIntrinsicExpression("SyntaxError"),
                  [
                    makePrimitiveExpression(
                      "eval@before is required to support direct eval calls",
                    ),
                  ],
                ),
              ],
            ),
          );
        }
      } else {
        throw new AranError("missing eval context", { node, context });
      }
    }
    case "ApplyExpression": {
      const callee = weaveExpression(node.callee, context);
      const this_ = weaveExpression(node.this, context);
      const arguments_ = map(node.arguments, (argument) =>
        weaveExpression(argument, context),
      );
      return context.pointcut["apply@around"](node.tag)
        ? makeTrapExpression(
            "apply@around",
            context.depth,
            [
              callee,
              this_,
              makeApplyExpression(
                makeIntrinsicExpression("Array.of"),
                makePrimitiveExpression("undefined"),
                arguments_,
              ),
            ],
            node.tag,
          )
        : makeApplyExpression(callee, this_, arguments_);
    }
    case "ConstructExpression": {
      const callee = weaveExpression(node.callee, context);
      const arguments_ = map(node.arguments, (argument) =>
        weaveExpression(argument, context),
      );
      return context.pointcut["construct@around"](node.tag)
        ? makeTrapExpression(
            "construct@around",
            context.depth,
            [
              callee,
              makeApplyExpression(
                makeIntrinsicExpression("Array.of"),
                makePrimitiveExpression("undefined"),
                arguments_,
              ),
            ],
            node.tag,
          )
        : makeApplyExpression(
            callee,
            makePrimitiveExpression("new"),
            arguments_,
          );
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
