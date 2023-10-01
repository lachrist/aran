/* eslint-disable no-use-before-define */

import {
  StaticError,
  map,
  flatMap,
  reduceReverse,
  enumerate,
  removeDuplicate,
  filter,
  includes,
  remove,
} from "../util/index.mjs";
import { getNodeTag, isParameter, unpackPrimitive } from "../lang.mjs";
import {
  makeBreakStatement,
  makeDebuggerStatement,
  makeImportExpression,
  makeIntrinsicExpression,
  makeReadEnclaveExpression,
  makeTypeofEnclaveExpression,
  makeAwaitExpression,
  makeBlockStatement,
  makeFunctionExpression,
  makeConditionalExpression,
  makeDeclareEnclaveStatement,
  makeEffectStatement,
  makeEvalExpression,
  makeScriptProgram,
  makeModuleProgram,
  makeEvalProgram,
  makeExportEffect,
  makeExpressionEffect,
  makeIfStatement,
  makePrimitiveExpression,
  makeReturnStatement,
  makeSequenceExpression,
  makeTryStatement,
  makeWhileStatement,
  makeWriteEnclaveEffect,
  makeYieldExpression,
  makeReadExpression,
  makeWriteEffect,
  makeControlBlock,
  makeClosureBlock,
  makePseudoBlock,
  makeConditionalEffect,
  makeExporLink,
  makeAggregateLink,
  makeImportLink,
} from "./node.mjs";
import {
  mangleCalleeVariable,
  mangleOriginalVariable,
  unmangleOriginalVariable,
  unmangleSerialVariable,
} from "./variable.mjs";
import {
  listTrapEffect,
  makeTrapExpression,
  trapClosureBlock,
  trapControlBlock,
  listEnterTrapEffect,
} from "./trap.mjs";
import { escapePseudoBlock } from "./escape.mjs";
import { makeJsonExpression } from "./intrinsic.mjs";

/**
 * @template S
 * @typedef {import("./advice.js").Point<S>} Point
 */

/**
 * @template S
 * @typedef {import("./advice.js").Pointcut<S>} Pointcut
 */

/** @typedef {import("./advice.js").LinkData} LinkData */

/** @typedef {import("./advice.js").BlockKind} BlockKind */

/**
 * @template S
 * @typedef {{
 *   advice: aran.Expression<weave.ResAtom>,
 *   pointcut: Pointcut<S>,
 *   serial: "inline" | "extract",
 * }} Options
 */

/**
 * @typedef {{
 *   type: "function",
 *   kind: aran.FunctionKind,
 *   callee: weave.ResVariable,
 * } | {
 *   type: "program",
 *   kind: aran.ProgramKind,
 *   links: LinkData[],
 * } | {
 *   type: "block",
 *   kind: BlockKind,
 * }} Parent
 */

const {
  Error,
  undefined,
  Object: { fromEntries: reduceEntry },
} = globalThis;

/**
 * @type {(
 *   expression: aran.Expression<weave.ResAtom>,
 *   effect: aran.Effect<weave.ResAtom>,
 * ) => aran.Expression<weave.ResAtom>}
 */
const makeFlipSequenceExpression = (expression, effect) =>
  makeSequenceExpression(effect, expression);

/////////////
// Program //
/////////////

/**
 * @type {<S extends Json>(
 *   node: aran.Program<weave.ArgAtom<S>>,
 *   options: {
 *     advice: estree.Variable,
 *     root: unbuild.Root,
 *     serial: "inline" | "extract",
 *     pointcut: Pointcut<S>,
 *   },
 * ) => aran.Program<weave.ResAtom>}
 */
export const weaveProgram = (node, { root, advice, serial, pointcut }) => {
  const options = {
    advice: makeReadEnclaveExpression(advice),
    serial,
    pointcut,
  };
  switch (node.type) {
    case "EvalProgram":
      return makeEvalProgram(
        weaveClosureBlock(node.body, "", options, {
          type: "program",
          kind: "eval",
          links: [],
        }),
      );
    case "ModuleProgram":
      return makeModuleProgram(
        map(node.links, weaveLink),
        weaveClosureBlock(node.body, "", options, {
          type: "program",
          kind: "module",
          links: map(node.links, serializeLink),
        }),
      );
    case "ScriptProgram":
      return makeScriptProgram(
        escapePseudoBlock(
          weavePseudoBlock(node.body, "", options, {
            type: "program",
            kind: "script",
            links: [],
          }),
          root,
        ),
      );
    default:
      throw new StaticError("invalid program node", node);
  }
};

