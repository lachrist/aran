/* eslint-disable no-use-before-define */

import {
  map,
  hasOwn,
  concat_X,
  concat_,
  concatX_,
  concatX_X,
  flat,
  concatXX,
  concatXXX,
  concatXXXX,
  pairup,
} from "../../util/index.mjs";
import { AranError, AranTypeError } from "../../error.mjs";
import { isParameter, unpackPrimitive } from "../../lang.mjs";
import {
  makeBreakStatement,
  makeDebuggerStatement,
  makeImportExpression,
  makeIntrinsicExpression,
  makeAwaitExpression,
  makeBlockStatement,
  makeConditionalExpression,
  makeEffectStatement,
  makeEvalExpression,
  makeProgram,
  makeExportEffect,
  makeExpressionEffect,
  makeIfStatement,
  makePrimitiveExpression,
  makeReturnStatement,
  makeSequenceExpression,
  makeTryStatement,
  makeWhileStatement,
  makeYieldExpression,
  makeReadExpression,
  makeControlBlock,
  makeClosureBlock,
  makeConditionalEffect,
  makeWriteEffect,
  makeClosureExpression,
  makeApplyExpression,
} from "./node.mjs";
import {
  listTrapEffect,
  makeTrapExpression,
  makeMaybeTrapExpression,
  listRecordTrapEffect,
} from "./trap.mjs";
import { drill, drillArray, drillAll } from "./drill.mjs";
import {
  ADVICE_VARIABLE,
  COMPLETION_VARIABLE,
  mangleOriginalVariable,
} from "./variable.mjs";
import {
  EMPTY_SEQUENCE,
  callSequenceX__,
  flatSequence,
  initSequence,
  liftSequenceX,
  liftSequenceXX,
  liftSequenceXXX,
  liftSequenceXXXXX,
  liftSequenceXXX_,
  liftSequenceXX_,
  liftSequenceX_,
  liftSequenceX_X,
  liftSequenceX__,
  liftSequence_X,
  liftSequence_X_,
  zeroSequence,
} from "../../sequence.mjs";
import {
  makeApplyPoint,
  makeAwaitAfterPoint,
  makeAwaitBeforePoint,
  makeBlockCompletionPoint,
  makeBlockEnterPoint,
  makeBlockFailurePoint,
  makeBlockLeavePoint,
  makeBranchAfterPoint,
  makeBranchBeforePoint,
  makeBreakBeforePoint,
  makeConstructPoint,
  makeDropBeforePoint,
  makeEvalAfterPoint,
  makeEvalBeforePoint,
  makeExportBeforePoint,
  makeReturnBeforePoint,
  makeWriteBeforePoint,
  makeYieldAfterPoint,
  makeYieldBeforePoint,
} from "./point.mjs";
import { makeClosureFrame, makeControlFrame } from "./frame.mjs";
import { setupBinding } from "./binding.mjs";

const { undefined } = globalThis;

/////////////
// Program //
/////////////

/**
 * @type {<L extends import("../../json").Json>(
 *   site:  {
 *     node: import("../atom").ArgProgram,
 *     trail: import("./trail").Trail,
 *   },
 *   options: import("./visit").Options<L>,
 * ) => import("../atom").ResProgram}
 */
export const weaveProgram = ({ node, trail }, options) =>
  makeProgram(
    node.kind,
    node.situ,
    node.head,
    weaveClosureBlock(drill({ node, trail }, "body"), options, node),
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
 * ) => [
 *   import("../atom").ResVariable,
 *   import("../../lang").Intrinsic,
 * ]}
 */
const mangleFrameEntry = ([variable, intrinsic]) => [
  mangleOriginalVariable(variable),
  intrinsic,
];

/**
 * @type {<E, B, C, F, L>(
 *   enter: E,
 *   body: B,
 *   completion: C,
 *   failure: F,
 *   leave: L,
 * ) => {
 *   enter: E,
 *   body: B,
 *   completion: C,
 *   failure: F,
 *   leave: L,
 * }}
 */
const makeBlockSchema = (enter, body, completion, failure, leave) => ({
  enter,
  body,
  completion,
  failure,
  leave,
});

/**
 * @type {<L extends import("../../json").Json>(
 *   site:  {
 *     node: import("../atom").ArgRoutineBlock,
 *     trail: import("./trail").Trail,
 *   },
 *   options: import("./visit").Options<L>,
 *   parent: (
 *     | import("../atom").ArgProgram
 *     | (import("../atom").ArgExpression & { type: "ClosureExpression" })
 *   ),
 * ) => import("../atom").ResRoutineBlock}
 */
