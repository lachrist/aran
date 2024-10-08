/* eslint-disable no-use-before-define */

import { AranExecError, AranTypeError } from "../../report.mjs";
import { isParameter, unpackPrimitive } from "../../lang.mjs";
import {
  EMPTY,
  concatXX,
  concatXXX,
  concatXXXXX,
  concatXX_,
  concatX_,
  concat_X,
  filterNarrow,
  flat,
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
  makeRoutineBlock,
  makeSequenceExpression,
  makeTryStatement,
  makeWhileStatement,
  makeWriteEffect,
  makeYieldExpression,
} from "../node.mjs";
import {
  ADVICE_VARIABLE,
  COMPLETION_VARIABLE,
  FRAME_VARIABLE,
  mangleOriginalVariable,
  mangleStateVariable,
} from "../variable.mjs";
import { ROOT_DEPTH, incrementDepth } from "../depth.mjs";
import { listParameter, makeProgramKind } from "../parametrization.mjs";
import {
  trapApplyAround,
  trapAwaitAfter,
  trapAwaitBefore,
  trapControlBlockAfter,
  trapRoutineBlockBefore,
  trapControlBlockBefore,
  trapBlockDeclaration,
  trapBlockThrowing,
  trapBlockDeclarationOverwrite,
  trapBlockSetup,
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
  trapTestBefore,
  trapWriteBefore,
  trapYieldAfter,
  trapYieldBefore,
  trapGeneratorBlockSuspension,
  trapGeneratorBlockResumption,
  trapRoutineBlockAfter,
} from "./trap.mjs";
import { CLOSURE_PARENT, CONTROL_PARENT, toProgramParent } from "./parent.mjs";
import { isDeclareHeader, isModuleHeader } from "../../header.mjs";
import { weaveRoutineHead } from "../prelude.mjs";
import { makeJsonExpression } from "../json.mjs";

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
const ADVICE_BINDING = [ADVICE_VARIABLE, "undefined"];

/**
 * @type {[
 *   import("../atom").ResVariable,
 *   import("../../lang").Intrinsic,
 * ]}
 */
const COMPLETION_BINDING = [COMPLETION_VARIABLE, "undefined"];

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
        kind: makeProgramKind(node),
        head: concatXX(
          filterNarrow(node.head, isModuleHeader),
          filterNarrow(node.head, isDeclareHeader),
        ),
        advice,
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
 *   node: import("../atom").ArgControlBlock,
 *   parent: import("./parent").ControlParent,
 *   context: import("./context").Context,
 * ) => import("../atom").ResControlBlock}
 */
const weaveControlBlock = (node, parent, context1) => {
  const parameters = listParameter(parent.kind);
  const variables = map(node.bindings, getBindingVariable);
  const setup = trapBlockSetup(
    context1.pointcut,
    context1.depth,
    parent.kind,
    node.tag,
  );
  const context2 =
    setup.length === 0
      ? context1
      : { ...context1, depth: incrementDepth(context1.depth) };
  const declaration = trapBlockDeclarationOverwrite(
    context2.pointcut,
    context2.depth,
    parent.kind,
    parameters,
    variables,
    node.tag,
  );
  const bindings = concatXXX(
    setup.length === 0 ? EMPTY : [makeStateBinding(context2.depth)],
    declaration.length === 0 ? EMPTY : [FRAME_BINDING],
    map(node.bindings, mangleBinding),
  );
  const body = flat([
    map(setup, makeEffectStatement),
    map(
      trapControlBlockBefore(
        context2.pointcut,
        context2.depth,
        parent.kind,
        node.labels,
        node.tag,
      ),
      makeEffectStatement,
    ),
    map(
      trapBlockDeclaration(
        context2.pointcut,
        context2.depth,
        parent.kind,
        parameters,
        variables,
        node.tag,
      ),
      makeEffectStatement,
    ),
    map(declaration, makeEffectStatement),
    flatMap(node.body, (child) => weaveStatement(child, context2)),
    map(
      trapControlBlockAfter(
        context2.pointcut,
        context2.depth,
        parent.kind,
        node.tag,
      ),
      makeEffectStatement,
    ),
  ]);
  const throwing = trapBlockThrowing(
    context2.pointcut,
    context2.depth,
    parent.kind,
    makeReadExpression("catch.error"),
    node.tag,
  );
  const teardown = trapBlockTeardown(
    context2.pointcut,
    context2.depth,
    parent.kind,
    node.tag,
  );
  if (
    throwing.type === "ReadExpression" &&
    throwing.variable === "catch.error" &&
    teardown.length === 0
  ) {
    return makeControlBlock(node.labels, bindings, body);
  } else {
    return makeControlBlock(node.labels, bindings, [
      makeTryStatement(
        makeControlBlock(EMPTY, EMPTY, body),
        makeControlBlock(EMPTY, EMPTY, [
          makeEffectStatement(
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("aran.throw"),
                makeIntrinsicExpression("undefined"),
                [throwing],
              ),
            ),
          ),
        ]),
        makeControlBlock(EMPTY, EMPTY, map(teardown, makeEffectStatement)),
      ),
    ]);
  }
};

/**
 * @type {(
 *   node: import("../atom").ArgRoutineBlock,
 *   parent: import("./parent").RoutineParent,
 *   context: import("./context").Context,
 * ) => import("../atom").ResRoutineBlock}
 */
