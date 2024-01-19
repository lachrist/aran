/* eslint-disable no-use-before-define */

import {
  map,
  flatMap,
  filter,
  includes,
  some,
  unzip,
  hasOwn,
  listEntry,
  listValue,
  removeDuplicate,
  reduceEntry,
} from "../util/index.mjs";
import { AranError, AranTypeError } from "../error.mjs";
import { unpackPrimitive } from "../lang.mjs";
import {
  makeBreakStatement,
  makeDebuggerStatement,
  makeImportExpression,
  makeIntrinsicExpression,
  makeAwaitExpression,
  makeBlockStatement,
  makeFunctionExpression,
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
  recordFree,
  makeArrowExpression,
} from "./node.mjs";
import {
  listTrapEffect,
  makeTrapExpression,
  trapClosureBlock,
  trapControlBlock,
  listEnterTrapEffect,
} from "./trap.mjs";
import { makeJsonExpression } from "./intrinsic.mjs";
import { drill, drillArray, drillAll } from "./drill.mjs";
import {
  makeReadCalleeExpression,
  makeReadOriginalExpression,
  makeWriteCalleeEffect,
  makeWriteLocationEffect,
  makeWriteOriginalEffect,
} from "./variable.mjs";
import { listParameter } from "../header.mjs";

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
  makeReadOriginalExpression(parameter),
];

/**
 * @type {(
 *   variable: weave.ArgVariable,
 * ) => [aran.Parameter | weave.ArgVariable, aran.Expression<weave.ResAtom>]}
 */
const makeVariableEntry = (variable) => [
  variable,
  makePrimitiveExpression({ undefined: null }),
];

/**
 * @type {<L>(
 *   parent: import("./visit").Parent,
 *   labels: weave.Label[],
 *   variables: weave.ArgVariable[],
 *   location: L,
 * ) => import("../../type/advice").Point<
 *   aran.Expression<weave.ResAtom>,
 *   L
 * > & {
 *   type: "program.enter" | "closure.enter" | "block.enter",
 * }}
 */