const weaveClosureBlock = ({ node, trail }, options, parent) => {
  const { locate } = options;
  const location = locate(node.tag);
  const frame = makeClosureFrame(parent, node.frame);
  const { head: bindings, tail: schema } = liftSequenceXXXXX(
    makeBlockSchema,
    liftSequenceXX(
      concatXX,
      parent.type === "Program" && parent.situ !== "local.deep"
        ? initSequence(
            [pairup(ADVICE_VARIABLE, undefined)],
            [
              makeEffectStatement(
                makeWriteEffect(
                  ADVICE_VARIABLE,
                  makeApplyExpression(
                    makeIntrinsicExpression("aran.get"),
                    makeIntrinsicExpression("undefined"),
                    [
                      makeIntrinsicExpression("aran.global"),
                      makePrimitiveExpression(options.advice.variable),
                    ],
                  ),
                ),
              ),
            ],
          )
        : EMPTY_SEQUENCE,
      liftSequenceX_(
        map,
        listRecordTrapEffect(
          makeBlockEnterPoint(frame, location),
          trail,
          options,
        ),
        makeEffectStatement,
      ),
    ),
    liftSequenceX(
      flat,
      flatSequence(
        map(drillAll(drillArray({ node, trail }, "body")), (pair) =>
          weaveStatement(pair, options),
        ),
      ),
    ),
    callSequenceX__(
      makeTrapExpression,
      liftSequence_X_(
        makeBlockCompletionPoint,
        frame,
        weaveExpression(drill({ node, trail }, "completion"), options),
        location,
      ),
      trail,
      options,
    ),
    makeMaybeTrapExpression(
      makeBlockFailurePoint(frame, makeReadExpression("catch.error"), location),
      trail,
      options,
    ),
    makeMaybeTrapExpression(
      makeBlockLeavePoint(frame, location),
      trail,
      options,
    ),
  );
  if (schema.failure === null && schema.leave === null) {
    const setup = setupBinding(bindings);
    return makeClosureBlock(
      concatXX(setup.decl, map(node.frame, mangleFrameEntry)),
      concatXXX(
        map(setup.init, makeEffectStatement),
        schema.enter,
        schema.body,
      ),
      schema.completion,
    );
  } else {
    const setup = setupBinding(
      concat_X(pairup(COMPLETION_VARIABLE, undefined), bindings),
    );
    return makeClosureBlock(
      setup.decl,
      concatX_(
        map(setup.init, makeEffectStatement),
        makeTryStatement(
          makeControlBlock(
            [],
            map(node.frame, mangleFrameEntry),
            concatXX(schema.enter, schema.body),
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
                    [
                      schema.failure === null
                        ? makeReadExpression("catch.error")
                        : schema.failure,
                    ],
                  ),
                ),
              ),
            ],
          ),
          makeControlBlock(
            [],
            [],
            schema.leave === null
              ? []
              : [makeEffectStatement(makeExpressionEffect(schema.leave))],
          ),
        ),
      ),
      makeReadExpression(COMPLETION_VARIABLE),
    );
  }
};

/**
 * @type {<L extends import("../../json").Json>(
 *   site:  {
 *     node: import("../atom").ArgControlBlock,
 *     trail: import("./trail").Trail,
 *   },
 *   options: import("./visit").Options<L>,
 *   kind: import("./point").ControlKind,
 * ) => import("../atom").ResControlBlock}
 */
