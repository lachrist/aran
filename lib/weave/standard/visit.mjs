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
  flatMap,
  hasOwn,
  map,
} from "../../util/index.mjs";
import {
  makeApplyExpression,
  makeAwaitExpression,
  makeBlockStatement,
  makeBreakStatement,
  makeClosureExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeConstructExpression,
  makeControlBlock,
  makeDebuggerStatement,
  makeEffectStatement,
  makeEvalExpression,
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
  makeYieldExpression,
} from "../node.mjs";
import {
  COMPLETION_VARIABLE,
  FRAME_VARIABLE,
  mangleOriginalVariable,
  mangleStateVariable,
} from "../variable.mjs";
import { incrementDepth } from "../depth.mjs";
import { listParameter } from "../parametrization.mjs";
import {
  getRoutineHead,
  listRoutineBinding,
  listRoutineStatement,
  makeRoutineKind,
} from "../routine.mjs";
import {
  ADVICE_RENAME,
  trapApplyAround,
  trapAwaitAfter,
  trapAwaitBefore,
  trapBlockFailure,
  trapBlockFrame,
  trapBlockOverframe,
  trapBlockSetup,
  trapBlockSuccess,
  trapBlockTeardown,
  trapBreakBefore,
  trapClosureAfter,
  trapConstructAround,
  trapDropBefore,
  trapEvalAfter,
  trapEvalBefore,
  trapExportBefore,
  trapImportAfter,
  trapIntrinsicAfter,
  trapPrimitiveAfter,
  trapReadAfter,
  trapReturnBefore,
  trapTestBefore,
  trapWriteBefore,
  trapYieldAfter,
  trapYieldBefore,
} from "./trap.mjs";

/////////////
// Program //
/////////////

/**
 * @type {(
 *   node: import("../atom").ArgProgram,
 *   routine: {
 *     initial: import("../../json").Json,
 *     advice: import("../../estree").Variable,
 *   },
 *   context: import("./context").Context
 * ) => import("../atom").ResProgram}
 */
export const weaveProgram = (node, { initial, advice }, context) =>
  makeProgram(
    node.kind,
    node.situ,
    node.head,
    weaveRoutineBlock(
      node.body,
      {
        type: "program",
        node,
        renaming: [[advice, ADVICE_RENAME]],
        initial,
      },
      context,
    ),
  );

///////////
// Block //
///////////

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
 *   kind: import("../parametrization").BlockKind,
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
  const setup = trapBlockSetup(
    context1.pointcut,
    context1.depth,
    kind,
    head,
    node.tag,
  );
  const context2 =
    setup.length === 0
      ? context1
      : { ...context1, depth: incrementDepth(context1.depth) };
  const underframe = trapBlockFrame(
    context2.pointcut,
    context2.depth,
    kind,
    parameters,
    variables,
    node.tag,
  );
  const overframe = trapBlockOverframe(
    context2.pointcut,
    context2.depth,
    kind,
    parameters,
    variables,
    node.tag,
  );
  const frame = concatXXX(
    setup.length === 0 ? [] : [makeStateBinding(context2.depth)],
    overframe.length === 0 ? [] : [FRAME_BINDING],
    map(node.frame, mangleBinding),
  );
  const main = flatMap(node.body, (child) => weaveStatement(child, context2));
  const success = trapBlockSuccess(
    context2.pointcut,
    context2.depth,
    kind,
    node.type === "RoutineBlock"
      ? weaveExpression(node.completion, context2)
      : null,
    node.tag,
  );
  const failure = trapBlockFailure(
    context2.pointcut,
    context2.depth,
    kind,
    makeReadExpression("catch.error"),
    node.tag,
  );
  const teardown = trapBlockTeardown(
    context2.pointcut,
    context2.depth,
    kind,
    node.tag,
  );
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
 *   routine: import("../routine").Routine,
 *   context: import("./context").Context,
 * ) => import("../atom").ResRoutineBlock}
 */