//////////
// Link //
//////////

/**
 * @type {<S>(
 *   node: aran.Link<weave.ArgAtom<S>>,
 * ) => aran.Link<weave.ResAtom>}
 */
const weaveLink = (node) => {
  switch (node.type) {
    case "ImportLink":
      return makeImportLink(node.source, node.import);
    case "ExportLink":
      return makeExporLink(node.export);
    case "AggregateLink":
      return makeAggregateLink(node.source, node.import, node.export);
    default:
      throw new StaticError("invalid link node", node);
  }
};

/** @type {<S>(node: aran.Link<weave.ArgAtom<S>>) => LinkData} */
const serializeLink = (node) => {
  switch (node.type) {
    case "ImportLink":
      return {
        type: "import",
        source: node.source,
        specifier: node.import,
      };
    case "ExportLink":
      return {
        type: "export",
        export: node.export,
      };
    case "AggregateLink":
      return {
        type: "aggregate",
        source: node.source,
        import: node.import,
        export: node.export,
      };
    default:
      throw new StaticError("invalid link node", node);
  }
};

///////////
// Block //
///////////

/** @type {(parent: Parent) => aran.Parameter[]} */
const listParentParameter = (parent) => {
  if (parent.type === "block") {
    return parent.kind === "catch" ? ["catch.error"] : [];
  } else if (parent.type === "program") {
    if (parent.kind === "eval") {
      return ["import", "super.call", "super.get", "super.set"];
    } else if (parent.kind === "module") {
      return ["import", "import.meta"];
    } else if (parent.kind === "script") {
      return ["import"];
    } else {
      throw new StaticError("invalid program kind", parent.kind);
    }
  } else if (parent.type === "function") {
    if (parent.kind === "arrow") {
      return ["function.arguments"];
    } else if (parent.kind === "method") {
      return ["this", "function.arguments"];
    } else if (parent.kind === "function" || parent.kind === "constructor") {
      return ["this", "new.target", "function.arguments"];
    } else {
      throw new StaticError("invalid function kind", parent.kind);
    }
  } else {
    throw new StaticError("invalid parent", parent);
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
 *   variable: weave.ArgVariable,
 * ) => [aran.Parameter | weave.ArgVariable, aran.Expression<weave.ResAtom>]}
 */
const makeVariableEntry = (variable) => [
  variable,
  makePrimitiveExpression({ undefined: null }),
];

/**
 * @type {<S>(
 *   parent: Parent,
 *   labels: weave.Label[],
 *   variables: weave.ArgVariable[],
 *   serial: S,
 * ) => Point<S> & { type: "program.enter" | "function.enter" | "block.enter" }}
 */
const makeEnterPoint = (parent, labels, variables, serial) => {
  const frame =
    /** @type {{[key in aran.Parameter | weave.ArgVariable]: aran.Expression<weave.ResAtom>}} */ (
      reduceEntry([
        ...map(listParentParameter(parent), makeParameterEntry),
        ...map(variables, makeVariableEntry),
      ])
    );
  switch (parent.type) {
    case "program":
      return {
        type: "program.enter",
        kind: parent.kind,
        links: parent.links,
        frame,
        serial,
      };
    case "function":
      return {
        type: "function.enter",
        kind: parent.kind,
        callee: makeReadExpression(parent.callee),
        frame,
        serial,
      };
    case "block":
      return {
        type: "block.enter",
        kind: parent.kind,
        labels,
        frame,
        serial,
      };
    default:
      throw new StaticError("invalid parent", parent);
  }
};

/**
 * @type {<S>(
 *   parent: Parent,
 *   completion: aran.Expression<weave.ResAtom>,
 *   serial: S,
 * ) => Point<S>}
 */
const makeCompletionPoint = (parent, completion, serial) => {
  switch (parent.type) {
    case "program":
      return {
        type: "program.completion",
        kind: parent.kind,
        value: completion,
        serial,
      };
    case "function":
      return {
        type: "function.completion",
        kind: parent.kind,
        value: completion,
        serial,
      };
    case "block":
      return {
        type: "block.completion",
        kind: parent.kind,
        serial,
      };
    default:
      throw new StaticError("invalid parent", parent);
  }
};