const weaveRoutineBlock = (node, parent, context1) => {
  const program = toProgramParent(parent);
  const parameters = listParameter(parent.kind);
  const variables = map(node.bindings, getBindingVariable);
  const setup = trapBlockSetup(
    context1.pointcut,
    context1.depth,
    parent.kind,
    node.tag,
  );
  const context2 =
    setup.length === 0
      ? context1
      : { ...context1, depth: incrementDepth(context1.depth) };
  const declaration = trapBlockDeclarationOverwrite(
    context2.pointcut,
    context2.depth,
    parent.kind,
    parameters,
    variables,
    node.tag,
  );
  const bindings = concatXXXXX(
    program === null ? EMPTY : [ADVICE_BINDING],
    program !== null && context1.depth === ROOT_DEPTH
      ? [makeStateBinding(ROOT_DEPTH)]
      : EMPTY,
    setup.length === 0 ? EMPTY : [makeStateBinding(context2.depth)],
    declaration.length === 0 ? EMPTY : [FRAME_BINDING],
    map(node.bindings, mangleBinding),
  );
  const head = flat([
    program === null
      ? EMPTY
      : [
          makeWriteEffect(
            ADVICE_VARIABLE,
            makeApplyExpression(
              makeIntrinsicExpression("aran.get"),
              makeIntrinsicExpression("undefined"),
              [
                makeIntrinsicExpression("globalThis"),
                makePrimitiveExpression(program.advice),
              ],
            ),
          ),
        ],
    context1.depth === ROOT_DEPTH && program !== null
      ? [
          makeWriteEffect(
            mangleStateVariable(ROOT_DEPTH),
            makeJsonExpression(program.initial),
          ),
        ]
      : EMPTY,
    setup,
    trapRoutineBlockBefore(
      context2.pointcut,
      context2.depth,
      parent.kind,
      program === null ? [] : program.head,
      node.tag,
    ),
    trapBlockDeclaration(
      context2.pointcut,
      context2.depth,
      parent.kind,
      parameters,
      variables,
      node.tag,
    ),
    declaration,
    node.head === null
      ? []
      : map(node.head, (child) => weaveEffect(child, context2)),
    parent.kind === "generator" || parent.kind === "async-generator"
      ? trapGeneratorBlockSuspension(
          context2.pointcut,
          context2.depth,
          parent.kind,
          node.tag,
        )
      : [],
  ]);
  const body = concatXX(
    parent.kind === "generator" || parent.kind === "async-generator"
      ? map(
          trapGeneratorBlockResumption(
            context2.pointcut,
            context2.depth,
            parent.kind,
            node.tag,
          ),
          makeEffectStatement,
        )
      : [],
    flatMap(node.body, (child) => weaveStatement(child, context2)),
  );
  const tail = trapRoutineBlockAfter(
    context2.pointcut,
    context2.depth,
    parent.kind,
    weaveExpression(node.tail, context2),
    node.tag,
  );
  const throwing = trapBlockThrowing(
    context2.pointcut,
    context2.depth,
    parent.kind,
    makeReadExpression("catch.error"),
    node.tag,
  );
  const teardown = trapBlockTeardown(
    context2.pointcut,
    context2.depth,
    parent.kind,
    node.tag,
  );
  if (
    throwing.type === "ReadExpression" &&
    throwing.variable === "catch.error" &&
    teardown.length === 0
  ) {
    return makeRoutineBlock(
      bindings,
      node.head === null ? null : head,
      node.head === null
        ? concatXX(map(head, makeEffectStatement), body)
        : body,
      tail,
    );
  } else {
    return makeRoutineBlock(
      concat_X(COMPLETION_BINDING, bindings),
      node.head === null ? null : weaveRoutineHead(head, throwing, teardown),
      [
        makeTryStatement(
          makeControlBlock(
            EMPTY,
            EMPTY,
            concatXX_(
              node.head === null ? map(head, makeEffectStatement) : EMPTY,
              body,
              makeEffectStatement(makeWriteEffect(COMPLETION_VARIABLE, tail)),
            ),
          ),
          makeControlBlock(EMPTY, EMPTY, [
            makeEffectStatement(
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("aran.throw"),
                  makeIntrinsicExpression("undefined"),
                  [throwing],
                ),
              ),
            ),
          ]),
          makeControlBlock(EMPTY, EMPTY, map(teardown, makeEffectStatement)),
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
        map(
          trapBreakBefore(
            context.pointcut,
            context.depth,
            node.label,
            node.tag,
          ),
          makeEffectStatement,
        ),
        makeBreakStatement(node.label),
      );
    }
    case "BlockStatement": {
      return [
        makeBlockStatement(
          weaveControlBlock(node.body, CONTROL_PARENT.bare, context),
        ),
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
          weaveControlBlock(node.then, CONTROL_PARENT.then, context),
          weaveControlBlock(node.else, CONTROL_PARENT.else, context),
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
          weaveControlBlock(node.body, CONTROL_PARENT.while, context),
        ),
      ];
    }
    case "TryStatement": {
      return [
        makeTryStatement(
          weaveControlBlock(node.try, CONTROL_PARENT.try, context),
          weaveControlBlock(node.catch, CONTROL_PARENT.catch, context),
          weaveControlBlock(node.finally, CONTROL_PARENT.finally, context),
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
      /** @type {import("../parametrization").ClosureKind} */
      const kind = node.asynchronous ? `async-${node.kind}` : node.kind;
      return trapClosureAfter(
        context.pointcut,
        context.depth,
        kind,
        makeClosureExpression(
          node.kind,
          node.asynchronous,
          weaveRoutineBlock(node.body, CLOSURE_PARENT[kind], context),
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
        return trapEvalAfter(
          context.pointcut,
          context.depth,
          makeEvalExpression(
            trapEvalBefore(
              context.pointcut,
              context.depth,
              {
                ...context.reboot[node.tag],
                type: "aran",
                depth: context.depth,
              },
              weaveExpression(node.code, context),
              node.tag,
            ),
          ),
          node.tag,
        );
      } else {
        throw new AranExecError("missing eval context", { node, context });
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
