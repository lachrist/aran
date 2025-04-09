/* eslint-disable no-use-before-define */

import { AranPointcutError, AranTypeError } from "../../error.mjs";
import { isHeadfulRoutineBlock, isParameter } from "../../lang/index.mjs";
import {
  flatenTree,
  flatMap,
  isTreeEmpty,
  listValue,
  map,
  mapTree,
  compileGet,
  get0,
  reduce,
  EMPTY,
  flat,
} from "../../util/index.mjs";
import { incrementDepth } from "../depth.mjs";
import {
  makeProgram,
  makeSegmentBlock,
  makeRoutineBlock,
  makeBlockStatement,
  makeWhileStatement,
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
  makeConstructExpression,
} from "../node.mjs";
import {
  COMPLETION_VARIABLE,
  FRAME_VARIABLE,
  mangleAdviceVariable,
  mangleOriginalVariable,
  mangleStateVariable,
} from "../variable.mjs";
import {
  isProgramKind,
  listParameter,
  makeProgramKind,
} from "../parametrization.mjs";
import {
  trapBlockNotif,
  trapBlockResult,
  trapBlockState,
  trapEffectNotif,
  trapExpressionAround,
  trapExpressionNotif,
  trapExpressionResult,
  trapStatementNotif,
} from "./trap.mjs";
import { CLOSURE_PARENT, SEGMENT_PARENT } from "./parent.mjs";
import { weaveRoutineHead } from "../prelude.mjs";
import { makeJsonExpression } from "../json.mjs";

/**
 * @type {[
 *   import("../atom.d.ts").ResVariable,
 *   import("../../lang/syntax.d.ts").Intrinsic,
 * ]}
 */
const FRAME_BINDING = [FRAME_VARIABLE, "undefined"];

/**
 * @type {[
 *   import("../atom.d.ts").ResVariable,
 *   import("../../lang/syntax.d.ts").Intrinsic,
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

const getName = compileGet("name");

/**
 * @type {<X>(
 *   objects: { name: X }[],
 * ) => X[]}
 */
const listName = (objects) => map(objects, getName);

/**
 * @type {(
 *   items: import("../atom.d.ts").ResExpression[],
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression}
 */
const makeArrayExpression = (items, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("Array.of", tag),
    makeIntrinsicExpression("undefined", tag),
    items,
    tag,
  );

/**
 * @type {(
 *   obj: import("../atom.d.ts").ResExpression,
 *   key: string,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression}
 */
const makeGetExpression = (obj, key, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.getValueProperty", obj.tag),
    makeIntrinsicExpression("undefined", obj.tag),
    [obj, makePrimitiveExpression(key, tag)],
    tag,
  );

/////////////
// Program //
/////////////

/**
 * @type {(
 *   target: import("./target.d.ts").ProgramTarget,
 *   parent: {
 *     initial: import("../../util/util.d.ts").Json,
 *   },
 *   context: import("./context.d.ts").Context,
 * ) => import("../atom.d.ts").ResProgram}
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
        advice: flatMap(listValue(context.pointcut), listName),
        initial,
      },
      context,
    ),
    target.origin.tag,
  );

///////////
// Block //
///////////

/**
 * @type {(
 *   entry: import("../atom.d.ts").ArgBinding,
 * ) => import("../atom.d.ts").ResBinding}
 */
const makeOriginalBinding = ([variable, intrinsic]) => [
  mangleOriginalVariable(variable),
  intrinsic,
];

/**
 * @type {(
 *   variable: import("estree-sentry").VariableName,
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResEffect}
 */
const makeAdviceEffect = (variable, tag) =>
  makeWriteEffect(
    mangleAdviceVariable(variable),
    makeApplyExpression(
      makeIntrinsicExpression("aran.readGlobalVariable", tag),
      makeIntrinsicExpression("undefined", tag),
      [makePrimitiveExpression(variable, tag)],
      tag,
    ),
    tag,
  );

/**
 * @type {(
 *   parameters: import("../../lang/syntax.d.ts").Parameter[],
 *   variables: import("../atom.d.ts").ArgVariable[],
 *   tag: import("../atom.d.ts").Tag,
 * ) => import("../atom.d.ts").ResExpression}
 */
