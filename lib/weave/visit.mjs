/* eslint-disable no-use-before-define */

import {
  map,
  flatMap,
  hasOwn,
  removeDuplicate,
  reduceEntry,
  concat_X,
  concat_,
  concatX_,
  concatX_X,
  flat,
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
  makeClosureBlock,
  makeConditionalEffect,
  makeWriteEffect,
  makeClosureExpression,
} from "./node.mjs";
import {
  listTrapEffect,
  makeTrapExpression,
  trapClosureBlock,
  trapControlBlock,
  listEnterTrapEffect,
  makeMaybeTrapExpression,
} from "./trap.mjs";
import { drill, drillArray, drillAll } from "./drill.mjs";
import { listParameter } from "../header.mjs";
import { ADVICE_VARIABLE, mangleOriginalVariable } from "./variable.mjs";
import { makeGetExpression } from "./intrinsic.mjs";
import {
  callSequenceX__,
  flatSequence,
  liftSequenceX,
  liftSequenceXX,
  liftSequenceXXX,
  liftSequenceXXX_,
  liftSequenceXX_,
  liftSequenceX_,
  liftSequenceX_X,
  liftSequenceX__,
  liftSequenceX___,
  liftSequence_X,
  liftSequence_X_,
  liftSequence_X__,
  zeroSequence,
} from "../sequence.mjs";
import {
  makeApplyPoint,
  makeAwaitAfterPoint,
  makeAwaitBeforePoint,
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
import { makeApplyExpression } from "../node.mjs";
import { makeControlFrame } from "./frame.mjs";

/////////////
// Program //
/////////////

/**
 * @type {<B, L extends Json>(
 *   pair: {
 *     node: aran.Program<weave.ArgAtom>,
 *     path: weave.TargetPath,
 *   },
 *   options: import("./visit").Options<B, L>,
 * ) => aran.Program<weave.ResAtom>}
 */
export const weaveProgram = ({ node, path }, options) =>
  makeProgram(
    node.sort,
    node.head,
    weaveClosureBlock(drill({ node, path }, "body"), options, {
      type: "program",
      sort: node.sort,
      head: node.head,
    }),
  );

///////////
// Block //
///////////

/**
 * @type {(
 *   parent: import("./visit").Parent,
 * ) => aran.Parameter[]}
 */
const listParentParameter = (parent) => {
  switch (parent.type) {
    case "block": {
      return parent.kind === "catch" ? ["catch.error"] : [];
    }
    case "closure": {
      switch (parent.kind) {
        case "arrow": {
          return ["function.arguments"];
        }
        case "function": {
          return ["new.target", "this", "function.arguments"];
        }
        default: {
          throw new AranTypeError(parent);
        }
      }
    }
    case "program": {
      return removeDuplicate(flatMap(parent.head, listParameter));
    }
    default: {
      throw new AranTypeError(parent);
    }
  }
};

/**
 * @type {(
 *   parameter: aran.Parameter,
 * ) => [aran.Parameter | weave.ArgVariable, aran.Expression<weave.ResAtom>]}
 */
const makeParameterEntry = (parameter) => [
  parameter,
  makeReadExpression(parameter),
];

/**
 * @type {(
 *   entry: [weave.ArgVariable, aran.Intrinsic],
 * ) => [aran.Parameter | weave.ArgVariable, aran.Expression<weave.ResAtom>]}
 */
const makeVariableEntry = ([variable, intrinsic]) => [
  variable,
  makeIntrinsicExpression(intrinsic),
];

/**
 * @type {<L>(
 *   parent: import("./visit").Parent,
 *   labels: weave.Label[],
 *   bindings: [weave.ArgVariable, aran.Intrinsic][],
 *   location: L,
 * ) => import("../../type/advice").Point<
 *   aran.Expression<weave.ResAtom>,
 *   L
 * > & {
 *   type: "program.enter" | "closure.enter" | "block.enter",
 * }}
 */
const makeEnterPoint = (parent, labels, bindings, location) => {
  const frame =
    /** @type {{[key in aran.Parameter | weave.ArgVariable]: aran.Expression<weave.ResAtom>}} */ (
      reduceEntry([
        ...map(listParentParameter(parent), makeParameterEntry),
        ...map(bindings, makeVariableEntry),
      ])
    );
  switch (parent.type) {
    case "program": {
      return {
        type: "program.enter",
        sort: parent.sort,
        head: parent.head,
        frame,
        location,
      };
    }
    case "closure": {
      return {
        type: "closure.enter",
        kind: parent.kind,
        frame,
        location,
      };
    }
    case "block": {
      return {
        type: "block.enter",
        kind: parent.kind,
        labels,
        frame,
        location,
      };
    }
    default: {
      throw new AranTypeError(parent);
    }
  }
};

/**
 * @type {<L>(
 *   parent: import("./visit").Parent,
 *   completion: aran.Expression<weave.ResAtom>,
 *   location: L,
 * ) => import("../../type/advice").Point<
 *   aran.Expression<weave.ResAtom>,
 *   L
 * >}
 */
const makeCompletionPoint = (parent, completion, location) => {
  switch (parent.type) {
    case "program": {
      return {
        type: "program.completion",
        sort: parent.sort,
        value: completion,
        location,
      };
    }
    case "closure": {
      return {
        type: "closure.completion",
        kind: parent.kind,
        value: completion,
        location,
      };
    }
    case "block": {
      return {
        type: "block.completion",
        kind: parent.kind,
        location,
      };
    }
    default: {
      throw new AranTypeError(parent);
    }
  }
};

/**
 * @type {<L>(
 *   parent: import("./visit").Parent,
 *   location: L,
 * ) => import("../../type/advice").Point<
 *   aran.Expression<weave.ResAtom>,
 *   L
 * >}
 */
const makeFailurePoint = (parent, location) => {
  switch (parent.type) {
    case "program": {
      return {
        type: "program.failure",
        sort: parent.sort,
        value: makeReadExpression("catch.error"),
        location,
      };
    }
    case "closure": {
      return {
        type: "closure.failure",
        kind: parent.kind,
        value: makeReadExpression("catch.error"),
        location,
      };
    }
    case "block": {
      return {
        type: "block.failure",
        kind: parent.kind,
        value: makeReadExpression("catch.error"),
        location,
      };
    }
    default: {
      throw new AranTypeError(parent);
    }
  }
};

/**
 * @type {<L>(
 *   parent: import("./visit").Parent,
 *   location: L,
 * ) => import("../../type/advice").Point<
 *   aran.Expression<weave.ResAtom>,
 *   L
 * >}
 */
const makeLeavePoint = (parent, location) => {
  switch (parent.type) {
    case "program": {
      return {
        type: "program.leave",
        sort: parent.sort,
        location,
      };
    }
    case "closure": {
      return {
        type: "closure.leave",
        kind: parent.kind,
        location,
      };
    }
    case "block": {
      return {
        type: "block.leave",
        kind: parent.kind,
        location,
      };
    }
    default: {
      throw new AranTypeError(parent);
    }
  }
};

/**
 * @type {(
 *   binding: [weave.ArgVariable, aran.Intrinsic],
 * ) => [weave.ResVariable, aran.Intrinsic]}
 */
const mangleFrameEntry = ([variable, intrinsic]) => [
  mangleOriginalVariable(variable),
  intrinsic,
];

/**
 * @type {<B, L extends Json>(
 *   pair: {
 *     node: import("./atom").ArgClosureBlock,
 *     path: import("./atom").TargetPath,
 *   },
 *   options: import("./visit").Options<B, L>,
 *   block: Omit<import("./frame").Block, "frame">,
 * ) => import("./atom").ResClosureBlock}
 */
const weaveClosureBlock = ({ node, path }, options, block) => {
  const { locate } = options;
  const location = locate(node.tag, options.base);
  const block = trapClosureBlock(
    {
      body: [
        makeEffectStatement(
          makeWriteEffect(
            ADVICE_VARIABLE,
            makeGetExpression(
              makeIntrinsicExpression("aran.global"),
              makePrimitiveExpression(options.advice.variable),
            ),
          ),
        ),
        ...map(
          listEnterTrapEffect(
            makeEnterPoint(parent, [], node.frame, location),
            path,
            options,
          ),
          makeEffectStatement,
        ),
        ...flatMap(drillAll(drillArray({ node, path }, "body")), (pair) =>
          weaveStatement(pair, options),
        ),
      ],
      completion: makeTrapExpression(
        makeCompletionPoint(
          parent,
          weaveExpression(drill({ node, path }, "completion"), options),
          location,
        ),
        path,
        options,
      ),
    },
    {
      catch: makeFailurePoint(parent, location),
      finally: makeLeavePoint(parent, location),
    },
    path,
    options,
  );
  return makeClosureBlock(
    concat_X(
      [ADVICE_VARIABLE, "aran.deadzone"],
      map(node.frame, mangleFrameEntry),
    ),
    block.body,
    block.completion,
  );
};

/**
 * @type {<B, L extends Json>(
 *   pair: {
 *     node: import("./atom").ArgControlBlock,
 *     path: import("./atom").TargetPath,
 *   },
 *   options: import("./visit").Options<B, L>,
 *   kind: import("./frame").ControlFrame["kind"],
 * ) => import("./atom").ResControlBlock}
 */
const weaveControlBlock = ({ node, path }, options, kind) => {
  const { locate } = options;
  const location = locate(node.tag, options.base);
  const frame = makeControlFrame(kind, node.labels, node.frame);
  const enter_trap = makeMaybeTrapExpression(
    makeEnterPoint(),
    , path, options);

  const body = trapControlBlock(
    [
      ...map(
        listEnterTrapEffect(
          makeEnterPoint(parent, node.labels, node.frame, location),
          path,
          options,
        ),
        makeEffectStatement,
      ),
      ...flatMap(drillAll(drillArray({ node, path }, "body")), (pair) =>
        weaveStatement(pair, options),
      ),
      ...map(
        listTrapEffect(
          makeCompletionPoint(
            parent,
            makeIntrinsicExpression("undefined"),
            location,
          ),
          path,
          options,
        ),
        makeEffectStatement,
      ),
    ],
    {
      catch: makeFailurePoint(parent, location),
      finally: makeLeavePoint(parent, location),
    },
    path,
    options,
  );
  return makeControlBlock(node.labels, map(node.frame, mangleFrameEntry), body);
};

///////////////
// Statement //
///////////////

/**
 * @type {<B, L extends Json>(
 *   pair: {
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
 *   pair: {
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
 *   pair: {
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
            weaveClosureBlock(drill({ node, path }, "body"), options, {
              type: "closure",
              kind: node.kind,
              asynchronous: node.asynchronous,
              generator: node.generator,
            }),
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
