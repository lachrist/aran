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

import { getNodeTag, isParameter, unpackPrimitive } from "../node.mjs";

import {
  makeBreakStatement,
  makeDebuggerStatement,
  makeImportExpression,
  makeIntrinsicExpression,
  makeReadEnclaveExpression,
  makeTypeofEnclaveExpression,
  makeAwaitExpression,
  makeBlockStatement,
  makeClosureExpression,
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
 * @typedef {import("./advice.d.ts").Point<S>} Point
 */

/**
 * @template S
 * @typedef {import("./advice.d.ts").Pointcut<S>} Pointcut
 */

/** @typedef {import("./advice.d.ts").LinkData} LinkData */

/** @typedef {import("./advice.d.ts").BlockKind} BlockKind */

/**
 * @template S
 * @typedef {{
 *   advice: weave.Expression,
 *   pointcut: Pointcut<S>,
 *   inline: boolean,
 * }} Options
 */

/**
 * @typedef {{
 *   type: "closure",
 *   kind: aran.ClosureKind,
 *   callee: weave.Variable,
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
  undefined,
  Object: { fromEntries: reduceEntry },
} = globalThis;

/**
 * @type {(
 *   expression: weave.Expression,
 *   effect: weave.Effect,
 * ) => weave.Expression}
 */
const makeFlipSequenceExpression = (expression, effect) =>
  makeSequenceExpression(effect, expression);

/////////////
// Program //
/////////////

/**
 * @type {<S extends Json>(
 *   node: unbuild.Program<S>,
 *   options: {
 *     advice: estree.Variable,
 *     escape: estree.Variable,
 *     inline: boolean,
 *     pointcut: Pointcut<S>,
 *   },
 * ) => weave.Program}
 */
export const instrumentProgram = (
  node,
  { escape, advice, inline, pointcut },
) => {
  const options = {
    advice: makeReadEnclaveExpression(advice),
    inline,
    pointcut,
  };
  switch (node.type) {
    case "EvalProgram":
      return makeEvalProgram(
        instrumentClosureBlock(node.body, "", options, {
          type: "program",
          kind: "eval",
          links: [],
        }),
      );
    case "ModuleProgram":
      return makeModuleProgram(
        map(node.links, instrumentLink),
        instrumentClosureBlock(node.body, "", options, {
          type: "program",
          kind: "module",
          links: map(node.links, serializeLink),
        }),
      );
    case "ScriptProgram":
      return makeScriptProgram(
        escapePseudoBlock(
          instrumentPseudoBlock(node.body, "", options, {
            type: "program",
            kind: "script",
            links: [],
          }),
          escape,
        ),
      );
    default:
      throw new StaticError("invalid program node", node);
  }
};

//////////
// Link //
//////////

/** @type {<S>(node: unbuild.Link<S>) => weave.Link} */
const instrumentLink = (node) => {
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

/** @type {<S>(node: unbuild.Link<S>) => LinkData} */
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
  } else if (parent.type === "closure") {
    if (parent.kind === "arrow") {
      return ["function.arguments"];
    } else if (parent.kind === "method") {
      return ["this", "function.arguments"];
    } else if (parent.kind === "function" || parent.kind === "constructor") {
      return ["this", "new.target", "function.arguments"];
    } else {
      throw new StaticError("invalid closure kind", parent.kind);
    }
  } else {
    throw new StaticError("invalid parent", parent);
  }
};

/** @type {(parameter: aran.Parameter) => [aran.Parameter | unbuild.Variable, weave.Expression]} */
const makeParameterEntry = (parameter) => [
  parameter,
  makeReadExpression(parameter),
];

/** @type {(variable: unbuild.Variable) => [aran.Parameter | unbuild.Variable, weave.Expression]} */
const makeVariableEntry = (variable) => [
  variable,
  makePrimitiveExpression({ undefined: null }),
];

/**
 * @type {<S>(
 *   parent: Parent,
 *   labels: aran.Label[],
 *   variables: unbuild.Variable[],
 *   serial: S,
 * ) => Point<S> & { type: "program.enter" | "closure.enter" | "block.enter" }}
 */
