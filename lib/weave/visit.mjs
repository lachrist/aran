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
} from "../util/index.mjs";
import { AranError, AranTypeError } from "../error.mjs";
import { isParameter, unpackPrimitive } from "../lang.mjs";
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
  makeRoutineBlock,
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
} from "../sequence.mjs";
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
 * @type {<B, L extends Json>(
 *   site:  {
 *     node: import("./atom").ArgProgram,
 *     path: import("./atom").TargetPath,
 *   },
 *   options: import("./visit").Options<B, L>,
 * ) => import("./atom").ResProgram}
 */
export const weaveProgram = ({ node, path }, options) =>
  makeProgram(
    node.kind,
    node.situ,
    node.head,
    weaveRoutineBlock(drill({ node, path }, "body"), options, node),
  );

///////////
// Block //
///////////

/**
 * @type {(
 *   binding: [import("./atom").ArgVariable, aran.Intrinsic],
 * ) => [import("./atom").ResVariable, aran.Intrinsic]}
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
 * @type {<B, L extends Json>(
 *   site:  {
 *     node: import("./atom").ArgRoutineBlock,
 *     path: import("./atom").TargetPath,
 *   },
 *   options: import("./visit").Options<B, L>,
 *   parent: (
 *     | import("./atom").ArgProgram
 *     | (import("./atom").ArgExpression & { type: "ClosureExpression" })
 *   ),
 * ) => import("./atom").ResRoutineBlock}
 */
