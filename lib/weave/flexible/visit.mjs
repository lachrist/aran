/* eslint-disable no-use-before-define */

import { AranError, AranTypeError } from "../../error.mjs";
import { isParameter } from "../../lang.mjs";
import {
  EMPTY,
  concatXXX,
  concatXXXX,
  concatX_,
  concatX_X,
  concat_X,
  flat,
  flatMap,
  hasOwn,
  listValue,
  map,
} from "../../util/index.mjs";
import { incrementDepth } from "../depth.mjs";
import {
  makeProgram,
  makeControlBlock,
  makeRoutineBlock,
  makeBlockStatement,
  makeWhileStatement,
  makeReturnStatement,
  makeYieldExpression,
  makeImportExpression,
  makeEvalExpression,
  makeApplyExpression,
  makeReadExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makeSequenceExpression,
  makePrimitiveExpression,
  makeAwaitExpression,
  makeConditionalExpression,
  makeConditionalEffect,
  makeExportEffect,
  makeWriteEffect,
  makeEffectStatement,
  makeDebuggerStatement,
  makeBreakStatement,
  makeIfStatement,
  makeClosureExpression,
  makeTryStatement,
  makePreludeBlock,
} from "../node.mjs";
import {
  COMPLETION_VARIABLE,
  FRAME_VARIABLE,
  mangleAdviceVariable,
  mangleOriginalVariable,
  mangleStateVariable,
} from "../variable.mjs";
import { listParameter, makeProgramKind } from "../parametrization.mjs";
import {
  trapApplyExpression,
  trapBlockBefore,
  trapBlockDeclaration,
  trapBlockSetup,
  trapBlockTeardown,
  trapBlockThrowing,
  trapConstructExpression,
  trapControlBlockAfter,
  trapEffectAfter,
  trapEffectBefore,
  trapEvalExpressionBefore,
  trapExpressionAfter,
  trapExpressionBefore,
  trapRoutineBlockAfter,
  trapStatementAfter,
  trapStatementBefore,
} from "./trap.mjs";
import { CLOSURE_PARENT, CONTROL_PARENT, toProgramParent } from "./parent.mjs";
import { weavePreludeHead } from "../prelude.mjs";

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
 * @type {[
 *   import("../atom").ResVariable,
 *   import("../../lang").Intrinsic,
 * ]}
 */
const FRAME_BINDING = [FRAME_VARIABLE, "undefined"];

/**
 * @type {[
 *   import("../atom").ResVariable,
 *   import("../../lang").Intrinsic,
 * ]}
 */
const COMPLETION_BINDING = [COMPLETION_VARIABLE, "undefined"];

/**
 * @type {<O extends object, K extends keyof O>(
 *   node: O,
 *   key: K,
 * ) => {
 *   origin: O[K],
 *   parent: O,
 * }}
 */
const drill = (node, key) => ({
  origin: node[key],
  parent: node,
});

/**
 * @type {<X, K extends string, N extends { [key in K]: X[] }>(
 *   node: N,
 *   key: K,
 * ) => {
 *   origin: X,
 *   parent: N,
 * }[]}
 */
const drillArray = (node, key) =>
  map(node[key], (child) => ({
    origin: child,
    parent: node,
  }));

/**
 * @type {<X>(pair: [X, unknown]) => X}
 */
const getPairFirst = ([first, _second]) => first;

/**
 * @type {<X>(pairs: [X, unknown][]) => X[]}
 */
const listPairFirst = (pairs) => map(pairs, getPairFirst);

/////////////
// Program //
/////////////

/**
 * @type {(
 *   target: import("./target").ProgramTarget,
 *   parent: {
 *     initial: import("../../json").Json,
 *   },
 *   context: import("./context").Context,
 * ) => import("../atom").ResProgram}
 */