const weaveControlBlock = ({ node, trail }, options, kind) => {
  const { locate } = options;
  const location = locate(node.tag);
  const frame = makeControlFrame(kind, node.labels, node.frame);
  const { head: bindings, tail: schema } = liftSequenceXXXXX(
    makeBlockSchema,
    liftSequenceX_(
      map,
      listRecordTrapEffect(
        makeBlockEnterPoint(frame, location),
        trail,
        options,
      ),
      makeEffectStatement,
    ),
    liftSequenceX(
      flat,
      flatSequence(
        map(drillAll(drillArray({ node, trail }, "body")), (pair) =>
          weaveStatement(pair, options),
        ),
      ),
    ),
    liftSequenceX_(
      map,
      listTrapEffect(
        makeBlockCompletionPoint(
          frame,
          makeIntrinsicExpression("undefined"),
          location,
        ),
        trail,
        options,
      ),
      makeEffectStatement,
    ),
    makeMaybeTrapExpression(
      makeBlockFailurePoint(frame, makeReadExpression("catch.error"), location),
      trail,
      options,
    ),
    makeMaybeTrapExpression(
      makeBlockLeavePoint(frame, location),
      trail,
      options,
    ),
  );
  const setup = setupBinding(bindings);
  if (schema.failure === null && schema.leave === null) {
    return makeControlBlock(
      node.labels,
      concatXX(setup.decl, map(node.frame, mangleFrameEntry)),
      concatXXXX(
        map(setup.init, makeEffectStatement),
        schema.enter,
        schema.body,
        schema.completion,
      ),
    );
  } else {
    return makeControlBlock(
      [],
      setup.decl,
      concatX_(
        map(setup.init, makeEffectStatement),
        makeTryStatement(
          makeControlBlock(
            node.labels,
            map(node.frame, mangleFrameEntry),
            concatXXX(schema.enter, schema.body, schema.completion),
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
                    [
                      schema.failure === null
                        ? makeReadExpression("catch.error")
                        : schema.failure,
                    ],
                  ),
                ),
              ),
            ],
          ),
          makeControlBlock(
            [],
            [],
            schema.leave === null
              ? []
              : [makeEffectStatement(makeExpressionEffect(schema.leave))],
          ),
        ),
      ),
    );
  }
};

///////////////
// Statement //
///////////////

/**
 * @type {<L extends import("../../json").Json>(
 *   site:  {
 *     node: import("../atom").ArgStatement,
 *     trail: import("./trail").Trail,
 *   },
 *   options: import("./visit").Options<L>
 * ) => import("../../sequence").Sequence<
 *   import("./binding").Binding,
 *   import("../atom").ResStatement[],
 * >}
 */