const makeEnterPoint = (parent, labels, variables, location) => {
  const record =
    /** @type {{[key in aran.Parameter | weave.ArgVariable]: aran.Expression<weave.ResAtom>}} */ (
      reduceEntry([
        ...map(listParentParameter(parent), makeParameterEntry),
        ...map(variables, makeVariableEntry),
      ])
    );
  switch (parent.type) {
    case "program": {
      return {
        type: "program.enter",
        sort: parent.sort,
        head: parent.head,
        record,
        location,
      };
    }
    case "closure": {
      return {
        type: "closure.enter",
        kind: parent.kind,
        callee: makeReadCalleeExpression(parent.callee),
        record,
        location,
      };
    }
    case "block": {
      return {
        type: "block.enter",
        kind: parent.kind,
        labels,
        record,
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
        value: makeReadExpression("catch.error", null),
        location,
      };
    }
    case "closure": {
      return {
        type: "closure.failure",
        kind: parent.kind,
        value: makeReadExpression("catch.error", null),
        location,
      };
    }
    case "block": {
      return {
        type: "block.failure",
        kind: parent.kind,
        value: makeReadExpression("catch.error", null),
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

/** @type {(binding: weave.Binding) => aran.Effect<weave.ResAtom>[]} */
const listLocationInitializeEffect = (binding) =>
  binding.type === "location"
    ? [
        makeWriteLocationEffect(
          binding.path,
          makeJsonExpression(binding.init),
          binding.init,
        ),
      ]
    : [];

/**
 * @type {<B, L extends Json>(
 *   pair: {
 *     node: aran.ClosureBlock<weave.ArgAtom>,
 *     path: weave.TargetPath,
 *   },
 *   options: import("./visit").Options<B, L>,
 *   parent: import("./visit").Parent & { type: "program" | "closure" },
 * ) => aran.ClosureBlock<weave.ResAtom>}
 */
const weaveClosureBlock = ({ node, path }, options, parent) => {
  const { locate } = options;
  const location = locate(node.tag, options.base);
  const block = trapClosureBlock(
    {
      statements: [
        ...map(
          listEnterTrapEffect(
            makeEnterPoint(parent, [], node.variables, location),
            path,
            options,
          ),
          makeEffectStatement,
        ),
        ...flatMap(drillAll(drillArray({ node, path }, "statements")), (pair) =>
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
  const [variables, bindings] = unzip(
    filter(
      /** @type {[weave.ResVariable, weave.Binding][]} */ (
        listEntry(
          reduceEntry([
            ...flatMap(map(block.statements, recordFree), listEntry),
            ...listEntry(recordFree(block.completion)),
          ]),
        )
      ),
      ([_variable, binding]) => {
        if (binding.type === "original") {
          return includes(node.variables, binding.name);
        }
        if (binding.type === "callee" && parent.type === "closure") {
          return binding.path !== parent.callee;
        }
        return true;
      },
    ),
  );
  return makeClosureBlock(
    variables,
    [
      ...map(
        flatMap(bindings, listLocationInitializeEffect),
        makeEffectStatement,
      ),
      ...block.statements,
    ],
    block.completion,
  );
};

/**
 * @type {<B, L extends Json>(
 *   pair: {
 *     node: aran.ControlBlock<weave.ArgAtom>,
 *     path: weave.TargetPath,
 *   },
 *   options: import("./visit").Options<B, L>,
 *   parent: import("./visit").Parent,
 * ) => aran.ControlBlock<weave.ResAtom>}
 */
const weaveControlBlock = ({ node, path }, options, parent) => {
  const { locate } = options;
  const location = locate(node.tag, options.base);
  const statements = trapControlBlock(
    [
      ...map(
        listEnterTrapEffect(
          makeEnterPoint(parent, node.labels, node.variables, location),
          path,
          options,
        ),
        makeEffectStatement,
      ),
      ...flatMap(drillAll(drillArray({ node, path }, "statements")), (pair) =>
        weaveStatement(pair, options),
      ),
      ...map(
        listTrapEffect(
          makeCompletionPoint(
            parent,
            makePrimitiveExpression({ undefined: null }),
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
  const [variables, bindings] = unzip(
    filter(
      /** @type {[weave.ResVariable, weave.Binding][]} */ (
        listEntry(reduceEntry(flatMap(map(statements, recordFree), listEntry)))
      ),
      ([_variable, binding]) =>
        binding.type === "original"
          ? includes(node.variables, binding.name)
          : true,
    ),
  );
  return makeControlBlock(node.labels, variables, [
    ...map(
      flatMap(bindings, listLocationInitializeEffect),
      makeEffectStatement,
    ),
    ...statements,
  ]);
};

///////////////
// Statement //
///////////////

/**
 * @type {<B, L extends Json>(
 *   pair: {
 *     node: aran.Statement<weave.ArgAtom>,
 *     path: weave.TargetPath,
 *   },
 *   options: import("./visit").Options<B, L>
 * ) => aran.Statement<weave.ResAtom>[]}
 */
const weaveStatement = ({ node, path }, options) => {
  const { locate } = options;
  const location = locate(node.tag, options.base);
  switch (node.type) {
    case "EffectStatement": {
      return map(
        weaveEffect(drill({ node, path }, "inner"), options),
        makeEffectStatement,
      );
    }
    case "ReturnStatement": {
      return [
        makeReturnStatement(
          makeTrapExpression(
            {
              type: "return.before",
              value: weaveExpression(drill({ node, path }, "result"), options),
              location,
            },
            path,
            options,
          ),
        ),
      ];
    }
    case "BreakStatement": {
      return [
        ...map(
          listTrapEffect(
            {
              type: "break.before",
              label: node.label,
              location,
            },
            path,
            options,
          ),
          makeEffectStatement,
        ),
        makeBreakStatement(node.label),
      ];
    }
    case "DebuggerStatement": {
      return [
        ...map(
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
        ...map(
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
      ];
    }
    case "BlockStatement": {
      return [
        makeBlockStatement(
          weaveControlBlock(drill({ node, path }, "do"), options, {
            type: "block",
            kind: "naked",
          }),
        ),
      ];
    }
    case "IfStatement": {
      return [
        makeIfStatement(
          makeTrapExpression(
            {
              type: "branch.before",
              kind: "if",
              value: weaveExpression(drill({ node, path }, "if"), options),
              location,
            },
            path,
            options,
          ),
          weaveControlBlock(drill({ node, path }, "then"), options, {
            type: "block",
            kind: "then",
          }),
          weaveControlBlock(drill({ node, path }, "else"), options, {
            type: "block",
            kind: "else",
          }),
        ),
        ...map(
          listTrapEffect(
            {
              type: "branch.after",
              kind: "if",
              location,
            },
            path,
            options,
          ),
          makeEffectStatement,
        ),
      ];
    }
    case "WhileStatement": {
      return [
        makeWhileStatement(
          makeTrapExpression(
            {
              type: "branch.before",
              kind: "while",
              value: weaveExpression(drill({ node, path }, "while"), options),
              location,
            },
            path,
            options,
          ),
          weaveControlBlock(drill({ node, path }, "do"), options, {
            type: "block",
            kind: "loop",
          }),
        ),
      ];
    }
    case "TryStatement": {
      return [
        makeTryStatement(
          weaveControlBlock(drill({ node, path }, "try"), options, {
            type: "block",
            kind: "try",
          }),
          weaveControlBlock(drill({ node, path }, "catch"), options, {
            type: "block",
            kind: "catch",
          }),
          weaveControlBlock(drill({ node, path }, "finally"), options, {
            type: "block",
            kind: "finally",
          }),
        ),
      ];
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {<B, L extends Json>(
 *   pair: {
 *     node: aran.Effect<weave.ArgAtom>,
 *     path: weave.TargetPath,
 *   },
 *   options: import("./visit").Options<B, L>
 * ) => aran.Effect<weave.ResAtom>[]}
 */
const weaveEffect = ({ node, path }, options) => {
  const { locate } = options;
  const location = locate(node.tag, options.base);
  switch (node.type) {
    case "ExpressionEffect": {
      return [
        makeExpressionEffect(
          makeTrapExpression(
            {
              type: "drop.before",
              value: weaveExpression(drill({ node, path }, "discard"), options),
              location,
            },
            path,
            options,
          ),
        ),
      ];
    }
    case "ConditionalEffect": {
      return [
        makeConditionalEffect(
          makeTrapExpression(
            {
              type: "branch.before",
              kind: "conditional",
              value: weaveExpression(
                drill({ node, path }, "condition"),
                options,
              ),
              location,
            },
            path,
            options,
          ),
          flatMap(drillAll(drillArray({ node, path }, "positive")), (pair) =>
            weaveEffect(pair, options),
          ),
          flatMap(drillAll(drillArray({ node, path }, "negative")), (pair) =>
            weaveEffect(pair, options),
          ),
        ),
        ...listTrapEffect(
          {
            type: "branch.after",
            kind: "conditional",
            location,
          },
          path,
          options,
        ),
      ];
    }
    case "WriteEffect": {
      return [
        makeWriteOriginalEffect(
          node.variable,
          makeTrapExpression(
            {
              type: "write.before",
              variable: node.variable,
              value: weaveExpression(drill({ node, path }, "right"), options),
              location,
            },
            path,
            options,
          ),
        ),
      ];
    }
    case "ExportEffect": {
      return [
        makeExportEffect(
          node.export,
          makeTrapExpression(
            {
              type: "export.before",
              specifier: node.export,
              value: weaveExpression(drill({ node, path }, "right"), options),
              location,
            },
            path,
            options,
          ),
        ),
      ];
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   node: aran.Expression<weave.ResAtom>,
 *   path: weave.TargetPath,
 * ) => aran.Expression<weave.ResAtom>}
 */
const assignSelfClosure = (node, path) =>
  some(
    listValue(recordFree(node)),
    (binding) => binding.type === "callee" && binding.path === path,
  )
    ? makeSequenceExpression(
        [makeWriteCalleeEffect(path, node)],
        makeReadCalleeExpression(path),
      )
    : node;

/**
 * @type {<B, L extends Json>(
 *   pair: {
 *     node: aran.Expression<weave.ArgAtom>,
 *     path: weave.TargetPath,
 *   },
 *   options: import("./visit").Options<B, L>,
 * ) => aran.Expression<weave.ResAtom>}
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
          value: makeReadOriginalExpression(node.variable),
          location,
        },
        path,
        options,
      );
    }
    case "ArrowExpression": {
      return assignSelfClosure(
        makeTrapExpression(
          {
            type: "arrow.after",
            asynchronous: node.asynchronous,
            value: makeArrowExpression(
              node.asynchronous,
              weaveClosureBlock(drill({ node, path }, "body"), options, {
                type: "closure",
                kind: "arrow",
                callee: path,
              }),
            ),
            location,
          },
          path,
          options,
        ),
        path,
      );
    }
    case "FunctionExpression": {
      return assignSelfClosure(
        makeTrapExpression(
          {
            type: "function.after",
            asynchronous: node.asynchronous,
            generator: node.generator,
            value: makeFunctionExpression(
              node.asynchronous,
              node.generator,
              weaveClosureBlock(drill({ node, path }, "body"), options, {
                type: "closure",
                kind: "function",
                callee: path,
              }),
            ),
            location,
          },
          path,
          options,
        ),
        path,
      );
    }
    case "SequenceExpression": {
      return makeSequenceExpression(
        flatMap(drillAll(drillArray({ node, path }, "head")), (pair) =>
          weaveEffect(pair, options),
        ),
        weaveExpression(drill({ node, path }, "tail"), options),
      );
    }
    case "ConditionalExpression": {
      return makeTrapExpression(
        {
          type: "conditional.after",
          value: makeConditionalExpression(
            makeTrapExpression(
              {
                type: "conditional.before",
                value: weaveExpression(
                  drill({ node, path }, "condition"),
                  options,
                ),
                location,
              },
              path,
              options,
            ),
            weaveExpression(drill({ node, path }, "consequent"), options),
            weaveExpression(drill({ node, path }, "alternate"), options),
          ),
          location,
        },
        path,
        options,
      );
    }
    case "AwaitExpression": {
      return makeTrapExpression(
        {
          type: "await.after",
          value: makeAwaitExpression(
            makeTrapExpression(
              {
                type: "await.before",
                value: weaveExpression(
                  drill({ node, path }, "promise"),
                  options,
                ),
                location,
              },
              path,
              options,
            ),
          ),
          location,
        },
        path,
        options,
      );
    }
    case "YieldExpression": {
      return makeTrapExpression(
        {
          type: "yield.after",
          delegate: node.delegate,
          value: makeYieldExpression(
            node.delegate,
            makeTrapExpression(
              {
                type: "yield.before",
                delegate: node.delegate,
                value: weaveExpression(drill({ node, path }, "item"), options),
                location,
              },
              path,
              options,
            ),
          ),
          location,
        },
        path,
        options,
      );
    }
    case "EvalExpression": {
      if (hasOwn(options.evals, node.tag)) {
        return makeTrapExpression(
          {
            type: "eval.after",
            value: makeEvalExpression(
              makeTrapExpression(
                {
                  type: "eval.before",
                  value: weaveExpression(
                    drill({ node, path }, "code"),
                    options,
                  ),
                  context: options.evals[node.tag],
                  location,
                },
                path,
                options,
              ),
            ),
            location,
          },
          path,
          options,
        );
      } else {
        throw new AranError("missing context on eval call expression", node);
      }
    }
    case "ApplyExpression": {
      return makeTrapExpression(
        {
          type: "apply",
          callee: weaveExpression(drill({ node, path }, "callee"), options),
          this: weaveExpression(drill({ node, path }, "this"), options),
          arguments: map(
            drillAll(drillArray({ node, path }, "arguments")),
            (pair) => weaveExpression(pair, options),
          ),
          location,
        },
        path,
        options,
      );
    }
    case "ConstructExpression": {
      return makeTrapExpression(
        {
          type: "construct",
          callee: weaveExpression(drill({ node, path }, "callee"), options),
          arguments: map(
            drillAll(drillArray({ node, path }, "arguments")),
            (pair) => weaveExpression(pair, options),
          ),
          location,
        },
        path,
        options,
      );
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