export const weaveProgram = (target, { initial }, context) =>
  makeProgram(
    target.origin.kind,
    target.origin.situ,
    target.origin.head,
    weaveRoutineBlock(
      drill(target.origin, "body"),
      {
        type: "program",
        kind: makeProgramKind(target.origin),
        advice: flatMap(listValue(context.pointcut), listPairFirst),
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
 *   entry: [
 *     import("../atom").ArgVariable,
 *     intrinsic: import("../../lang").Intrinsic,
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
 * @type {(
 *   variable: import("../../estree").Variable,
 * ) => [
 *   import("../atom").ResVariable,
 *   import("../../lang").Intrinsic,
 * ]}
 */
const makeAdviceBinding = (variable) => [
  mangleAdviceVariable(variable),
  "undefined",
];

/**
 * @type {(
 *   variable: import("../../estree").Variable,
 * ) => import("../atom").ResEffect}
 */
const makeAdviceEffect = (variable) =>
  makeWriteEffect(
    mangleAdviceVariable(variable),
    makeApplyExpression(
      makeIntrinsicExpression("aran.get"),
      makeIntrinsicExpression("undefined"),
      [
        makeIntrinsicExpression("globalThis"),
        makePrimitiveExpression(variable),
      ],
    ),
  );

/**
 * @type {(
 *   target: import("./target").ControlBlockTarget,
 *   parent: import("./parent").ControlParent,
 *   context: import("./context").Context,
 * ) => import("../atom").ResControlBlock}
 */
const weaveControlBlock = (target, parent, old_context) => {
  const setup = trapBlockSetup(
    target,
    old_context,
    old_context.pointcut["block@setup"],
  );
  const context =
    setup.length === 0
      ? old_context
      : {
          ...old_context,
          depth: incrementDepth(old_context.depth),
        };
  const declaration = trapBlockDeclaration(
    target,
    context,
    listParameter(parent.kind),
    map(target.origin.bindings, getPairFirst),
    context.pointcut["block@declaration"],
    context.pointcut["block@declaration-overwrite"],
  );
  const bindings = concatXXX(
    setup.length === 0 ? EMPTY : [makeStateBinding(context.depth)],
    declaration.length === 0 ? EMPTY : [FRAME_BINDING],
    map(target.origin.bindings, mangleBinding),
  );
  const body = flat([
    map(setup, makeEffectStatement),
    map(declaration, makeEffectStatement),
    map(
      trapBlockBefore(target, context, context.pointcut["block@before"]),
      makeEffectStatement,
    ),
    flatMap(drillArray(target.origin, "body"), (target) =>
      weaveStatement(target, context),
    ),
    map(
      trapControlBlockAfter(
        target,
        context,
        context.pointcut["control-block@after"],
      ),
      makeEffectStatement,
    ),
  ]);
  const throwing = trapBlockThrowing(
    makeReadExpression("catch.error"),
    target,
    context,
    context.pointcut["block@throwing"],
  );
  const teardown = trapBlockTeardown(
    target,
    context,
    context.pointcut["block@teardown"],
  );
  if (
    throwing.type === "ReadExpression" &&
    throwing.variable === "catch.error" &&
    teardown.length === 0
  ) {
    return makeControlBlock(target.origin.labels, bindings, body);
  } else {
    return makeControlBlock(target.origin.labels, bindings, [
      makeTryStatement(
        makeControlBlock([], [], body),
        makeControlBlock(
          [],
          [],
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("aran.throw"),
                  makeIntrinsicExpression("undefined"),
                  [throwing],
                ),
              ),
            ),
          ],
        ),
        makeControlBlock([], [], map(teardown, makeEffectStatement)),
      ),
    ]);
  }
};

/**
 * @type {(
 *   target: import("./target").RoutineBlockTarget,
 *   parent: import("./parent").RoutineParent,
 *   context: import("./context").Context,
 * ) => import("../atom").ResRoutineBlock}
 */