const weaveStatement = ({ node, trail }, options) => {
  const { locate } = options;
  const location = locate(node.tag);
  switch (node.type) {
    case "EffectStatement": {
      return liftSequenceX_(
        map,
        weaveEffect(drill({ node, trail }, "inner"), options),
        makeEffectStatement,
      );
    }
    case "ReturnStatement": {
      return liftSequenceX(
        concat_,
        liftSequenceX(
          makeReturnStatement,
          callSequenceX__(
            makeTrapExpression,
            liftSequenceX_(
              makeReturnBeforePoint,
              weaveExpression(drill({ node, trail }, "result"), options),
              location,
            ),
            trail,
            options,
          ),
        ),
      );
    }
    case "BreakStatement": {
      return liftSequenceX_(
        concatX_,
        liftSequenceX_(
          map,
          listTrapEffect(
            makeBreakBeforePoint(node.label, location),
            trail,
            options,
          ),
          makeEffectStatement,
        ),
        makeBreakStatement(node.label),
      );
    }
    case "DebuggerStatement": {
      return liftSequenceX_X(
        concatX_X,
        liftSequenceX_(
          map,
          listTrapEffect(
            {
              type: "debugger@before",
              location,
            },
            trail,
            options,
          ),
          makeEffectStatement,
        ),
        makeDebuggerStatement(),
        liftSequenceX_(
          map,
          listTrapEffect(
            {
              type: "debugger@after",
              location,
            },
            trail,
            options,
          ),
          makeEffectStatement,
        ),
      );
    }
    case "BlockStatement": {
      return zeroSequence([
        makeBlockStatement(
          weaveControlBlock(drill({ node, trail }, "body"), options, "naked"),
        ),
      ]);
    }
    case "IfStatement": {
      return liftSequenceXX(
        concat_X,
        liftSequenceX__(
          makeIfStatement,
          callSequenceX__(
            makeTrapExpression,
            liftSequence_X_(
              makeBranchBeforePoint,
              /** @type {"if"} */ ("if"),
              weaveExpression(drill({ node, trail }, "test"), options),
              location,
            ),
            trail,
            options,
          ),
          weaveControlBlock(drill({ node, trail }, "then"), options, "then"),
          weaveControlBlock(drill({ node, trail }, "else"), options, "else"),
        ),
        liftSequenceX_(
          map,
          listTrapEffect(
            {
              type: "branch@after",
              kind: "if",
              // TODO: check if this makes sense
              value: makeIntrinsicExpression("undefined"),
              location,
            },
            trail,
            options,
          ),
          makeEffectStatement,
        ),
      );
    }
    case "WhileStatement": {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeWhileStatement,
          callSequenceX__(
            makeTrapExpression,
            liftSequence_X_(
              makeBranchBeforePoint,
              /** @type {"while"} */ ("while"),
              weaveExpression(drill({ node, trail }, "test"), options),
              location,
            ),
            trail,
            options,
          ),
          weaveControlBlock(drill({ node, trail }, "body"), options, "loop"),
        ),
      );
    }
    case "TryStatement": {
      return zeroSequence([
        makeTryStatement(
          weaveControlBlock(drill({ node, trail }, "try"), options, "try"),
          weaveControlBlock(drill({ node, trail }, "catch"), options, "catch"),
          weaveControlBlock(
            drill({ node, trail }, "finally"),
            options,
            "finally",
          ),
        ),
      ]);
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {<L extends import("../../json").Json>(
 *   site:  {
 *     node: import("../atom").ArgEffect,
 *     trail: import("./trail").Trail,
 *   },
 *   options: import("./visit").Options<L>
 * ) => import("../../sequence").Sequence<
 *   import("./binding").Binding,
 *   import("../atom").ResEffect[],
 * >}
 */
const weaveEffect = ({ node, trail }, options) => {
  const { locate } = options;
  const location = locate(node.tag);
  switch (node.type) {
    case "ExpressionEffect": {
      return liftSequenceX(
        concat_,
        liftSequenceX(
          makeExpressionEffect,
          callSequenceX__(
            makeTrapExpression,
            liftSequenceX_(
              makeDropBeforePoint,
              weaveExpression(drill({ node, trail }, "discard"), options),
              location,
            ),
            trail,
            options,
          ),
        ),
      );
    }
    case "ConditionalEffect": {
      return liftSequenceXX(
        concat_X,
        liftSequenceXXX(
          makeConditionalEffect,
          callSequenceX__(
            makeTrapExpression,
            liftSequence_X_(
              makeBranchBeforePoint,
              /** @type {"conditional.effect"} */ ("conditional.effect"),
              weaveExpression(drill({ node, trail }, "test"), options),
              location,
            ),
            trail,
            options,
          ),
          liftSequenceX(
            flat,
            flatSequence(
              map(drillAll(drillArray({ node, trail }, "positive")), (pair) =>
                weaveEffect(pair, options),
              ),
            ),
          ),
          liftSequenceX(
            flat,
            flatSequence(
              map(drillAll(drillArray({ node, trail }, "negative")), (pair) =>
                weaveEffect(pair, options),
              ),
            ),
          ),
        ),
        listTrapEffect(
          {
            type: "branch@after",
            kind: "conditional.effect",
            // TODO: check if this makes sense
            value: makeIntrinsicExpression("undefined"),
            location,
          },
          trail,
          options,
        ),
      );
    }
    case "WriteEffect": {
      return liftSequenceX(
        concat_,
        liftSequence_X(
          makeWriteEffect,
          isParameter(node.variable)
            ? node.variable
            : mangleOriginalVariable(node.variable),
          callSequenceX__(
            makeTrapExpression,
            liftSequence_X_(
              makeWriteBeforePoint,
              node.variable,
              weaveExpression(drill({ node, trail }, "value"), options),
              location,
            ),
            trail,
            options,
          ),
        ),
      );
    }
    case "ExportEffect": {
      return liftSequenceX(
        concat_,
        liftSequence_X(
          makeExportEffect,
          node.export,
          callSequenceX__(
            makeTrapExpression,
            liftSequence_X_(
              makeExportBeforePoint,
              node.export,
              weaveExpression(drill({ node, trail }, "value"), options),
              location,
            ),
            trail,
            options,
          ),
        ),
      );
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {<L extends import("../../json").Json>(
 *   site:  {
 *     node: import("../atom").ArgExpression,
 *     trail: import("./trail").Trail,
 *   },
 *   options: import("./visit").Options<L>,
 * ) => import("../../sequence").Sequence<
 *   import("./binding").Binding,
 *   import("../atom").ResExpression,
 * >}
 */
export const weaveExpression = ({ node, trail }, options) => {
  const { locate } = options;
  const location = locate(node.tag);
  switch (node.type) {
    case "PrimitiveExpression": {
      return makeTrapExpression(
        {
          type: "primitive@after",
          value: unpackPrimitive(node.primitive),
          location,
        },
        trail,
        options,
      );
    }
    case "IntrinsicExpression": {
      return makeTrapExpression(
        {
          type: "intrinsic@after",
          name: node.intrinsic,
          value: makeIntrinsicExpression(node.intrinsic),
          location,
        },
        trail,
        options,
      );
    }
    case "ImportExpression": {
      return makeTrapExpression(
        {
          type: "import@after",
          source: node.source,
          specifier: node.import,
          value: makeImportExpression(node.source, node.import),
          location,
        },
        trail,
        options,
      );
    }
    case "ReadExpression": {
      return makeTrapExpression(
        {
          type: "read@after",
          variable: node.variable,
          value: makeReadExpression(
            isParameter(node.variable)
              ? node.variable
              : mangleOriginalVariable(node.variable),
          ),
          location,
        },
        trail,
        options,
      );
    }
    case "ClosureExpression": {
      return makeTrapExpression(
        {
          type: "closure@after",
          kind: node.kind,
          asynchronous: node.asynchronous,
          generator: node.generator,
          value: makeClosureExpression(
            node.kind,
            node.asynchronous,
            node.generator,
            weaveClosureBlock(drill({ node, trail }, "body"), options, node),
          ),
          location,
        },
        trail,
        options,
      );
    }
    case "SequenceExpression": {
      return liftSequenceXX(
        makeSequenceExpression,
        liftSequenceX(
          flat,
          flatSequence(
            map(drillAll(drillArray({ node, trail }, "head")), (pair) =>
              weaveEffect(pair, options),
            ),
          ),
        ),
        weaveExpression(drill({ node, trail }, "tail"), options),
      );
    }
    case "ConditionalExpression": {
      return callSequenceX__(
        makeTrapExpression,
        liftSequence_X_(
          makeBranchAfterPoint,
          /** @type {"conditional.expression"} */ ("conditional.expression"),
          liftSequenceXXX(
            makeConditionalExpression,
            callSequenceX__(
              makeTrapExpression,
              liftSequence_X_(
                makeBranchBeforePoint,
                /** @type {"conditional.expression"} */ (
                  "conditional.expression"
                ),
                weaveExpression(drill({ node, trail }, "test"), options),
                location,
              ),
              trail,
              options,
            ),
            weaveExpression(drill({ node, trail }, "consequent"), options),
            weaveExpression(drill({ node, trail }, "alternate"), options),
          ),
          location,
        ),
        trail,
        options,
      );
    }
    case "AwaitExpression": {
      return callSequenceX__(
        makeTrapExpression,
        liftSequenceX_(
          makeAwaitAfterPoint,
          liftSequenceX(
            makeAwaitExpression,
            callSequenceX__(
              makeTrapExpression,
              liftSequenceX_(
                makeAwaitBeforePoint,
                weaveExpression(drill({ node, trail }, "promise"), options),
                location,
              ),
              trail,
              options,
            ),
          ),
          location,
        ),
        trail,
        options,
      );
    }
    case "YieldExpression": {
      return callSequenceX__(
        makeTrapExpression,
        liftSequence_X_(
          makeYieldAfterPoint,
          node.delegate,
          liftSequence_X(
            makeYieldExpression,
            node.delegate,
            callSequenceX__(
              makeTrapExpression,
              liftSequence_X_(
                makeYieldBeforePoint,
                node.delegate,
                weaveExpression(drill({ node, trail }, "item"), options),
                location,
              ),
              trail,
              options,
            ),
          ),
          location,
        ),
        trail,
        options,
      );
    }
    case "EvalExpression": {
      if (hasOwn(options.evals, node.tag)) {
        return callSequenceX__(
          makeTrapExpression,
          liftSequenceX_(
            makeEvalAfterPoint,
            liftSequenceX(
              makeEvalExpression,
              callSequenceX__(
                makeTrapExpression,
                liftSequenceX__(
                  makeEvalBeforePoint,
                  weaveExpression(drill({ node, trail }, "code"), options),
                  options.evals[node.tag],
                  location,
                ),
                trail,
                options,
              ),
            ),
            location,
          ),
          trail,
          options,
        );
      } else {
        throw new AranError("missing context on eval call expression", node);
      }
    }
    case "ApplyExpression": {
      return callSequenceX__(
        makeTrapExpression,
        liftSequenceXXX_(
          makeApplyPoint,
          weaveExpression(drill({ node, trail }, "callee"), options),
          weaveExpression(drill({ node, trail }, "this"), options),
          flatSequence(
            map(drillAll(drillArray({ node, trail }, "arguments")), (pair) =>
              weaveExpression(pair, options),
            ),
          ),
          location,
        ),
        trail,
        options,
      );
    }
    case "ConstructExpression": {
      return callSequenceX__(
        makeTrapExpression,
        liftSequenceXX_(
          makeConstructPoint,
          weaveExpression(drill({ node, trail }, "callee"), options),
          flatSequence(
            map(drillAll(drillArray({ node, trail }, "arguments")), (pair) =>
              weaveExpression(pair, options),
            ),
          ),
          location,
        ),
        trail,
        options,
      );
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