/** @type {<S>(parent: Parent, serial: S) => Point<S>} */
const makeFailurePoint = (parent, serial) => {
  switch (parent.type) {
    case "program":
      return {
        type: "program.failure",
        kind: parent.kind,
        value: makeReadExpression("catch.error"),
        serial,
      };
    case "function":
      return {
        type: "function.failure",
        kind: parent.kind,
        value: makeReadExpression("catch.error"),
        serial,
      };
    case "block":
      return {
        type: "block.failure",
        kind: parent.kind,
        value: makeReadExpression("catch.error"),
        serial,
      };
    default:
      throw new StaticError("invalid parent", parent);
  }
};

/** @type {<S>(parent: Parent, serial: S) => Point<S>} */
const makeLeavePoint = (parent, serial) => {
  switch (parent.type) {
    case "program":
      return {
        type: "program.leave",
        kind: parent.kind,
        serial,
      };
    case "function":
      return {
        type: "function.leave",
        kind: parent.kind,
        serial,
      };
    case "block":
      return {
        type: "block.leave",
        kind: parent.kind,
        serial,
      };
    default:
      throw new StaticError("invalid parent", parent);
  }
};

/**
 * @type {(
 *   variable: weave.ResVariable,
 *   variables: weave.ArgVariable[],
 * ) => boolean}
 */
const isBound = (variable, variables) => {
  const original = unmangleOriginalVariable(variable);
  return original === null || includes(variables, original);
};

/** @type {(variable: weave.ResVariable) => aran.Effect<weave.ResAtom>[]} */
const listSerialInitializeEffect = (variable) => {
  const serial = unmangleSerialVariable(variable);
  return serial === undefined
    ? []
    : [makeWriteEffect(variable, makeJsonExpression(serial))];
};

/**
 * @type {<S extends Json>(
 *   node: aran.ClosureBlock<weave.ArgAtom<S>>,
 *   path: string,
 *   options: Options<S>,
 *   parent: Parent & { type: "program" | "function" },
 * ) => aran.ClosureBlock<weave.ResAtom>}
 */
const weaveClosureBlock = (node, path, options, parent) => {
  const block = trapClosureBlock(
    {
      statements: [
        ...map(
          listEnterTrapEffect(
            makeEnterPoint(parent, [], node.variables, node.tag.serial),
            options,
          ),
          makeEffectStatement,
        ),
        ...flatMap(enumerate(node.statements.length), (index) =>
          weaveStatement(node.statements[index], `${path}_${index}`, options),
        ),
      ],
      completion: makeTrapExpression(
        makeCompletionPoint(
          parent,
          weaveExpression(node.completion, `${path}_c`, options),
          node.tag.serial,
        ),
        options,
      ),
    },
    {
      catch: makeFailurePoint(parent, node.tag.serial),
      finally: makeLeavePoint(parent, node.tag.serial),
    },
    options,
  );
  const variables = filter(
    removeDuplicate([
      ...flatMap(block.statements, getNodeTag),
      ...block.completion.tag,
    ]),
    (variable) => isBound(variable, node.variables),
  );
  return makeClosureBlock(
    parent.type === "function" ? remove(variables, parent.callee) : variables,
    [
      ...map(
        flatMap(variables, listSerialInitializeEffect),
        makeEffectStatement,
      ),
      ...block.statements,
    ],
    block.completion,
  );
};

/**
 * @type {<S extends Json>(
 *   node: aran.ControlBlock<weave.ArgAtom<S>>,
 *   path: string,
 *   options: Options<S>,
 *   parent: Parent,
 * ) => aran.ControlBlock<weave.ResAtom>}
 */
const weaveControlBlock = (node, path, options, parent) => {
  const statements = trapControlBlock(
    [
      ...map(
        listEnterTrapEffect(
          makeEnterPoint(parent, node.labels, node.variables, node.tag.serial),
          options,
        ),
        makeEffectStatement,
      ),
      ...flatMap(enumerate(node.statements.length), (index) =>
        weaveStatement(node.statements[index], `${path}_${index}`, options),
      ),
      ...map(
        listTrapEffect(
          makeCompletionPoint(
            parent,
            makePrimitiveExpression({ undefined: null }),
            node.tag.serial,
          ),
          options,
        ),
        makeEffectStatement,
      ),
    ],
    {
      catch: makeFailurePoint(parent, node.tag.serial),
      finally: makeLeavePoint(parent, node.tag.serial),
    },
    options,
  );
  const variables = filter(
    removeDuplicate(flatMap(statements, getNodeTag)),
    (variable) => isBound(variable, node.variables),
  );
  return makeControlBlock(node.labels, variables, [
    ...map(flatMap(variables, listSerialInitializeEffect), makeEffectStatement),
    ...statements,
  ]);
};