const weaveRoutineBlock = (target, parent, old_context) => {
  const program = toProgramParent(parent);
  const setup = trapBlockSetup(
    target,
    old_context,
    old_context.pointcut["block@setup"],
  );
  const context =
    setup.length === 0
      ? old_context
      : {
          ...old_context,
          depth: incrementDepth(old_context.depth),
        };
  const declaration = trapBlockDeclaration(
    target,
    context,
    listParameter(parent.kind),
    map(target.origin.bindings, getPairFirst),
    context.pointcut["block@declaration"],
    context.pointcut["block@declaration-overwrite"],
  );
  const bindings = concatXXXX(
    program === null ? EMPTY : map(program.advice, makeAdviceBinding),
    setup.length === 0 ? EMPTY : [makeStateBinding(context.depth)],
    declaration.length === 0 ? EMPTY : [FRAME_BINDING],
    map(target.origin.bindings, mangleBinding),
  );
  const body = flat([
    map(
      program === null ? EMPTY : map(program.advice, makeAdviceEffect),
      makeEffectStatement,
    ),
    map(setup, makeEffectStatement),
    map(declaration, makeEffectStatement),
    map(
      trapBlockBefore(target, context, context.pointcut["block@before"]),
      makeEffectStatement,
    ),
    flatMap(drillArray(target.origin, "body"), (target) =>
      weaveStatement(target, context),
    ),
  ]);
  const tail = trapRoutineBlockAfter(
    weaveExpression(drill(target.origin, "tail"), context),
    target,
    context,
    context.pointcut["routine-block@after"],
  );
  const throwing = trapBlockThrowing(
    makeReadExpression("catch.error"),
    target,
    context,
    context.pointcut["block@throwing"],
  );
  const teardown = trapBlockTeardown(
    target,
    context,
    context.pointcut["block@teardown"],
  );
  if (
    throwing.type === "ReadExpression" &&
    throwing.variable === "catch.error" &&
    teardown.length === 0
  ) {
    return makeRoutineBlock(bindings, body, tail);
  } else {
    return makeRoutineBlock(
      concat_X(COMPLETION_BINDING, bindings),
      [
        makeTryStatement(
          makeControlBlock(
            [],
            [],
            concatX_(
              body,
              makeEffectStatement(makeWriteEffect(COMPLETION_VARIABLE, tail)),
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
                    [throwing],
                  ),
                ),
              ),
            ],
          ),
          makeControlBlock([], [], map(teardown, makeEffectStatement)),
        ),
      ],
      makeReadExpression(COMPLETION_VARIABLE),
    );
  }
};

/**
 * @type {(
 *   target: import("./target").PreludeBlockTarget,
 *   parent: import("./parent").PreludeParent,
 *   context: import("./context").Context,
 * ) => import("../atom").ResPreludeBlock}
 */
const weavePreludeBlock = (target, parent, old_context) => {
  const setup = trapBlockSetup(
    target,
    old_context,
    old_context.pointcut["block@setup"],
  );
  const context =
    setup.length === 0
      ? old_context
      : {
          ...old_context,
          depth: incrementDepth(old_context.depth),
        };
  const declaration = trapBlockDeclaration(
    target,
    context,
    listParameter(parent.kind),
    map(target.origin.bindings, getPairFirst),
    context.pointcut["block@declaration"],
    context.pointcut["block@declaration-overwrite"],
  );
  const bindings = concatXXX(
    setup.length === 0 ? EMPTY : [makeStateBinding(context.depth)],
    declaration.length === 0 ? EMPTY : [FRAME_BINDING],
    map(target.origin.bindings, mangleBinding),
  );
  const head = flat([
    setup,
    declaration,
    trapBlockBefore(target, context, context.pointcut["block@before"]),
    map(
      drillArray(target.origin, "head"),
      (target) => weaveEffect(target, context)[0],
    ),
  ]);
  const body = flatMap(drillArray(target.origin, "body"), (target) =>
    weaveStatement(target, context),
  );
  const tail = trapRoutineBlockAfter(
    weaveExpression(drill(target.origin, "tail"), context),
    target,
    context,
    context.pointcut["routine-block@after"],
  );
  const throwing = trapBlockThrowing(
    makeReadExpression("catch.error"),
    target,
    context,
    context.pointcut["block@throwing"],
  );
  const teardown = trapBlockTeardown(
    target,
    context,
    context.pointcut["block@teardown"],
  );
  if (
    throwing.type === "ReadExpression" &&
    throwing.variable === "catch.error" &&
    teardown.length === 0
  ) {
    return makePreludeBlock(
      bindings,
      weavePreludeHead(head, throwing),
      body,
      tail,
    );
  } else {
    return makePreludeBlock(
      concat_X(COMPLETION_BINDING, bindings),
      weavePreludeHead(head, throwing),
      [
        makeTryStatement(
          makeControlBlock(
            [],
            [],
            concatX_(
              body,
              makeEffectStatement(makeWriteEffect(COMPLETION_VARIABLE, tail)),
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
                    [throwing],
                  ),
                ),
              ),
            ],
          ),
          makeControlBlock([], [], map(teardown, makeEffectStatement)),
        ),
      ],
      makeReadExpression(COMPLETION_VARIABLE),
    );
  }
};