const weaveRoutineBlock = (node, routine, context) => {
  const kind = makeRoutineKind(routine);
  const { frame, body, success, failure, teardown } = trapBlock(
    kind,
    getRoutineHead(routine),
    node,
    context,
  );
  const main = concatXX(listRoutineStatement(routine), body);
  if (
    failure.type === "ReadExpression" &&
    failure.variable === "catch.error" &&
    teardown.length === 0
  ) {
    return makeRoutineBlock(
      concatXX(listRoutineBinding(routine), frame),
      main,
      /** @type {import("../atom").ResExpression} */ (success),
    );
  } else {
    return makeRoutineBlock(
      concat_XX(COMPLETION_BINDING, listRoutineBinding(routine), frame),
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
 *   kind: import("../parametrization").ControlKind,
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
        trapBreakBefore(context.pointcut, context.depth, node.label, node.tag),
        makeBreakStatement(node.label),
      );
    }
    case "ReturnStatement": {
      return [
        makeReturnStatement(
          trapReturnBefore(
            context.pointcut,
            context.depth,
            weaveExpression(node.result, context),
            node.tag,
          ),
        ),
      ];
    }
    case "BlockStatement": {
      return [
        makeBlockStatement(weaveControlBlock(node.body, "bare", context)),
      ];
    }
    case "IfStatement": {
      return [
        makeIfStatement(
          trapTestBefore(
            context.pointcut,
            context.depth,
            "if",
            weaveExpression(node.test, context),
            node.tag,
          ),
          weaveControlBlock(node.then, "then", context),
          weaveControlBlock(node.else, "else", context),
        ),
      ];
    }
    case "WhileStatement": {
      return [
        makeWhileStatement(
          trapTestBefore(
            context.pointcut,
            context.depth,
            "while",
            weaveExpression(node.test, context),
            node.tag,
          ),
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
      return makeExpressionEffect(
        trapDropBefore(
          context.pointcut,
          context.depth,
          weaveExpression(node.discard, context),
          node.tag,
        ),
      );
    }
    case "WriteEffect": {
      return makeWriteEffect(
        isParameter(node.variable)
          ? node.variable
          : mangleOriginalVariable(node.variable),
        trapWriteBefore(
          context.pointcut,
          context.depth,
          node.variable,
          weaveExpression(node.value, context),
          node.tag,
        ),
      );
    }
    case "ExportEffect": {
      return makeExportEffect(
        node.export,
        trapExportBefore(
          context.pointcut,
          context.depth,
          node.export,
          weaveExpression(node.value, context),
          node.tag,
        ),
      );
    }
    case "ConditionalEffect": {
      return makeConditionalEffect(
        trapTestBefore(
          context.pointcut,
          context.depth,
          "conditional",
          weaveExpression(node.test, context),
          node.tag,
        ),
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
      return trapPrimitiveAfter(
        context.pointcut,
        context.depth,
        unpackPrimitive(node.primitive),
        makePrimitiveExpression(node.primitive),
        node.tag,
      );
    }
    case "IntrinsicExpression": {
      return trapIntrinsicAfter(
        context.pointcut,
        context.depth,
        node.intrinsic,
        makeIntrinsicExpression(node.intrinsic),
        node.tag,
      );
    }
    case "ReadExpression": {
      return trapReadAfter(
        context.pointcut,
        context.depth,
        node.variable,
        makeReadExpression(
          isParameter(node.variable)
            ? node.variable
            : mangleOriginalVariable(node.variable),
        ),
        node.tag,
      );
    }
    case "ImportExpression": {
      return trapImportAfter(
        context.pointcut,
        context.depth,
        node.source,
        node.import,
        makeImportExpression(node.source, node.import),
        node.tag,
      );
    }
    case "ClosureExpression": {
      return trapClosureAfter(
        context.pointcut,
        context.depth,
        node.kind,
        node.asynchronous,
        node.generator,
        makeClosureExpression(
          node.kind,
          node.asynchronous,
          node.generator,
          weaveRoutineBlock(node.body, { type: "closure", node }, context),
        ),
        node.tag,
      );
    }
    case "SequenceExpression": {
      return makeSequenceExpression(
        map(node.head, (header) => weaveEffect(header, context)),
        weaveExpression(node.tail, context),
      );
    }
    case "ConditionalExpression": {
      return makeConditionalExpression(
        trapTestBefore(
          context.pointcut,
          context.depth,
          "conditional",
          weaveExpression(node.test, context),
          node.tag,
        ),
        weaveExpression(node.consequent, context),
        weaveExpression(node.alternate, context),
      );
    }
    case "YieldExpression": {
      return trapYieldAfter(
        context.pointcut,
        context.depth,
        node.delegate,
        makeYieldExpression(
          node.delegate,
          trapYieldBefore(
            context.pointcut,
            context.depth,
            node.delegate,
            weaveExpression(node.item, context),
            node.tag,
          ),
        ),
        node.tag,
      );
    }
    case "AwaitExpression": {
      return trapAwaitAfter(
        context.pointcut,
        context.depth,
        makeAwaitExpression(
          trapAwaitBefore(
            context.pointcut,
            context.depth,
            weaveExpression(node.promise, context),
            node.tag,
          ),
        ),
        node.tag,
      );
    }
    case "EvalExpression": {
      if (hasOwn(context.reboot, node.tag)) {
        const argument = trapEvalBefore(
          context.pointcut,
          context.depth,
          {
            ...context.reboot[node.tag],
            depth: context.depth,
          },
          weaveExpression(node.code, context),
          node.tag,
        );
        if (argument === null) {
          return makeApplyExpression(
            makeIntrinsicExpression("aran.throw"),
            makeIntrinsicExpression("undefined"),
            [
              makeConstructExpression(makeIntrinsicExpression("SyntaxError"), [
                makePrimitiveExpression(
                  "eval@before is required to support direct eval calls",
                ),
              ]),
            ],
          );
        } else {
          return trapEvalAfter(
            context.pointcut,
            context.depth,
            makeEvalExpression(argument),
            node.tag,
          );
        }
      } else {
        throw new AranError("missing eval context", { node, context });
      }
    }
    case "ApplyExpression": {
      return trapApplyAround(
        context.pointcut,
        context.depth,
        weaveExpression(node.callee, context),
        weaveExpression(node.this, context),
        map(node.arguments, (argument) => weaveExpression(argument, context)),
        node.tag,
      );
    }
    case "ConstructExpression": {
      return trapConstructAround(
        context.pointcut,
        context.depth,
        weaveExpression(node.callee, context),
        map(node.arguments, (argument) => weaveExpression(argument, context)),
        node.tag,
      );
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
