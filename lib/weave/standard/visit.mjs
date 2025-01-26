/* eslint-disable no-use-before-define */

import { AranTypeError } from "../../error.mjs";
import {
  isParameter,
  unpackPrimitive,
  isDeclareHeader,
  isModuleHeader,
} from "../../lang/index.mjs";
import {
  EMPTY,
  concatXX,
  concat_X,
  filterNarrow,
  flat,
  flatenTree,
  isTreeEmpty,
  map,
  mapTree,
} from "../../util/index.mjs";
import {
  makeApplyExpression,
  makeAwaitExpression,
  makeBlockStatement,
  makeBreakStatement,
  makeClosureExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeSegmentBlock,
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
import { incrementDepth } from "../depth.mjs";
import { listParameter, makeProgramKind } from "../parametrization.mjs";
import {
  trapApplyAround,
  trapAwaitAfter,
  trapAwaitBefore,
  trapSegmentBlockAfter,
  trapRoutineBlockBefore,
  trapSegmentBlockBefore,
  trapBlockDeclaration,
  trapBlockThrowing,
  trapBlockDeclarationOverwrite,
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
  trapBlockSetup,
} from "./trap.mjs";
import { CLOSURE_PARENT, CONTROL_PARENT } from "./parent.mjs";
import { weaveRoutineHead } from "../prelude.mjs";
import { makeJsonExpression } from "../json.mjs";

/**
 * @type {[
 *   import("../atom").ResVariable,
 *   import("../../lang/syntax").Intrinsic,
 * ]}
 */
const FRAME_BINDING = [FRAME_VARIABLE, "undefined"];

/**
 * @type {[
 *   import("../atom").ResVariable,
 *   import("../../lang/syntax").Intrinsic,
 * ]}
 */
const ADVICE_BINDING = [ADVICE_VARIABLE, "undefined"];

/**
 * @type {[
 *   import("../atom").ResVariable,
 *   import("../../lang/syntax").Intrinsic,
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
 *     initial: import("../../util/util").Json,
 *     advice: string,
 *   },
 *   context: import("./context").Context,
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
    node.tag,
  );

///////////
// Block //
///////////

/**
 * @type {(
 *   binding: [
 *     import("../atom").ArgVariable,
 *     import("../../lang/syntax").Intrinsic,
 *   ],
 * ) => import("../atom").ArgVariable}
 */
const getBindingVariable = ([variable, _intrinsic]) => variable;

/**
 * @type {(
 *   binding: [
 *     import("../atom").ArgVariable,
 *     import("../../lang/syntax").Intrinsic,
 *   ],
 * ) => [
 *   import("../atom").ResVariable,
 *   import("../../lang/syntax").Intrinsic,
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
 *   import("../../lang/syntax").Intrinsic,
 * ]}
 */
const makeStateBinding = (depth) => [mangleStateVariable(depth), "undefined"];

/**
 * @type {(
 *   node: import("../atom").ArgSegmentBlock,
 *   parent: import("./parent").SegmentParent,
 *   context: import("./context").Context,
 * ) => import("../atom").ResSegmentBlock}
 */
const weaveSegmentBlock = (node, parent, context1) => {
  const { tag } = node;
  const parameters = listParameter(parent.kind);
  const variables = map(node.bindings, getBindingVariable);
  const setup = trapBlockSetup(
    context1.pointcut,
    context1.depth,
    parent.kind,
    tag,
  );
  const context2 = isTreeEmpty(setup)
    ? context1
    : { ...context1, depth: incrementDepth(context1.depth) };
  const declaration = trapBlockDeclarationOverwrite(
    context2.pointcut,
    context2.depth,
    parent.kind,
    parameters,
    variables,
    tag,
  );
  // Cannot use Tree because nodes are arrays themselves.
  /**
   * @type {import("../atom").ResBinding[]}
   */
  const bindings = flat([
    isTreeEmpty(setup) ? EMPTY : [makeStateBinding(context2.depth)],
    isTreeEmpty(declaration) ? EMPTY : [FRAME_BINDING],
    map(node.bindings, mangleBinding),
  ]);
  const body = [
    mapTree(setup, (node) => makeEffectStatement(node, tag)),
    mapTree(
      trapSegmentBlockBefore(
        context2.pointcut,
        context2.depth,
        parent.kind,
        node.labels,
        tag,
      ),
      (node) => makeEffectStatement(node, tag),
    ),
    mapTree(
      trapBlockDeclaration(
        context2.pointcut,
        context2.depth,
        parent.kind,
        parameters,
        variables,
        tag,
      ),
      (node) => makeEffectStatement(node, tag),
    ),
    mapTree(declaration, (node) => makeEffectStatement(node, tag)),
    map(node.body, (child) => weaveStatement(child, context2)),
    mapTree(
      trapSegmentBlockAfter(
        context2.pointcut,
        context2.depth,
        parent.kind,
        tag,
      ),
      (node) => makeEffectStatement(node, tag),
    ),
  ];
  const throwing = trapBlockThrowing(
    context2.pointcut,
    context2.depth,
    parent.kind,
    makeReadExpression("catch.error", tag),
    tag,
  );
  const teardown = trapBlockTeardown(
    context2.pointcut,
    context2.depth,
    parent.kind,
    tag,
  );
  if (
    throwing.type === "ReadExpression" &&
    throwing.variable === "catch.error" &&
    isTreeEmpty(teardown)
  ) {
    return makeSegmentBlock(node.labels, bindings, flatenTree(body), tag);
  } else {
    return makeSegmentBlock(
      node.labels,
      bindings,
      [
        makeTryStatement(
          makeSegmentBlock(EMPTY, EMPTY, flatenTree(body), tag),
          makeSegmentBlock(
            EMPTY,
            EMPTY,
            [
              makeEffectStatement(
                makeExpressionEffect(
                  makeApplyExpression(
                    makeIntrinsicExpression("aran.throw", tag),
                    makeIntrinsicExpression("undefined", tag),
                    [throwing],
                    tag,
                  ),
                  tag,
                ),
                tag,
              ),
            ],
            tag,
          ),
          makeSegmentBlock(
            EMPTY,
            EMPTY,
            mapTree(teardown, (node) => makeEffectStatement(node, tag)),
            tag,
          ),
          tag,
        ),
      ],
      tag,
    );
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
  const { tag } = node;
  const parameters = listParameter(parent.kind);
  const variables = map(node.bindings, getBindingVariable);
  const setup = trapBlockSetup(
    context1.pointcut,
    context1.depth,
    parent.kind,
    tag,
  );
  const context2 = isTreeEmpty(setup)
    ? context1
    : { ...context1, depth: incrementDepth(context1.depth) };
  const declaration = trapBlockDeclarationOverwrite(
    context2.pointcut,
    context2.depth,
    parent.kind,
    parameters,
    variables,
    tag,
  );
  // Cannot use Tree because nodes are arrays themselves.
  /**
   * @type {import("../atom").ResBinding[]}
   */
  const bindings = flat([
    parent.type === "program" ? [ADVICE_BINDING] : EMPTY,
    parent.type === "program" ? [makeStateBinding(context1.depth)] : EMPTY,
    isTreeEmpty(setup) ? EMPTY : [makeStateBinding(context2.depth)],
    isTreeEmpty(declaration) ? EMPTY : [FRAME_BINDING],
    map(node.bindings, mangleBinding),
  ]);
  const head = [
    parent.type === "program"
      ? makeWriteEffect(
          ADVICE_VARIABLE,
          makeApplyExpression(
            makeIntrinsicExpression("aran.get", tag),
            makeIntrinsicExpression("undefined", tag),
            [
              makeIntrinsicExpression("globalThis", tag),
              makePrimitiveExpression(parent.advice, tag),
            ],
            tag,
          ),
          tag,
        )
      : null,
    parent.type === "program"
      ? makeWriteEffect(
          mangleStateVariable(context1.depth),
          makeJsonExpression(parent.initial, tag),
          tag,
        )
      : null,
    setup,
    trapRoutineBlockBefore(
      context2.pointcut,
      context2.depth,
      parent.kind,
      parent.type === "program" ? parent.head : EMPTY,
      tag,
    ),
    trapBlockDeclaration(
      context2.pointcut,
      context2.depth,
      parent.kind,
      parameters,
      variables,
      tag,
    ),
    declaration,
    node.head === null
      ? null
      : map(node.head, (child) => weaveEffect(child, context2)),
    parent.kind === "generator" || parent.kind === "async-generator"
      ? trapGeneratorBlockSuspension(
          context2.pointcut,
          context2.depth,
          parent.kind,
          tag,
        )
      : null,
  ];
  const body = [
    parent.kind === "generator" || parent.kind === "async-generator"
      ? mapTree(
          trapGeneratorBlockResumption(
            context2.pointcut,
            context2.depth,
            parent.kind,
            tag,
          ),
          (node) => makeEffectStatement(node, tag),
        )
      : null,
    map(node.body, (child) => weaveStatement(child, context2)),
  ];
  const tail = trapRoutineBlockAfter(
    context2.pointcut,
    context2.depth,
    parent.kind,
    weaveExpression(node.tail, context2),
    tag,
  );
  const throwing = trapBlockThrowing(
    context2.pointcut,
    context2.depth,
    parent.kind,
    makeReadExpression("catch.error", tag),
    tag,
  );
  const teardown = trapBlockTeardown(
    context2.pointcut,
    context2.depth,
    parent.kind,
    tag,
  );
  if (
    throwing.type === "ReadExpression" &&
    throwing.variable === "catch.error" &&
    isTreeEmpty(teardown)
  ) {
    return makeRoutineBlock(
      bindings,
      node.head === null ? null : flatenTree(head),
      flatenTree(
        node.head === null
          ? [mapTree(head, (node) => makeEffectStatement(node, tag)), body]
          : body,
      ),
      tail,
      tag,
    );
  } else {
    return makeRoutineBlock(
      concat_X(COMPLETION_BINDING, bindings),
      node.head === null
        ? null
        : flatenTree(weaveRoutineHead(head, throwing, teardown, tag)),
      [
        makeTryStatement(
          makeSegmentBlock(
            EMPTY,
            EMPTY,
            flatenTree([
              node.head === null
                ? mapTree(head, (node) => makeEffectStatement(node, tag))
                : null,
              body,
              makeEffectStatement(
                makeWriteEffect(COMPLETION_VARIABLE, tail, tag),
                tag,
              ),
            ]),
            tag,
          ),
          makeSegmentBlock(
            EMPTY,
            EMPTY,
            [
              makeEffectStatement(
                makeExpressionEffect(
                  makeApplyExpression(
                    makeIntrinsicExpression("aran.throw", tag),
                    makeIntrinsicExpression("undefined", tag),
                    [throwing],
                    tag,
                  ),
                  tag,
                ),
                tag,
              ),
            ],
            tag,
          ),
          makeSegmentBlock(
            EMPTY,
            EMPTY,
            mapTree(teardown, (node) => makeEffectStatement(node, tag)),
            tag,
          ),
          tag,
        ),
      ],
      makeReadExpression(COMPLETION_VARIABLE, tag),
      tag,
    );
  }
};

///////////////
// Statement //
///////////////

/**
 * @type {(
 *   node: import("../atom").ArgStatement,
 *   context: import("./context").Context,
 * ) => import("../../util/tree").Tree<import("../atom").ResStatement>}
 */
const weaveStatement = (node, context) => {
  const { tag } = node;
  switch (node.type) {
    case "EffectStatement": {
      return makeEffectStatement(weaveEffect(node.inner, context), tag);
    }
    case "DebuggerStatement": {
      return makeDebuggerStatement(tag);
    }
    case "BreakStatement": {
      return [
        mapTree(
          trapBreakBefore(context.pointcut, context.depth, node.label, tag),
          (node) => makeEffectStatement(node, tag),
        ),
        makeBreakStatement(node.label, tag),
      ];
    }
    case "BlockStatement": {
      return makeBlockStatement(
        weaveSegmentBlock(node.body, CONTROL_PARENT.bare, context),
        tag,
      );
    }
    case "IfStatement": {
      return makeIfStatement(
        trapTestBefore(
          context.pointcut,
          context.depth,
          "if",
          weaveExpression(node.test, context),
          tag,
        ),
        weaveSegmentBlock(node.then, CONTROL_PARENT.then, context),
        weaveSegmentBlock(node.else, CONTROL_PARENT.else, context),
        tag,
      );
    }
    case "WhileStatement": {
      return makeWhileStatement(
        trapTestBefore(
          context.pointcut,
          context.depth,
          "while",
          weaveExpression(node.test, context),
          tag,
        ),
        weaveSegmentBlock(node.body, CONTROL_PARENT.while, context),
        tag,
      );
    }
    case "TryStatement": {
      return makeTryStatement(
        weaveSegmentBlock(node.try, CONTROL_PARENT.try, context),
        weaveSegmentBlock(node.catch, CONTROL_PARENT.catch, context),
        weaveSegmentBlock(node.finally, CONTROL_PARENT.finally, context),
        tag,
      );
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
 *   context: import("./context").Context,
 * ) => import("../atom").ResEffect}
 */
const weaveEffect = (node, context) => {
  const { tag } = node;
  switch (node.type) {
    case "ExpressionEffect": {
      return makeExpressionEffect(
        trapDropBefore(
          context.pointcut,
          context.depth,
          weaveExpression(node.discard, context),
          tag,
        ),
        tag,
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
          tag,
        ),
        tag,
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
          tag,
        ),
        tag,
      );
    }
    case "ConditionalEffect": {
      return makeConditionalEffect(
        trapTestBefore(
          context.pointcut,
          context.depth,
          "conditional",
          weaveExpression(node.test, context),
          tag,
        ),
        map(node.positive, (child) => weaveEffect(child, context)),
        map(node.negative, (child) => weaveEffect(child, context)),
        tag,
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
 *   context: import("./context").Context,
 * ) => import("../atom").ResExpression}
 */
const weaveExpression = (node, context) => {
  const { tag } = node;
  switch (node.type) {
    case "PrimitiveExpression": {
      return trapPrimitiveAfter(
        context.pointcut,
        context.depth,
        unpackPrimitive(node.primitive),
        makePrimitiveExpression(node.primitive, tag),
        tag,
      );
    }
    case "IntrinsicExpression": {
      return trapIntrinsicAfter(
        context.pointcut,
        context.depth,
        node.intrinsic,
        makeIntrinsicExpression(node.intrinsic, tag),
        tag,
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
          tag,
        ),
        tag,
      );
    }
    case "ImportExpression": {
      return trapImportAfter(
        context.pointcut,
        context.depth,
        node.source,
        node.import,
        makeImportExpression(node.source, node.import, tag),
        tag,
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
          tag,
        ),
        tag,
      );
    }
    case "SequenceExpression": {
      return makeSequenceExpression(
        map(node.head, (header) => weaveEffect(header, context)),
        weaveExpression(node.tail, context),
        tag,
      );
    }
    case "ConditionalExpression": {
      return makeConditionalExpression(
        trapTestBefore(
          context.pointcut,
          context.depth,
          "conditional",
          weaveExpression(node.test, context),
          tag,
        ),
        weaveExpression(node.consequent, context),
        weaveExpression(node.alternate, context),
        tag,
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
            tag,
          ),
          tag,
        ),
        tag,
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
            tag,
          ),
          tag,
        ),
        tag,
      );
    }
    case "EvalExpression": {
      return trapEvalAfter(
        context.pointcut,
        context.depth,
        makeEvalExpression(
          trapEvalBefore(
            context.pointcut,
            context.depth,
            weaveExpression(node.code, context),
            tag,
          ),
          tag,
        ),
        tag,
      );
    }
    case "ApplyExpression": {
      return trapApplyAround(
        context.pointcut,
        context.depth,
        weaveExpression(node.callee, context),
        weaveExpression(node.this, context),
        map(node.arguments, (argument) => weaveExpression(argument, context)),
        tag,
      );
    }
    case "ConstructExpression": {
      return trapConstructAround(
        context.pointcut,
        context.depth,
        weaveExpression(node.callee, context),
        map(node.arguments, (argument) => weaveExpression(argument, context)),
        tag,
      );
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