const weaveRoutineBlock = ({ node, path }, options, parent) => {
  const { locate } = options;
  const location = locate(node.tag, options.base);
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
          path,
          options,
        ),
        makeEffectStatement,
      ),
    ),
    liftSequenceX(
      flat,
      flatSequence(
        map(drillAll(drillArray({ node, path }, "body")), (pair) =>
          weaveStatement(pair, options),
        ),
      ),
    ),
    callSequenceX__(
      makeTrapExpression,
      liftSequence_X_(
        makeBlockCompletionPoint,
        frame,
        weaveExpression(drill({ node, path }, "completion"), options),
        location,
      ),
      path,
      options,
    ),
    makeMaybeTrapExpression(
      makeBlockFailurePoint(frame, makeReadExpression("catch.error"), location),
      path,
      options,
    ),
    makeMaybeTrapExpression(
      makeBlockLeavePoint(frame, location),
      path,
      options,
    ),
  );
  if (schema.failure === null && schema.leave === null) {
    const setup = setupBinding(bindings);
    return makeRoutineBlock(
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
    return makeRoutineBlock(
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
 * @type {<B, L extends Json>(
 *   site:  {
 *     node: import("./atom").ArgControlBlock,
 *     path: import("./atom").TargetPath,
 *   },
 *   options: import("./visit").Options<B, L>,
 *   kind: import("./point").ControlKind,
 * ) => import("./atom").ResControlBlock}
 */
const weaveControlBlock = ({ node, path }, options, kind) => {
  const { locate } = options;
  const location = locate(node.tag, options.base);
  const frame = makeControlFrame(kind, node.labels, node.frame);
  const { head: bindings, tail: schema } = liftSequenceXXXXX(
    makeBlockSchema,
    liftSequenceX_(
      map,
      listRecordTrapEffect(makeBlockEnterPoint(frame, location), path, options),
      makeEffectStatement,
    ),
    liftSequenceX(
      flat,
      flatSequence(
        map(drillAll(drillArray({ node, path }, "body")), (pair) =>
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
        path,
        options,
      ),
      makeEffectStatement,
    ),
    makeMaybeTrapExpression(
      makeBlockFailurePoint(frame, makeReadExpression("catch.error"), location),
      path,
      options,
    ),
    makeMaybeTrapExpression(
      makeBlockLeavePoint(frame, location),
      path,
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
 * @type {<B, L extends Json>(
 *   site:  {
 *     node: import("./atom").ArgStatement,
 *     path: import("./atom").TargetPath,
 *   },
 *   options: import("./visit").Options<B, L>
 * ) => import("../sequence").Sequence<
 *   import("./binding").Binding,
 *   import("./atom").ResStatement[],
 * >}
 */
const weaveStatement = ({ node, path }, options) => {
  const { locate } = options;
  const location = locate(node.tag, options.base);
  switch (node.type) {
    case "EffectStatement": {
      return liftSequenceX_(
        map,
        weaveEffect(drill({ node, path }, "inner"), options),
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
              weaveExpression(drill({ node, path }, "result"), options),
              location,
            ),
            path,
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
            path,
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
              type: "debugger.before",
              location,
            },
            path,
            options,
          ),
          makeEffectStatement,
        ),
        makeDebuggerStatement(),
        liftSequenceX_(
          map,
          listTrapEffect(
            {
              type: "debugger.after",
              location,
            },
            path,
            options,
          ),
          makeEffectStatement,
        ),
      );
    }
    case "BlockStatement": {
      return zeroSequence([
        makeBlockStatement(
          weaveControlBlock(drill({ node, path }, "body"), options, "naked"),
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
              weaveExpression(drill({ node, path }, "test"), options),
              location,
            ),
            path,
            options,
          ),
          weaveControlBlock(drill({ node, path }, "then"), options, "then"),
          weaveControlBlock(drill({ node, path }, "else"), options, "else"),
        ),
        liftSequenceX_(
          map,
          listTrapEffect(
            {
              type: "branch.after",
              kind: "if",
              // TODO: check if this makes sense
              value: makeIntrinsicExpression("undefined"),
              location,
            },
            path,
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
              weaveExpression(drill({ node, path }, "test"), options),
              location,
            ),
            path,
            options,
          ),
          weaveControlBlock(drill({ node, path }, "body"), options, "loop"),
        ),
      );
    }
    case "TryStatement": {
      return zeroSequence([
        makeTryStatement(
          weaveControlBlock(drill({ node, path }, "try"), options, "try"),
          weaveControlBlock(drill({ node, path }, "catch"), options, "catch"),
          weaveControlBlock(
            drill({ node, path }, "finally"),
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
 * @type {<B, L extends Json>(
 *   site:  {
 *     node: import("./atom").ArgEffect,
 *     path: import("./atom").TargetPath,
 *   },
 *   options: import("./visit").Options<B, L>
 * ) => import("../sequence").Sequence<
 *   import("./binding").Binding,
 *   import("./atom").ResEffect[],
 * >}
 */
const weaveEffect = ({ node, path }, options) => {
  const { locate } = options;
  const location = locate(node.tag, options.base);
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
              weaveExpression(drill({ node, path }, "discard"), options),
              location,
            ),
            path,
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
              weaveExpression(drill({ node, path }, "test"), options),
              location,
            ),
            path,
            options,
          ),
          liftSequenceX(
            flat,
            flatSequence(
              map(drillAll(drillArray({ node, path }, "positive")), (pair) =>
                weaveEffect(pair, options),
              ),
            ),
          ),
          liftSequenceX(
            flat,
            flatSequence(
              map(drillAll(drillArray({ node, path }, "negative")), (pair) =>
                weaveEffect(pair, options),
              ),
            ),
          ),
        ),
        listTrapEffect(
          {
            type: "branch.after",
            kind: "conditional.effect",
            // TODO: check if this makes sense
            value: makeIntrinsicExpression("undefined"),
            location,
          },
          path,
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
              weaveExpression(drill({ node, path }, "value"), options),
              location,
            ),
            path,
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
              weaveExpression(drill({ node, path }, "value"), options),
              location,
            ),
            path,
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
 * @type {<B, L extends Json>(
 *   site:  {
 *     node: import("./atom").ArgExpression,
 *     path: import("./atom").TargetPath,
 *   },
 *   options: import("./visit").Options<B, L>,
 * ) => import("../sequence").Sequence<
 *   import("./binding").Binding,
 *   import("./atom").ResExpression,
 * >}
 */
export const weaveExpression = ({ node, path }, options) => {
  const { locate } = options;
  const location = locate(node.tag, options.base);
  switch (node.type) {
    case "PrimitiveExpression": {
      return makeTrapExpression(
        {
          type: "primitive.after",
          value: unpackPrimitive(node.primitive),
          location,
        },
        path,
        options,
      );
    }
    case "IntrinsicExpression": {
      return makeTrapExpression(
        {
          type: "intrinsic.after",
          name: node.intrinsic,
          value: makeIntrinsicExpression(node.intrinsic),
          location,
        },
        path,
        options,
      );
    }
    case "ImportExpression": {
      return makeTrapExpression(
        {
          type: "import.after",
          source: node.source,
          specifier: node.import,
          value: makeImportExpression(node.source, node.import),
          location,
        },
        path,
        options,
      );
    }
    case "ReadExpression": {
      return makeTrapExpression(
        {
          type: "read.after",
          variable: node.variable,
          value: makeReadExpression(
            isParameter(node.variable)
              ? node.variable
              : mangleOriginalVariable(node.variable),
          ),
          location,
        },
        path,
        options,
      );
    }
    case "ClosureExpression": {
      return makeTrapExpression(
        {
          type: "closure.after",
          kind: node.kind,
          asynchronous: node.asynchronous,
          generator: node.generator,
          value: makeClosureExpression(
            node.kind,
            node.asynchronous,
            node.generator,
            weaveRoutineBlock(drill({ node, path }, "body"), options, node),
          ),
          location,
        },
        path,
        options,
      );
    }
    case "SequenceExpression": {
      return liftSequenceXX(
        makeSequenceExpression,
        liftSequenceX(
          flat,
          flatSequence(
            map(drillAll(drillArray({ node, path }, "head")), (pair) =>
              weaveEffect(pair, options),
            ),
          ),
        ),
        weaveExpression(drill({ node, path }, "tail"), options),
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
                weaveExpression(drill({ node, path }, "test"), options),
                location,
              ),
              path,
              options,
            ),
            weaveExpression(drill({ node, path }, "consequent"), options),
            weaveExpression(drill({ node, path }, "alternate"), options),
          ),
          location,
        ),
        path,
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
                weaveExpression(drill({ node, path }, "promise"), options),
                location,
              ),
              path,
              options,
            ),
          ),
          location,
        ),
        path,
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
                weaveExpression(drill({ node, path }, "item"), options),
                location,
              ),
              path,
              options,
            ),
          ),
          location,
        ),
        path,
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
                  weaveExpression(drill({ node, path }, "code"), options),
                  options.evals[node.tag],
                  location,
                ),
                path,
                options,
              ),
            ),
            location,
          ),
          path,
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
          weaveExpression(drill({ node, path }, "callee"), options),
          weaveExpression(drill({ node, path }, "this"), options),
          flatSequence(
            map(drillAll(drillArray({ node, path }, "arguments")), (pair) =>
              weaveExpression(pair, options),
            ),
          ),
          location,
        ),
        path,
        options,
      );
    }
    case "ConstructExpression": {
      return callSequenceX__(
        makeTrapExpression,
        liftSequenceXX_(
          makeConstructPoint,
          weaveExpression(drill({ node, path }, "callee"), options),
          flatSequence(
            map(drillAll(drillArray({ node, path }, "arguments")), (pair) =>
              weaveExpression(pair, options),
            ),
          ),
          location,
        ),
        path,
        options,
      );
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