///////////////
// Statement //
///////////////

/**
 * @type {(
 *   target: import("./target").StatementTarget,
 *   context: import("./context").Context,
 * ) => import("../atom").ResStatement[]}
 */
const weaveStatement = (target, context) =>
  concatXXX(
    map(
      trapStatementBefore(
        target,
        context,
        context.pointcut["statement@before"],
      ),
      makeEffectStatement,
    ),
    weaveStatementInner(target, context),
    map(
      trapStatementAfter(target, context, context.pointcut["statement@after"]),
      makeEffectStatement,
    ),
  );

/**
 * @type {(
 *   target: import("./target").StatementTarget,
 *   context: import("./context").Context,
 * ) => import("../atom").ResStatement[]}
 */
const weaveStatementInner = ({ origin }, context) => {
  switch (origin.type) {
    case "EffectStatement": {
      return map(
        weaveEffect(drill(origin, "inner"), context),
        makeEffectStatement,
      );
    }
    case "ReturnStatement": {
      return [
        makeReturnStatement(weaveExpression(drill(origin, "result"), context)),
      ];
    }
    case "DebuggerStatement": {
      return [makeDebuggerStatement()];
    }
    case "BreakStatement": {
      return [makeBreakStatement(origin.label)];
    }
    case "BlockStatement": {
      return [
        makeBlockStatement(
          weaveControlBlock(
            drill(origin, "body"),
            CONTROL_PARENT.bare,
            context,
          ),
        ),
      ];
    }
    case "IfStatement": {
      return [
        makeIfStatement(
          weaveExpression(drill(origin, "test"), context),
          weaveControlBlock(
            drill(origin, "then"),
            CONTROL_PARENT.then,
            context,
          ),
          weaveControlBlock(
            drill(origin, "else"),
            CONTROL_PARENT.else,
            context,
          ),
        ),
      ];
    }
    case "WhileStatement": {
      return [
        makeWhileStatement(
          weaveExpression(drill(origin, "test"), context),
          weaveControlBlock(
            drill(origin, "body"),
            CONTROL_PARENT.while,
            context,
          ),
        ),
      ];
    }
    case "TryStatement": {
      return [
        makeTryStatement(
          weaveControlBlock(drill(origin, "try"), CONTROL_PARENT.try, context),
          weaveControlBlock(
            drill(origin, "catch"),
            CONTROL_PARENT.catch,
            context,
          ),
          weaveControlBlock(
            drill(origin, "finally"),
            CONTROL_PARENT.finally,
            context,
          ),
        ),
      ];
    }
    default: {
      throw new AranTypeError(origin);
    }
  }
};

////////////
// Effect //
////////////

/**
 * @type {(
 *   target: import("./target").EffectTarget,
 *   context: import("./context").Context,
 * ) => import("../atom").ResEffect[]}
 */
const weaveEffect = (target, context) =>
  concatX_X(
    trapEffectBefore(target, context, context.pointcut["effect@before"]),
    weaveEffectInner(target, context),
    trapEffectAfter(target, context, context.pointcut["effect@after"]),
  );

/**
 * @type {(
 *   target: import("./target").EffectTarget,
 *   context: import("./context").Context,
 * ) => import("../atom").ResEffect}
 */
const weaveEffectInner = ({ origin }, context) => {
  switch (origin.type) {
    case "ExpressionEffect": {
      return makeExpressionEffect(
        weaveExpression(drill(origin, "discard"), context),
      );
    }
    case "ConditionalEffect": {
      return makeConditionalEffect(
        weaveExpression(drill(origin, "test"), context),
        flat(
          map(drillArray(origin, "positive"), (target) =>
            weaveEffect(target, context),
          ),
        ),
        flat(
          map(drillArray(origin, "negative"), (target) =>
            weaveEffect(target, context),
          ),
        ),
      );
    }
    case "ExportEffect": {
      return makeExportEffect(
        origin.export,
        weaveExpression(drill(origin, "value"), context),
      );
    }
    case "WriteEffect": {
      return makeWriteEffect(
        isParameter(origin.variable)
          ? origin.variable
          : mangleOriginalVariable(origin.variable),
        weaveExpression(drill(origin, "value"), context),
      );
    }
    default: {
      throw new AranTypeError(origin);
    }
  }
};