/**
 * @type {<S extends Json>(
 *   node: aran.PseudoBlock<weave.ArgAtom<S>>,
 *   path: string,
 *   options: Options<S>,
 *   parent: Parent,
 * ) => aran.PseudoBlock<weave.ResAtom>}
 */
const weavePseudoBlock = (node, path, options, parent) => {
  const statements = flatMap(enumerate(node.statements.length), (index) =>
    weaveStatement(node.statements[index], `${path}_${index}`, options),
  );
  return makePseudoBlock(
    [
      ...map(
        flatMap(flatMap(statements, getNodeTag), listSerialInitializeEffect),
        makeEffectStatement,
      ),
      ...map(
        listEnterTrapEffect(
          makeEnterPoint(parent, [], [], node.tag.serial),
          options,
        ),
        makeEffectStatement,
      ),
      ...statements,
    ],
    makeTrapExpression(
      makeCompletionPoint(
        parent,
        weaveExpression(node.completion, `${path}_completion`, options),
        node.tag.serial,
      ),
      options,
    ),
  );
};

///////////////
// Statement //
///////////////

/**
 * @type {<S extends Json>(
 *   node: aran.Statement<weave.ArgAtom<S>>,
 *   path: string,
 *   options: Options<S>
 * ) => aran.Statement<weave.ResAtom>[]}
 */
const weaveStatement = (node, path, options) => {
  switch (node.type) {
    case "EffectStatement":
      return map(
        weaveEffect(node.inner, `${path}1`, options),
        makeEffectStatement,
      );
    case "ReturnStatement":
      return [
        makeReturnStatement(
          makeTrapExpression(
            {
              type: "return.before",
              value: weaveExpression(node.result, `${path}1`, options),
              serial: node.tag.serial,
            },
            options,
          ),
        ),
      ];
    case "DeclareEnclaveStatement": {
      return [
        makeDeclareEnclaveStatement(
          node.kind,
          node.variable,
          makeTrapExpression(
            {
              type: "enclave.declare.before",
              kind: node.kind,
              variable: node.variable,
              value: weaveExpression(node.right, `${path}1`, options),
              serial: node.tag.serial,
            },
            options,
          ),
        ),
        ...map(
          listTrapEffect(
            {
              type: "enclave.declare.after",
              kind: node.kind,
              variable: node.variable,
              serial: node.tag.serial,
            },
            options,
          ),
          makeEffectStatement,
        ),
      ];
    }
    case "BreakStatement":
      return [
        ...map(
          listTrapEffect(
            {
              type: "break.before",
              label: node.label,
              serial: node.tag.serial,
            },
            options,
          ),
          makeEffectStatement,
        ),
        makeBreakStatement(node.label),
      ];
    case "DebuggerStatement": {
      return [
        ...map(
          listTrapEffect(
            {
              type: "debugger.before",
              serial: node.tag.serial,
            },
            options,
          ),
          makeEffectStatement,
        ),
        makeDebuggerStatement(),
        ...map(
          listTrapEffect(
            {
              type: "debugger.after",
              serial: node.tag.serial,
            },
            options,
          ),
          makeEffectStatement,
        ),
      ];
    }
    case "BlockStatement":
      return [
        makeBlockStatement(
          weaveControlBlock(node.do, `${path}1`, options, {
            type: "block",
            kind: "naked",
          }),
        ),
      ];
    case "IfStatement":
      return [
        makeIfStatement(
          makeTrapExpression(
            {
              type: "branch.before",
              kind: "if",
              value: weaveExpression(node.if, `${path}1`, options),
              serial: node.tag.serial,
            },
            options,
          ),
          weaveControlBlock(node.then, `${path}2`, options, {
            type: "block",
            kind: "then",
          }),
          weaveControlBlock(node.else, `${path}3`, options, {
            type: "block",
            kind: "else",
          }),
        ),
        ...map(
          listTrapEffect(
            {
              type: "branch.after",
              kind: "if",
              serial: node.tag.serial,
            },
            options,
          ),
          makeEffectStatement,
        ),
      ];
    case "WhileStatement":
      return [
        makeWhileStatement(
          makeTrapExpression(
            {
              type: "branch.before",
              kind: "while",
              value: weaveExpression(node.while, `${path}1`, options),
              serial: node.tag.serial,
            },
            options,
          ),
          weaveControlBlock(node.do, `${path}2`, options, {
            type: "block",
            kind: "loop",
          }),
        ),
      ];
    case "TryStatement":
      return [
        makeTryStatement(
          weaveControlBlock(node.try, `${path}1`, options, {
            type: "block",
            kind: "try",
          }),
          weaveControlBlock(node.catch, `${path}2`, options, {
            type: "block",
            kind: "catch",
          }),
          weaveControlBlock(node.finally, `${path}3`, options, {
            type: "block",
            kind: "finally",
          }),
        ),
      ];
    default:
      throw new StaticError("invalid statement node", node);
  }
};