const makeFrameExpression = (parameters, variables, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject", tag),
    makeIntrinsicExpression("undefined", tag),
    flatenTree([
      makePrimitiveExpression(null, tag),
      map(parameters, (parameter) => [
        makePrimitiveExpression(parameter, tag),
        makeReadExpression(parameter, tag),
      ]),
      map(variables, (variable) => [
        makePrimitiveExpression(variable, tag),
        makeReadExpression(mangleOriginalVariable(variable), tag),
      ]),
    ]),
    tag,
  );

/**
 * @type {(
 *   target: import("./target.d.ts").BlockTarget,
 *   parent: import("./parent.d.ts").Parent,
 *   context: import("./context.d.ts").Context,
 * ) => import("../../util/tree.d.ts").Tree<import("../atom.d.ts").ResEffect>}
 */
const listDeclarationEffect = (target, parent, context) => {
  const {
    origin: { tag },
  } = target;
  const declaration1 = map(context.pointcut["block@declaration"], (predicate) =>
    trapBlockNotif(
      [makeReadExpression(FRAME_VARIABLE, tag)],
      target,
      context,
      predicate,
    ),
  );
  const declaration2 = reduce(
    context.pointcut["block@declaration-overwrite"],
    (result, predicate) => trapBlockResult(result, target, context, predicate),
    makeReadExpression(FRAME_VARIABLE, tag),
  );
  if (declaration2.type === "ReadExpression") {
    return declaration1;
  } else {
    return [
      declaration1,
      makeWriteEffect(FRAME_VARIABLE, declaration2, tag),
      map(listParameter(parent.kind), (parameter) =>
        makeWriteEffect(
          parameter,
          makeGetExpression(
            makeReadExpression(FRAME_VARIABLE, tag),
            parameter,
            tag,
          ),
          tag,
        ),
      ),
      map(map(target.origin.bindings, get0), (variable) =>
        makeWriteEffect(
          mangleOriginalVariable(variable),
          makeGetExpression(
            makeReadExpression(FRAME_VARIABLE, tag),
            variable,
            tag,
          ),
          tag,
        ),
      ),
    ];
  }
};

/**
 * @type {(
 *   target: import("./target.d.ts").SegmentBlockTarget,
 *   parent: import("./parent.d.ts").SegmentParent,
 *   context: import("./context.d.ts").Context,
 * ) => import("../atom.d.ts").ResSegmentBlock}
 */