const makeEnterPoint = (parent, labels, variables, serial) => {
  const frame =
    /** @type {{[key in aran.Parameter | unbuild.Variable]: weave.Expression}} */ (
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
    case "closure":
      return {
        type: "closure.enter",
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
 *   completion: weave.Expression,
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
    case "closure":
      return {
        type: "closure.completion",
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
    case "closure":
      return {
        type: "closure.failure",
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
    case "closure":
      return {
        type: "closure.leave",
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

/** @type {(variable: weave.Variable, variables: unbuild.Variable[]) => boolean} */
const isBound = (variable, variables) => {
  const original = unmangleOriginalVariable(variable);
  return original === null || includes(variables, original);
};

/** @type {(variable: weave.Variable) => weave.Effect[]} */
const listSerialInitializeEffect = (variable) => {
  const serial = unmangleSerialVariable(variable);
  return serial === undefined
    ? []
    : [makeWriteEffect(variable, makeJsonExpression(serial))];
};

/**
 * @type {<S extends Json>(
 *   node: unbuild.ClosureBlock<S>,
 *   path: string,
 *   options: Options<S>,
 *   parent: Parent & { type: "program" | "closure" },
 * ) => weave.ClosureBlock}
 */
const instrumentClosureBlock = (node, path, options, parent) => {
  const closure = trapClosureBlock(
    {
      statements: [
        ...map(
          listEnterTrapEffect(
            makeEnterPoint(parent, [], node.variables, node.tag),
            options,
          ),
          makeEffectStatement,
        ),
        ...flatMap(enumerate(node.statements.length), (index) =>
          instrumentStatement(
            node.statements[index],
            `${path}_${index}`,
            options,
          ),
        ),
      ],
      completion: makeTrapExpression(
        makeCompletionPoint(
          parent,
          instrumentExpression(node.completion, `${path}_c`, options),
          node.tag,
        ),
        options,
      ),
    },
    {
      catch: makeFailurePoint(parent, node.tag),
      finally: makeLeavePoint(parent, node.tag),
    },
    options,
  );
  const variables = filter(
    removeDuplicate([
      ...flatMap(closure.statements, getNodeTag),
      ...closure.completion.tag,
    ]),
    (variable) => isBound(variable, node.variables),
  );
  return makeClosureBlock(
    parent.type === "closure" ? remove(variables, parent.callee) : variables,
    [
      ...map(
        flatMap(variables, listSerialInitializeEffect),
        makeEffectStatement,
      ),
      ...closure.statements,
    ],
    closure.completion,
  );
};

/**
 * @type {<S extends Json>(
 *   node: unbuild.ControlBlock<S>,
 *   path: string,
 *   options: Options<S>,
 *   parent: Parent,
 * ) => weave.ControlBlock}
 */
const instrumentControlBlock = (node, path, options, parent) => {
  const statements = trapControlBlock(
    [
      ...map(
        listEnterTrapEffect(
          makeEnterPoint(parent, node.labels, node.variables, node.tag),
          options,
        ),
        makeEffectStatement,
      ),
      ...flatMap(enumerate(node.statements.length), (index) =>
        instrumentStatement(
          node.statements[index],
          `${path}_${index}`,
          options,
        ),
      ),
      ...map(
        listTrapEffect(
          makeCompletionPoint(
            parent,
            makePrimitiveExpression({ undefined: null }),
            node.tag,
          ),
          options,
        ),
        makeEffectStatement,
      ),
    ],
    {
      catch: makeFailurePoint(parent, node.tag),
      finally: makeLeavePoint(parent, node.tag),
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
 *   node: unbuild.PseudoBlock<S>,
 *   path: string,
 *   options: Options<S>,
 *   parent: Parent,
 * ) => weave.PseudoBlock}
 */
const instrumentPseudoBlock = (node, path, options, parent) => {
  const statements = flatMap(enumerate(node.statements.length), (index) =>
    instrumentStatement(node.statements[index], `${path}_${index}`, options),
  );
  return makePseudoBlock(
    [
      ...map(
        flatMap(flatMap(statements, getNodeTag), listSerialInitializeEffect),
        makeEffectStatement,
      ),
      ...map(
        listEnterTrapEffect(makeEnterPoint(parent, [], [], node.tag), options),
        makeEffectStatement,
      ),
      ...statements,
    ],
    makeTrapExpression(
      makeCompletionPoint(
        parent,
        instrumentExpression(node.completion, `${path}_completion`, options),
        node.tag,
      ),
      options,
    ),
  );
};

///////////////
// Statement //
///////////////

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   node: unbuild.Statement<S>,
 *   path: string,
 *   options: Options<S>
 * ) => weave.Statement[]}
 */
const instrumentStatement = (node, path, options) => {
  switch (node.type) {
    case "EffectStatement":
      return map(
        instrumentEffect(node.inner, `${path}1`, options),
        makeEffectStatement,
      );
    case "ReturnStatement":
      return [
        makeReturnStatement(
          makeTrapExpression(
            {
              type: "return.before",
              value: instrumentExpression(node.result, `${path}1`, options),
              serial: node.tag,
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
              value: instrumentExpression(node.right, `${path}1`, options),
              serial: node.tag,
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
              serial: node.tag,
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
              serial: node.tag,
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
              serial: node.tag,
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
              serial: node.tag,
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
          instrumentControlBlock(node.do, `${path}1`, options, {
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
              value: instrumentExpression(node.if, `${path}1`, options),
              serial: node.tag,
            },
            options,
          ),
          instrumentControlBlock(node.then, `${path}2`, options, {
            type: "block",
            kind: "then",
          }),
          instrumentControlBlock(node.else, `${path}3`, options, {
            type: "block",
            kind: "else",
          }),
        ),
        ...map(
          listTrapEffect(
            {
              type: "branch.after",
              kind: "if",
              serial: node.tag,
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
              value: instrumentExpression(node.while, `${path}1`, options),
              serial: node.tag,
            },
            options,
          ),
          instrumentControlBlock(node.do, `${path}2`, options, {
            type: "block",
            kind: "loop",
          }),
        ),
      ];
    case "TryStatement":
      return [
        makeTryStatement(
          instrumentControlBlock(node.try, `${path}1`, options, {
            type: "block",
            kind: "try",
          }),
          instrumentControlBlock(node.catch, `${path}2`, options, {
            type: "block",
            kind: "catch",
          }),
          instrumentControlBlock(node.finally, `${path}3`, options, {
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
 *   node: unbuild.Effect<S>,
 *   path: string,
 *   options: Options<S>
 * ) => weave.Effect[]}
 */
const instrumentEffect = (node, path, options) => {
  switch (node.type) {
    case "ExpressionEffect":
      return [
        makeExpressionEffect(
          makeTrapExpression(
            {
              type: "drop.before",
              value: instrumentExpression(node.discard, `${path}1`, options),
              serial: node.tag,
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
              value: instrumentExpression(node.condition, `${path}1`, options),
              serial: node.tag,
            },
            options,
          ),
          flatMap(enumerate(node.positive.length), (index) =>
            instrumentEffect(
              node.positive[index],
              `${path}p_${index}`,
              options,
            ),
          ),
          flatMap(enumerate(node.negative.length), (index) =>
            instrumentEffect(
              node.negative[index],
              `${path}n_${index}`,
              options,
            ),
          ),
        ),
        ...listTrapEffect(
          {
            type: "branch.after",
            kind: "conditional",
            serial: node.tag,
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
              value: instrumentExpression(node.right, `${path}1`, options),
              serial: node.tag,
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
              value: instrumentExpression(node.right, `${path}1`, options),
              serial: node.tag,
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
              value: instrumentExpression(node.right, `${path}1`, options),
              serial: node.tag,
            },
            options,
          ),
        ),
        ...listTrapEffect(
          {
            type: "enclave.write.after",
            variable: node.variable,
            serial: node.tag,
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
 *   node: unbuild.Expression<S>,
 *   path: string,
 *   options: Options<S>
 * ) => weave.Expression}
 */
export const instrumentExpression = (node, path, options) => {
  switch (node.type) {
    case "PrimitiveExpression":
      return makeTrapExpression(
        {
          type: "primitive.after",
          value: unpackPrimitive(node.primitive),
          serial: node.tag,
        },
        options,
      );
    case "IntrinsicExpression":
      return makeTrapExpression(
        {
          type: "intrinsic.after",
          name: node.intrinsic,
          value: makeIntrinsicExpression(node.intrinsic),
          serial: node.tag,
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
          serial: node.tag,
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
          serial: node.tag,
        },
        options,
      );
    case "ReadEnclaveExpression":
      return reduceReverse(
        listTrapEffect(
          {
            type: "enclave.read.before",
            variable: node.variable,
            serial: node.tag,
          },
          options,
        ),
        makeFlipSequenceExpression,
        makeTrapExpression(
          {
            type: "enclave.read.after",
            variable: node.variable,
            value: makeReadEnclaveExpression(node.variable),
            serial: node.tag,
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
            serial: node.tag,
          },
          options,
        ),
        makeFlipSequenceExpression,
        makeTrapExpression(
          {
            type: "enclave.typeof.after",
            variable: node.variable,
            value: makeTypeofEnclaveExpression(node.variable),
            serial: node.tag,
          },
          options,
        ),
      );
    case "ClosureExpression": {
      const variable = mangleCalleeVariable(path);
      const expression = makeTrapExpression(
        {
          type: "closure.after",
          kind: node.kind,
          asynchronous: node.asynchronous,
          generator: node.generator,
          value: makeClosureExpression(
            node.kind,
            node.asynchronous,
            node.generator,
            instrumentClosureBlock(node.body, `${path}1`, options, {
              type: "closure",
              kind: node.kind,
              callee: variable,
            }),
          ),
          serial: node.tag,
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
        instrumentEffect(node.head, `${path}1`, options),
        makeFlipSequenceExpression,
        instrumentExpression(node.tail, `${path}2`, options),
      );
    case "ConditionalExpression":
      return makeTrapExpression(
        {
          type: "conditional.after",
          value: makeConditionalExpression(
            makeTrapExpression(
              {
                type: "conditional.before",
                value: instrumentExpression(
                  node.condition,
                  `${path}1`,
                  options,
                ),
                serial: node.tag,
              },
              options,
            ),
            instrumentExpression(node.consequent, `${path}2`, options),
            instrumentExpression(node.alternate, `${path}3`, options),
          ),
          serial: node.tag,
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
                value: instrumentExpression(node.promise, `${path}1`, options),
                serial: node.tag,
              },
              options,
            ),
          ),
          serial: node.tag,
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
                value: instrumentExpression(node.item, `${path}1`, options),
                serial: node.tag,
              },
              options,
            ),
          ),
          serial: node.tag,
        },
        options,
      );
    case "EvalExpression":
      return makeTrapExpression(
        {
          type: "eval.after",
          value: makeEvalExpression(
            makeTrapExpression(
              {
                type: "eval.before",
                value: instrumentExpression(node.code, `${path}1`, options),
                serial: node.tag,
              },
              options,
            ),
          ),
          serial: node.tag,
        },
        options,
      );
    case "ApplyExpression":
      return makeTrapExpression(
        {
          type: "apply",
          callee: instrumentExpression(node.callee, `${path}1`, options),
          this: instrumentExpression(node.this, `${path}2`, options),
          arguments: map(enumerate(node.arguments.length), (index) =>
            instrumentExpression(
              node.arguments[index],
              `${path}3_${index}`,
              options,
            ),
          ),
          serial: node.tag,
        },
        options,
      );
    case "ConstructExpression":
      return makeTrapExpression(
        {
          type: "construct",
          callee: instrumentExpression(node.callee, `${path}1`, options),
          arguments: map(enumerate(node.arguments.length), (index) =>
            instrumentExpression(
              node.arguments[index],
              `${path}2_${index}`,
              options,
            ),
          ),
          serial: node.tag,
        },
        options,
      );
    default:
      throw new StaticError("invalid expression node", node);
  }
};