/**
 * @type {<S extends Json>(
 *   node: aran.Effect<weave.ArgAtom<S>>,
 *   path: string,
 *   options: Options<S>
 * ) => aran.Effect<weave.ResAtom>[]}
 */
const weaveEffect = (node, path, options) => {
  switch (node.type) {
    case "ExpressionEffect":
      return [
        makeExpressionEffect(
          makeTrapExpression(
            {
              type: "drop.before",
              value: weaveExpression(node.discard, `${path}1`, options),
              serial: node.tag.serial,
            },
            options,
          ),
        ),
      ];
    case "ConditionalEffect":
      return [
        makeConditionalEffect(
          makeTrapExpression(
            {
              type: "branch.before",
              kind: "conditional",
              value: weaveExpression(node.condition, `${path}1`, options),
              serial: node.tag.serial,
            },
            options,
          ),
          flatMap(enumerate(node.positive.length), (index) =>
            weaveEffect(node.positive[index], `${path}p_${index}`, options),
          ),
          flatMap(enumerate(node.negative.length), (index) =>
            weaveEffect(node.negative[index], `${path}n_${index}`, options),
          ),
        ),
        ...listTrapEffect(
          {
            type: "branch.after",
            kind: "conditional",
            serial: node.tag.serial,
          },
          options,
        ),
      ];
    case "WriteEffect":
      return [
        makeWriteEffect(
          isParameter(node.variable)
            ? node.variable
            : mangleOriginalVariable(node.variable),
          makeTrapExpression(
            {
              type: "write.before",
              variable: node.variable,
              value: weaveExpression(node.right, `${path}1`, options),
              serial: node.tag.serial,
            },
            options,
          ),
        ),
      ];
    case "ExportEffect":
      return [
        makeExportEffect(
          node.export,
          makeTrapExpression(
            {
              type: "export.before",
              specifier: node.export,
              value: weaveExpression(node.right, `${path}1`, options),
              serial: node.tag.serial,
            },
            options,
          ),
        ),
      ];
    case "WriteEnclaveEffect":
      return [
        makeWriteEnclaveEffect(
          node.variable,
          makeTrapExpression(
            {
              type: "enclave.write.before",
              variable: node.variable,
              value: weaveExpression(node.right, `${path}1`, options),
              serial: node.tag.serial,
            },
            options,
          ),
        ),
        ...listTrapEffect(
          {
            type: "enclave.write.after",
            variable: node.variable,
            serial: node.tag.serial,
          },
          options,
        ),
      ];
    default:
      throw new StaticError("invalid effect node", node);
  }
};

/**
 * @type {<S extends Json>(
 *   node: aran.Expression<weave.ArgAtom<S>>,
 *   path: string,
 *   options: Options<S>
 * ) => aran.Expression<weave.ResAtom>}
 */