////////////////
// Expression //
////////////////

/**
 * @type {(
 *   target: import("./target").ExpressionTarget,
 *   context: import("./context").Context,
 * ) => import("../atom").ResExpression}
 */
const weaveExpression = (target, context) =>
  makeSequenceExpression(
    trapExpressionBefore(
      target,
      context,
      context.pointcut["expression@before"],
    ),
    trapExpressionAfter(
      weaveExpressionInner(target, context),
      target,
      context,
      context.pointcut["expression@after"],
    ),
  );

/**
 * @type {(
 *   target: import("./target").ExpressionTarget,
 *   context: import("./context").Context,
 * ) => import("../atom").ResExpression}
 */
const weaveExpressionInner = ({ origin, parent }, context) => {
  switch (origin.type) {
    case "PrimitiveExpression": {
      return makePrimitiveExpression(origin.primitive);
    }
    case "IntrinsicExpression": {
      return makeIntrinsicExpression(origin.intrinsic);
    }
    case "ReadExpression": {
      return makeReadExpression(
        isParameter(origin.variable)
          ? origin.variable
          : mangleOriginalVariable(origin.variable),
      );
    }
    case "ClosureExpression": {
      if (origin.kind === "arrow") {
        return makeClosureExpression(
          origin.kind,
          origin.asynchronous,
          weaveRoutineBlock(
            drill(origin, "body"),
            CLOSURE_PARENT[origin.asynchronous ? `async-arrow` : "arrow"],
            context,
          ),
        );
      } else if (origin.kind === "function") {
        return makeClosureExpression(
          origin.kind,
          origin.asynchronous,
          weaveRoutineBlock(
            drill(origin, "body"),
            CLOSURE_PARENT[origin.asynchronous ? "async-function" : "function"],
            context,
          ),
        );
      } else if (origin.kind === "generator") {
        return makeClosureExpression(
          origin.kind,
          origin.asynchronous,
          weavePreludeBlock(
            drill(origin, "body"),
            CLOSURE_PARENT[
              origin.asynchronous ? "async-generator" : "generator"
            ],
            context,
          ),
        );
      } else {
        throw new AranTypeError(origin.kind);
      }
    }
    case "ImportExpression": {
      return makeImportExpression(origin.source, origin.import);
    }
    case "AwaitExpression": {
      return makeAwaitExpression(
        weaveExpression(drill(origin, "promise"), context),
      );
    }
    case "YieldExpression": {
      return makeYieldExpression(
        origin.delegate,
        weaveExpression(drill(origin, "item"), context),
      );
    }
    case "SequenceExpression": {
      return makeSequenceExpression(
        flat(
          map(drillArray(origin, "head"), (target) =>
            weaveEffect(target, context),
          ),
        ),
        weaveExpression({ origin: origin.tail, parent: origin }, context),
      );
    }
    case "ConditionalExpression": {
      return makeConditionalExpression(
        weaveExpression(drill(origin, "test"), context),
        weaveExpression(drill(origin, "consequent"), context),
        weaveExpression(drill(origin, "alternate"), context),
      );
    }
    case "EvalExpression": {
      if (hasOwn(context.reboot, origin.tag)) {
        return makeEvalExpression(
          trapEvalExpressionBefore(
            weaveExpression(drill(origin, "code"), context),
            {
              ...context.reboot[origin.tag],
              depth: context.depth,
            },
            { origin, parent },
            context,
            context.pointcut["eval@before"],
          ),
        );
      } else {
        throw new AranError("missing eval context", { node: origin, context });
      }
    }
    case "ApplyExpression": {
      return trapApplyExpression(
        weaveExpression(drill(origin, "callee"), context),
        weaveExpression(drill(origin, "this"), context),
        map(drillArray(origin, "arguments"), (target) =>
          weaveExpression(target, context),
        ),
        { origin, parent },
        context,
        context.pointcut["apply@around"],
      );
    }
    case "ConstructExpression": {
      return trapConstructExpression(
        weaveExpression(drill(origin, "callee"), context),
        map(drillArray(origin, "arguments"), (target) =>
          weaveExpression(target, context),
        ),
        { origin, parent },
        context,
        context.pointcut["construct@around"],
      );
    }
    default: {
      throw new AranTypeError(origin);
    }
  }
};