const weaveSegmentBlock = (target, parent, old_context) => {
  const {
    origin: { tag },
  } = target;
  const setup = reduce(
    old_context.pointcut["block@setup"],
    (result, predicate) =>
      trapBlockState(result, target, old_context, predicate),
    makeReadExpression(mangleStateVariable(old_context.depth), tag),
  );
  const has_no_setup = setup.type === "ReadExpression";
  const context = has_no_setup
    ? old_context
    : {
        ...old_context,
        depth: incrementDepth(old_context.depth),
      };
  const declaration = listDeclarationEffect(target, parent, context);
  const has_no_declaration = isTreeEmpty(declaration);
  /** @type {import("../../util/tree.d.ts").Tree<import("../atom.d.ts").ResEffect>} */
  const head = [
    has_no_setup
      ? null
      : makeWriteEffect(mangleStateVariable(context.depth), setup, tag),
    has_no_declaration
      ? null
      : makeWriteEffect(
          FRAME_VARIABLE,
          makeFrameExpression(
            listParameter(parent.kind),
            map(target.origin.bindings, get0),
            tag,
          ),
          tag,
        ),
    declaration,
    map(context.pointcut["block@before"], (predicate) =>
      trapBlockNotif([], target, context, predicate),
    ),
  ];
  const body = [
    map(drillArray(target.origin, "body"), (target) =>
      weaveStatement(target, context),
    ),
  ];
  const tail = map(context.pointcut["block@after"], (predicate) =>
    trapBlockNotif([], target, context, predicate),
  );
  const throwing = reduce(
    context.pointcut["block@throwing"],
    (result, predicate) => trapBlockResult(result, target, context, predicate),
    makeReadExpression("catch.error", tag),
  );
  const teardown = map(context.pointcut["block@teardown"], (predicate) =>
    trapBlockNotif([], target, context, predicate),
  );
  // Cannot use Tree because nodes are arrays themselves.
  /**
   * @type {import("../atom.d.ts").ResBinding[]}
   */
  const bindings = flat([
    has_no_setup ? EMPTY : [makeStateBinding(context.depth)],
    has_no_declaration ? EMPTY : [FRAME_BINDING],
    map(target.origin.bindings, makeOriginalBinding),
  ]);
  if (
    throwing.type === "ReadExpression" &&
    throwing.variable === "catch.error" &&
    isTreeEmpty(teardown)
  ) {
    return makeSegmentBlock(
      target.origin.labels,
      bindings,
      flatenTree([
        mapTree(head, (node) => makeEffectStatement(node, tag)),
        body,
        mapTree(tail, (node) => makeEffectStatement(node, tag)),
      ]),
      tag,
    );
  } else {
    return makeSegmentBlock(
      target.origin.labels,
      bindings,
      [
        makeTryStatement(
          makeSegmentBlock(
            [],
            [],
            flatenTree([
              mapTree(head, (node) => makeEffectStatement(node, tag)),
              body,
              mapTree(tail, (node) => makeEffectStatement(node, tag)),
            ]),
            tag,
          ),
          makeSegmentBlock(
            [],
            [],
            [
              makeEffectStatement(
                makeExpressionEffect(
                  makeApplyExpression(
                    makeIntrinsicExpression("aran.throwException", tag),
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
            [],
            [],
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
 *   variable: import("estree-sentry").VariableName,
 * ) => import("../atom.d.ts").ResBinding}
 */
const makeAdviceBinding = (variable) => [
  mangleAdviceVariable(variable),
  "undefined",
];

/**
 * @type {(
 *   depth: import("../depth.d.ts").Depth,
 * ) => import("../atom.d.ts").ResBinding}
 */
const makeStateBinding = (depth) => [mangleStateVariable(depth), "undefined"];

/**
 * @type {(
 *   target: import("./target.d.ts").RoutineBlockTarget,
 *   parent: import("./parent.d.ts").RoutineParent,
 *   context: import("./context.d.ts").Context,
 * ) => import("../atom.d.ts").ResRoutineBlock}
 */
const weaveRoutineBlock = (target, parent, old_context) => {
  const {
    origin: { tag },
  } = target;
  const is_program = isProgramKind(parent.kind);
  const setup = reduce(
    old_context.pointcut["block@setup"],
    (result, predicate) =>
      trapBlockState(result, target, old_context, predicate),
    makeReadExpression(mangleStateVariable(old_context.depth), tag),
  );
  const has_no_setup = setup.type === "ReadExpression";
  const context = has_no_setup
    ? old_context
    : {
        ...old_context,
        depth: incrementDepth(old_context.depth),
      };
  const declaration = listDeclarationEffect(target, parent, context);
  const has_no_declaration = isTreeEmpty(declaration);
  const head = [
    is_program
      ? mapTree(map(listValue(old_context.pointcut), listName), (variable) =>
          makeAdviceEffect(variable, tag),
        )
      : null,
    is_program
      ? makeWriteEffect(
          mangleStateVariable(old_context.depth),
          makeJsonExpression(
            /** @type {import("./parent.d.ts").ProgramParent} */ (parent)
              .initial,
            tag,
          ),
          tag,
        )
      : null,
    has_no_setup
      ? null
      : makeWriteEffect(mangleStateVariable(context.depth), setup, tag),
    has_no_declaration
      ? null
      : makeWriteEffect(
          FRAME_VARIABLE,
          makeFrameExpression(
            listParameter(parent.kind),
            map(target.origin.bindings, get0),
            tag,
          ),
          tag,
        ),
    declaration,
    map(context.pointcut["block@before"], (predicate) =>
      trapBlockNotif([], target, context, predicate),
    ),
    isHeadfulRoutineBlock(target.origin)
      ? map(drillArray(target.origin, "head"), (target) =>
          weaveEffect(target, context),
        )
      : null,
  ];
  const body = map(drillArray(target.origin, "body"), (target) =>
    weaveStatement(target, context),
  );
  const tail_main = weaveExpression(drill(target.origin, "tail"), context);
  const tail_side = map(context.pointcut["block@after"], (predicate) =>
    trapBlockNotif([], target, context, predicate),
  );
  const has_no_tail_side = isTreeEmpty(tail_side);
  const throwing = reduce(
    context.pointcut["block@throwing"],
    (result, predicate) => trapBlockResult(result, target, context, predicate),
    makeReadExpression("catch.error", tag),
  );
  const has_no_throwing = throwing.type === "ReadExpression";
  const teardown = map(context.pointcut["block@teardown"], (predicate) =>
    trapBlockNotif([], target, context, predicate),
  );
  const has_no_teardown = isTreeEmpty(teardown);
  // Cannot use Tree because nodes are arrays themselves.
  /**
   * @type {import("../atom.d.ts").ResBinding[]}
   */
  const bindings = flat([
    is_program
      ? map(
          flatMap(listValue(old_context.pointcut), listName),
          makeAdviceBinding,
        )
      : EMPTY,
    is_program ? [makeStateBinding(old_context.depth)] : EMPTY,
    has_no_setup ? EMPTY : [makeStateBinding(context.depth)],
    has_no_declaration ? EMPTY : [FRAME_BINDING],
    has_no_tail_side && has_no_throwing && has_no_teardown
      ? EMPTY
      : [COMPLETION_BINDING],
    map(target.origin.bindings, makeOriginalBinding),
  ]);
  if (has_no_throwing && has_no_teardown) {
    return makeRoutineBlock(
      bindings,
      target.origin.head === null ? null : flatenTree(head),
      flatenTree(
        target.origin.head === null
          ? [mapTree(head, (node) => makeEffectStatement(node, tag)), body]
          : body,
      ),
      has_no_tail_side
        ? tail_main
        : makeSequenceExpression(
            flatenTree([
              makeWriteEffect(COMPLETION_VARIABLE, tail_main, tag),
              tail_side,
            ]),
            makeReadExpression(COMPLETION_VARIABLE, tag),
            tag,
          ),
      tag,
    );
  } else {
    return makeRoutineBlock(
      bindings,
      target.origin.head === null
        ? null
        : flatenTree(weaveRoutineHead(head, throwing, teardown, tag)),
      [
        makeTryStatement(
          makeSegmentBlock(
            [],
            [],
            flatenTree([
              target.origin.head === null
                ? mapTree(head, (node) => makeEffectStatement(node, tag))
                : null,
              body,
              makeEffectStatement(
                makeWriteEffect(COMPLETION_VARIABLE, tail_main, tag),
                tag,
              ),
              mapTree(tail_side, (node) => makeEffectStatement(node, tag)),
            ]),
            tag,
          ),
          makeSegmentBlock(
            [],
            [],
            [
              makeEffectStatement(
                makeExpressionEffect(
                  makeApplyExpression(
                    makeIntrinsicExpression("aran.throwException", tag),
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
            [],
            [],
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
 *   target: import("./target.d.ts").StatementTarget,
 *   context: import("./context.d.ts").Context,
 * ) => import("../../util/tree.d.ts").Tree<import("../atom.d.ts").ResStatement>}
 */
const weaveStatement = (target, context) => {
  const {
    origin: { tag },
  } = target;
  return [
    mapTree(
      map(context.pointcut["statement@before"], (predicate) =>
        trapStatementNotif(target, context, predicate),
      ),
      (node) => makeEffectStatement(node, tag),
    ),
    weaveStatementInner(target, context),
    mapTree(
      map(context.pointcut["statement@after"], (predicate) =>
        trapStatementNotif(target, context, predicate),
      ),
      (node) => makeEffectStatement(node, tag),
    ),
  ];
};

/**
 * @type {(
 *   target: import("./target.d.ts").StatementTarget,
 *   context: import("./context.d.ts").Context,
 * ) => import("../../util/tree.d.ts").Tree<import("../atom.d.ts").ResStatement>}
 */
const weaveStatementInner = ({ origin }, context) => {
  const { tag } = origin;
  switch (origin.type) {
    case "EffectStatement": {
      return mapTree(weaveEffect(drill(origin, "inner"), context), (node) =>
        makeEffectStatement(node, tag),
      );
    }
    case "DebuggerStatement": {
      return makeDebuggerStatement(tag);
    }
    case "BreakStatement": {
      return makeBreakStatement(origin.label, tag);
    }
    case "BlockStatement": {
      return makeBlockStatement(
        weaveSegmentBlock(drill(origin, "body"), SEGMENT_PARENT.bare, context),
        tag,
      );
    }
    case "IfStatement": {
      return makeIfStatement(
        weaveExpression(drill(origin, "test"), context),
        weaveSegmentBlock(drill(origin, "then"), SEGMENT_PARENT.then, context),
        weaveSegmentBlock(drill(origin, "else"), SEGMENT_PARENT.else, context),
        tag,
      );
    }
    case "WhileStatement": {
      return makeWhileStatement(
        weaveExpression(drill(origin, "test"), context),
        weaveSegmentBlock(drill(origin, "body"), SEGMENT_PARENT.while, context),
        tag,
      );
    }
    case "TryStatement": {
      return makeTryStatement(
        weaveSegmentBlock(drill(origin, "try"), SEGMENT_PARENT.try, context),
        weaveSegmentBlock(
          drill(origin, "catch"),
          SEGMENT_PARENT.catch,
          context,
        ),
        weaveSegmentBlock(
          drill(origin, "finally"),
          SEGMENT_PARENT.finally,
          context,
        ),
        tag,
      );
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
 *   target: import("./target.d.ts").EffectTarget,
 *   context: import("./context.d.ts").Context,
 * ) => import("../../util/tree.d.ts").Tree<import("../atom.d.ts").ResEffect>}
 */
const weaveEffect = (target, context) => [
  map(context.pointcut["effect@before"], (predicate) =>
    trapEffectNotif(target, context, predicate),
  ),
  weaveEffectInner(target, context),
  map(context.pointcut["effect@after"], (predicate) =>
    trapEffectNotif(target, context, predicate),
  ),
];

/**
 * @type {(
 *   target: import("./target.d.ts").EffectTarget,
 *   context: import("./context.d.ts").Context,
 * ) => import("../atom.d.ts").ResEffect}
 */
const weaveEffectInner = ({ origin }, context) => {
  const { tag } = origin;
  switch (origin.type) {
    case "ExpressionEffect": {
      return makeExpressionEffect(
        weaveExpression(drill(origin, "discard"), context),
        tag,
      );
    }
    case "ConditionalEffect": {
      return makeConditionalEffect(
        weaveExpression(drill(origin, "test"), context),
        flatenTree(
          map(drillArray(origin, "positive"), (target) =>
            weaveEffect(target, context),
          ),
        ),
        flatenTree(
          map(drillArray(origin, "negative"), (target) =>
            weaveEffect(target, context),
          ),
        ),
        tag,
      );
    }
    case "ExportEffect": {
      return makeExportEffect(
        origin.export,
        weaveExpression(drill(origin, "value"), context),
        tag,
      );
    }
    case "WriteEffect": {
      return makeWriteEffect(
        isParameter(origin.variable)
          ? origin.variable
          : mangleOriginalVariable(origin.variable),
        weaveExpression(drill(origin, "value"), context),
        tag,
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
 *   target: import("./target.d.ts").ExpressionTarget,
 *   context: import("./context.d.ts").Context,
 * ) => import("../atom.d.ts").ResExpression}
 */
const weaveExpression = (target, context) =>
  makeSequenceExpression(
    flatenTree(
      map(context.pointcut["expression@before"], (predicate) =>
        trapExpressionNotif(target, context, predicate),
      ),
    ),
    reduce(
      context.pointcut["expression@after"],
      (result, predicate) =>
        trapExpressionResult(result, target, context, predicate),
      weaveExpressionInner(target, context),
    ),
    target.origin.tag,
  );

/**
 * @type {(
 *   target: import("./target.d.ts").ExpressionTarget,
 *   context: import("./context.d.ts").Context,
 * ) => import("../atom.d.ts").ResExpression}
 */
const weaveExpressionInner = ({ origin, parent }, context) => {
  const { tag } = origin;
  switch (origin.type) {
    case "PrimitiveExpression": {
      return makePrimitiveExpression(origin.primitive, tag);
    }
    case "IntrinsicExpression": {
      return makeIntrinsicExpression(origin.intrinsic, tag);
    }
    case "ReadExpression": {
      return makeReadExpression(
        isParameter(origin.variable)
          ? origin.variable
          : mangleOriginalVariable(origin.variable),
        tag,
      );
    }
    case "ClosureExpression": {
      /** @type {import("../parametrization.d.ts").ClosureKind} */
      const kind = origin.asynchronous ? `async-${origin.kind}` : origin.kind;
      return makeClosureExpression(
        origin.kind,
        origin.asynchronous,
        weaveRoutineBlock(drill(origin, "body"), CLOSURE_PARENT[kind], context),
        tag,
      );
    }
    case "ImportExpression": {
      return makeImportExpression(origin.source, origin.import, tag);
    }
    case "AwaitExpression": {
      return makeAwaitExpression(
        weaveExpression(drill(origin, "promise"), context),
        tag,
      );
    }
    case "YieldExpression": {
      return makeYieldExpression(
        origin.delegate,
        weaveExpression(drill(origin, "item"), context),
        tag,
      );
    }
    case "SequenceExpression": {
      return makeSequenceExpression(
        flatenTree(
          map(drillArray(origin, "head"), (target) =>
            weaveEffect(target, context),
          ),
        ),
        weaveExpression({ origin: origin.tail, parent: origin }, context),
        tag,
      );
    }
    case "ConditionalExpression": {
      return makeConditionalExpression(
        weaveExpression(drill(origin, "test"), context),
        weaveExpression(drill(origin, "consequent"), context),
        weaveExpression(drill(origin, "alternate"), context),
        tag,
      );
    }
    case "EvalExpression": {
      return makeEvalExpression(
        weaveExpression(drill(origin, "code"), context),
        tag,
      );
    }
    case "ApplyExpression": {
      /* eslint-disable local/no-impure */
      /**
       * @type {null | {
       *   report: import("estree-sentry").VariableName,
       *   result: import("../atom.d.ts").ResExpression,
       * }}
       */
      let match = null;
      const callee = weaveExpression(drill(origin, "callee"), context);
      const that = weaveExpression(drill(origin, "this"), context);
      const input = map(drillArray(origin, "arguments"), (target) =>
        weaveExpression(target, context),
      );
      const predicates = context.pointcut["apply@around"];
      const { length } = predicates;
      for (let index = 0; index < length; index++) {
        const predicate = predicates[index];
        const result = trapExpressionAround(
          [callee, that, makeArrayExpression(input, tag)],
          { origin, parent },
          context,
          predicate,
        );
        if (result !== null) {
          if (match !== null) {
            throw new AranPointcutError({
              type: "DuplicateCut",
              point: "apply@around",
              conflict: [],
              tag: origin.tag,
            });
          }
          match = { report: predicate.name, result };
        }
      }
      return match === null
        ? makeApplyExpression(callee, that, input, tag)
        : match.result;
      /* eslint-enable local/no-impure */
    }
    case "ConstructExpression": {
      /* eslint-disable local/no-impure */
      /**
       * @type {null | {
       *   report: import("estree-sentry").VariableName,
       *   result: import("../atom.d.ts").ResExpression,
       * }}
       */
      let match = null;
      const callee = weaveExpression(drill(origin, "callee"), context);
      const input = map(drillArray(origin, "arguments"), (target) =>
        weaveExpression(target, context),
      );
      const predicates = context.pointcut["construct@around"];
      const { length } = predicates;
      for (let index = 0; index < length; index++) {
        const predicate = predicates[index];
        const result = trapExpressionAround(
          [callee, makeArrayExpression(input, tag)],
          { origin, parent },
          context,
          predicate,
        );
        if (result !== null) {
          if (match !== null) {
            throw new AranPointcutError({
              type: "DuplicateCut",
              point: "construct@around",
              conflict: [],
              tag: origin.tag,
            });
          }
          match = { report: predicate.name, result };
        }
      }
      return match === null
        ? makeConstructExpression(callee, input, tag)
        : match.result;
      /* eslint-enable local/no-impure */
    }
    default: {
      throw new AranTypeError(origin);
    }
  }
};