export const weaveExpression = (node, path, options) => {
  switch (node.type) {
    case "PrimitiveExpression":
      return makeTrapExpression(
        {
          type: "primitive.after",
          value: unpackPrimitive(node.primitive),
          serial: node.tag.serial,
        },
        options,
      );
    case "IntrinsicExpression":
      return makeTrapExpression(
        {
          type: "intrinsic.after",
          name: node.intrinsic,
          value: makeIntrinsicExpression(node.intrinsic),
          serial: node.tag.serial,
        },
        options,
      );
    case "ImportExpression":
      return makeTrapExpression(
        {
          type: "import.after",
          source: node.source,
          specifier: node.import,
          value: makeImportExpression(node.source, node.import),
          serial: node.tag.serial,
        },
        options,
      );
    case "ReadExpression":
      return makeTrapExpression(
        {
          type: "read.after",
          variable: node.variable,
          value: makeReadExpression(
            isParameter(node.variable)
              ? node.variable
              : mangleOriginalVariable(node.variable),
          ),
          serial: node.tag.serial,
        },
        options,
      );
    case "ReadEnclaveExpression":
      return reduceReverse(
        listTrapEffect(
          {
            type: "enclave.read.before",
            variable: node.variable,
            serial: node.tag.serial,
          },
          options,
        ),
        makeFlipSequenceExpression,
        makeTrapExpression(
          {
            type: "enclave.read.after",
            variable: node.variable,
            value: makeReadEnclaveExpression(node.variable),
            serial: node.tag.serial,
          },
          options,
        ),
      );
    case "TypeofEnclaveExpression":
      return reduceReverse(
        listTrapEffect(
          {
            type: "enclave.typeof.before",
            variable: node.variable,
            serial: node.tag.serial,
          },
          options,
        ),
        makeFlipSequenceExpression,
        makeTrapExpression(
          {
            type: "enclave.typeof.after",
            variable: node.variable,
            value: makeTypeofEnclaveExpression(node.variable),
            serial: node.tag.serial,
          },
          options,
        ),
      );
    case "FunctionExpression": {
      const variable = mangleCalleeVariable(path);
      const expression = makeTrapExpression(
        {
          type: "function.after",
          kind: node.kind,
          asynchronous: node.asynchronous,
          generator: node.generator,
          value: makeFunctionExpression(
            node.kind,
            node.asynchronous,
            node.generator,
            weaveClosureBlock(node.body, `${path}1`, options, {
              type: "function",
              kind: node.kind,
              callee: variable,
            }),
          ),
          serial: node.tag.serial,
        },
        options,
      );
      return includes(expression.tag, variable)
        ? makeSequenceExpression(
            makeWriteEffect(variable, expression),
            makeReadExpression(variable),
          )
        : expression;
    }
    case "SequenceExpression":
      return reduceReverse(
        weaveEffect(node.head, `${path}1`, options),
        makeFlipSequenceExpression,
        weaveExpression(node.tail, `${path}2`, options),
      );
    case "ConditionalExpression":
      return makeTrapExpression(
        {
          type: "conditional.after",
          value: makeConditionalExpression(
            makeTrapExpression(
              {
                type: "conditional.before",
                value: weaveExpression(node.condition, `${path}1`, options),
                serial: node.tag.serial,
              },
              options,
            ),
            weaveExpression(node.consequent, `${path}2`, options),
            weaveExpression(node.alternate, `${path}3`, options),
          ),
          serial: node.tag.serial,
        },
        options,
      );
    case "AwaitExpression":
      return makeTrapExpression(
        {
          type: "await.after",
          value: makeAwaitExpression(
            makeTrapExpression(
              {
                type: "await.before",
                value: weaveExpression(node.promise, `${path}1`, options),
                serial: node.tag.serial,
              },
              options,
            ),
          ),
          serial: node.tag.serial,
        },
        options,
      );
    case "YieldExpression":
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
                value: weaveExpression(node.item, `${path}1`, options),
                serial: node.tag.serial,
              },
              options,
            ),
          ),
          serial: node.tag.serial,
        },
        options,
      );
    case "EvalExpression":
      if (node.tag.context === null) {
        throw new Error("missing context on eval call expression");
      }
      return makeTrapExpression(
        {
          type: "eval.after",
          value: makeEvalExpression(
            makeTrapExpression(
              {
                type: "eval.before",
                value: weaveExpression(node.code, `${path}1`, options),
                context: node.tag.context,
                serial: node.tag.serial,
              },
              options,
            ),
          ),
          serial: node.tag.serial,
        },
        options,
      );
    case "ApplyExpression":
      return makeTrapExpression(
        {
          type: "apply",
          callee: weaveExpression(node.callee, `${path}1`, options),
          this: weaveExpression(node.this, `${path}2`, options),
          arguments: map(enumerate(node.arguments.length), (index) =>
            weaveExpression(
              node.arguments[index],
              `${path}3_${index}`,
              options,
            ),
          ),
          serial: node.tag.serial,
        },
        options,
      );
    case "ConstructExpression":
      return makeTrapExpression(
        {
          type: "construct",
          callee: weaveExpression(node.callee, `${path}1`, options),
          arguments: map(enumerate(node.arguments.length), (index) =>
            weaveExpression(
              node.arguments[index],
              `${path}2_${index}`,
              options,
            ),
          ),
          serial: node.tag.serial,
        },
        options,
      );
    default:
      throw new StaticError("invalid expression node", node);
  }
};
