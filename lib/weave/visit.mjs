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
  makeReadGlobalExpression,
  makeTypeofGlobalExpression,
  makeAwaitExpression,
  makeBlockStatement,
  makeFunctionExpression,
  makeConditionalExpression,
  makeDeclareGlobalStatement,
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
  makeWriteGlobalEffect,
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
 * @template L
 * @typedef {(
 *   import("../../type/advice.js").Point<aran.Expression<weave.ResAtom>, L>
 * )} Point
 */

/**
 * @template L
 * @typedef {import("../../type/advice.js").Pointcut<L>} Pointcut
 */

/** @typedef {import("../../type/advice.js").LinkData} LinkData */

/** @typedef {import("../../type/advice.js").BlockKind} BlockKind */

/**
 * @template S
 * @template L
 * @typedef {{
 *   root: unbuild.Root,
 *   advice: aran.Expression<weave.ResAtom>,
 *   pointcut: Pointcut<L>,
 *   locate: (root: unbuild.Root, origin: S, target: weave.Path) => L,
 *   location: "inline" | "extract",
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

/**
 * @type {<
 *   S,
 *   N extends aran.Node<weave.ArgAtom<S>>,
 *   K extends (string & keyof N)
 * >(
 *   pair: {node: N, path: weave.Path},
 *   key: K,
 * ) => {node: N[K], path: weave.Path}}
 */
const birth = ({ node, path }, key) => ({
  node: node[key],
  path: /** @type {weave.Path} */ (`${path}.${key}`),
});

/**
 * @type {<
 *   S,
 *   N extends aran.Node<weave.ArgAtom<S>>,
 * >(
 *   pair: {node: N[], path: weave.Path},
 *   index: number,
 * ) => {node: N, path: weave.Path}}
 */
const birthArray = ({ node: nodes, path }, index) => ({
  node: nodes[index],
  path: /** @type {weave.Path} */ (`${path}.${index}`),
});

/////////////
// Program //
/////////////

/**
 * @type {<S, L extends Json>(
 *   pair: {
 *     node: aran.Program<weave.ArgAtom<S>>,
 *     path: weave.Path,
 *   },
 *   options: Options<S, L>,
 * ) => aran.Program<weave.ResAtom>}
 */
export const weaveProgram = ({ node, path }, options) => {
  switch (node.type) {
    case "EvalProgram":
      return makeEvalProgram(
        weaveClosureBlock(birth({ node, path }, "body"), options, {
          type: "program",
          kind: "eval",
          links: [],
        }),
      );
    case "ModuleProgram":
      return makeModuleProgram(
        map(node.links, weaveLink),
        weaveClosureBlock(birth({ node, path }, "body"), options, {
          type: "program",
          kind: "module",
          links: map(node.links, serializeLink),
        }),
      );
    case "ScriptProgram":
      return makeScriptProgram(
        escapePseudoBlock(
          weavePseudoBlock(birth({ node, path }, "body"), options, {
            type: "program",
            kind: "script",
            links: [],
          }),
          options.root,
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
 * @type {<L>(
 *   parent: Parent,
 *   labels: weave.Label[],
 *   variables: weave.ArgVariable[],
 *   location: L,
 * ) => Point<L> & { type: "program.enter" | "function.enter" | "block.enter" }}
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
    case "program":
      return {
        type: "program.enter",
        kind: parent.kind,
        links: parent.links,
        record,
        location,
      };
    case "function":
      return {
        type: "function.enter",
        kind: parent.kind,
        callee: makeReadExpression(parent.callee),
        record,
        location,
      };
    case "block":
      return {
        type: "block.enter",
        kind: parent.kind,
        labels,
        record,
        location,
      };
    default:
      throw new StaticError("invalid parent", parent);
  }
};

/**
 * @type {<L>(
 *   parent: Parent,
 *   completion: aran.Expression<weave.ResAtom>,
 *   location: L,
 * ) => Point<L>}
 */
const makeCompletionPoint = (parent, completion, location) => {
  switch (parent.type) {
    case "program":
      return {
        type: "program.completion",
        kind: parent.kind,
        value: completion,
        location,
      };
    case "function":
      return {
        type: "function.completion",
        kind: parent.kind,
        value: completion,
        location,
      };
    case "block":
      return {
        type: "block.completion",
        kind: parent.kind,
        location,
      };
    default:
      throw new StaticError("invalid parent", parent);
  }
};

/** @type {<L>(parent: Parent, location: L) => Point<L>} */
const makeFailurePoint = (parent, location) => {
  switch (parent.type) {
    case "program":
      return {
        type: "program.failure",
        kind: parent.kind,
        value: makeReadExpression("catch.error"),
        location,
      };
    case "function":
      return {
        type: "function.failure",
        kind: parent.kind,
        value: makeReadExpression("catch.error"),
        location,
      };
    case "block":
      return {
        type: "block.failure",
        kind: parent.kind,
        value: makeReadExpression("catch.error"),
        location,
      };
    default:
      throw new StaticError("invalid parent", parent);
  }
};

/** @type {<L>(parent: Parent, location: L) => Point<L>} */
const makeLeavePoint = (parent, location) => {
  switch (parent.type) {
    case "program":
      return {
        type: "program.leave",
        kind: parent.kind,
        location,
      };
    case "function":
      return {
        type: "function.leave",
        kind: parent.kind,
        location,
      };
    case "block":
      return {
        type: "block.leave",
        kind: parent.kind,
        location,
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
 * @type {<S, L extends Json>(
 *   pair: {
 *     node: aran.ClosureBlock<weave.ArgAtom<S>>,
 *     path: weave.Path,
 *   },
 *   options: Options<S, L>,
 *   parent: Parent & { type: "program" | "function" },
 * ) => aran.ClosureBlock<weave.ResAtom>}
 */
const weaveClosureBlock = ({ node, path }, options, parent) => {
  const { locate } = options;
  const location = locate(options.root, node.tag.serial, path);
  const block = trapClosureBlock(
    {
      statements: [
        ...map(
          listEnterTrapEffect(
            makeEnterPoint(parent, [], node.variables, location),
            options,
          ),
          makeEffectStatement,
        ),
        ...flatMap(enumerate(node.statements.length), (index) =>
          weaveStatement(
            birthArray(birth({ node, path }, "statements"), index),
            options,
          ),
        ),
      ],
      completion: makeTrapExpression(
        makeCompletionPoint(
          parent,
          weaveExpression(birth({ node, path }, "completion"), options),
          location,
        ),
        options,
      ),
    },
    {
      catch: makeFailurePoint(parent, location),
      finally: makeLeavePoint(parent, location),
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
 * @type {<S, L extends Json>(
 *   pair: {
 *     node: aran.ControlBlock<weave.ArgAtom<S>>,
 *     path: weave.Path,
 *   },
 *   options: Options<S, L>,
 *   parent: Parent,
 * ) => aran.ControlBlock<weave.ResAtom>}
 */
const weaveControlBlock = ({ node, path }, options, parent) => {
  const { locate } = options;
  const location = locate(options.root, node.tag.serial, path);
  const statements = trapControlBlock(
    [
      ...map(
        listEnterTrapEffect(
          makeEnterPoint(parent, node.labels, node.variables, location),
          options,
        ),
        makeEffectStatement,
      ),
      ...flatMap(enumerate(node.statements.length), (index) =>
        weaveStatement(
          birthArray(birth({ node, path }, "statements"), index),
          options,
        ),
      ),
      ...map(
        listTrapEffect(
          makeCompletionPoint(
            parent,
            makePrimitiveExpression({ undefined: null }),
            location,
          ),
          options,
        ),
        makeEffectStatement,
      ),
    ],
    {
      catch: makeFailurePoint(parent, location),
      finally: makeLeavePoint(parent, location),
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
 * @type {<S, L extends Json>(
 *   pair: {
 *     node: aran.PseudoBlock<weave.ArgAtom<S>>,
 *     path: weave.Path,
 *   },
 *   options: Options<S, L>,
 *   parent: Parent,
 * ) => aran.PseudoBlock<weave.ResAtom>}
 */
const weavePseudoBlock = ({ node, path }, options, parent) => {
  const { locate } = options;
  const location = locate(options.root, node.tag.serial, path);
  const statements = flatMap(enumerate(node.statements.length), (index) =>
    weaveStatement(
      birthArray(birth({ node, path }, "statements"), index),
      options,
    ),
  );
  return makePseudoBlock(
    [
      ...map(
        flatMap(flatMap(statements, getNodeTag), listSerialInitializeEffect),
        makeEffectStatement,
      ),
      ...map(
        listEnterTrapEffect(makeEnterPoint(parent, [], [], location), options),
        makeEffectStatement,
      ),
      ...statements,
    ],
    makeTrapExpression(
      makeCompletionPoint(
        parent,
        weaveExpression(birth({ node, path }, "completion"), options),
        location,
      ),
      options,
    ),
  );
};

///////////////
// Statement //
///////////////

/**
 * @type {<S, L extends Json>(
 *   pair: {
 *     node: aran.Statement<weave.ArgAtom<S>>,
 *     path: weave.Path,
 *   },
 *   options: Options<S, L>
 * ) => aran.Statement<weave.ResAtom>[]}
 */
const weaveStatement = ({ node, path }, options) => {
  const { locate } = options;
  const location = locate(options.root, node.tag.serial, path);
  switch (node.type) {
    case "EffectStatement":
      return map(
        weaveEffect(birth({ node, path }, "inner"), options),
        makeEffectStatement,
      );
    case "ReturnStatement":
      return [
        makeReturnStatement(
          makeTrapExpression(
            {
              type: "return.before",
              value: weaveExpression(birth({ node, path }, "result"), options),
              location,
            },
            options,
          ),
        ),
      ];
    case "DeclareGlobalStatement": {
      return [
        makeDeclareGlobalStatement(
          node.kind,
          node.variable,
          makeTrapExpression(
            {
              type: "global.declare.before",
              kind: node.kind,
              variable: node.variable,
              value: weaveExpression(birth({ node, path }, "right"), options),
              location,
            },
            options,
          ),
        ),
        ...map(
          listTrapEffect(
            {
              type: "global.declare.after",
              kind: node.kind,
              variable: node.variable,
              location,
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
              location,
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
              location,
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
              location,
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
          weaveControlBlock(birth({ node, path }, "do"), options, {
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
              value: weaveExpression(birth({ node, path }, "if"), options),
              location,
            },
            options,
          ),
          weaveControlBlock(birth({ node, path }, "then"), options, {
            type: "block",
            kind: "then",
          }),
          weaveControlBlock(birth({ node, path }, "else"), options, {
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
              value: weaveExpression(birth({ node, path }, "while"), options),
              location,
            },
            options,
          ),
          weaveControlBlock(birth({ node, path }, "do"), options, {
            type: "block",
            kind: "loop",
          }),
        ),
      ];
    case "TryStatement":
      return [
        makeTryStatement(
          weaveControlBlock(birth({ node, path }, "try"), options, {
            type: "block",
            kind: "try",
          }),
          weaveControlBlock(birth({ node, path }, "catch"), options, {
            type: "block",
            kind: "catch",
          }),
          weaveControlBlock(birth({ node, path }, "finally"), options, {
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
 * @type {<S, L extends Json>(
 *   pair: {
 *     node: aran.Effect<weave.ArgAtom<S>>,
 *     path: weave.Path,
 *   },
 *   options: Options<S, L>
 * ) => aran.Effect<weave.ResAtom>[]}
 */
const weaveEffect = ({ node, path }, options) => {
  const { locate } = options;
  const location = locate(options.root, node.tag.serial, path);
  switch (node.type) {
    case "ExpressionEffect":
      return [
        makeExpressionEffect(
          makeTrapExpression(
            {
              type: "drop.before",
              value: weaveExpression(birth({ node, path }, "discard"), options),
              location,
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
              value: weaveExpression(
                birth({ node, path }, "condition"),
                options,
              ),
              location,
            },
            options,
          ),
          flatMap(enumerate(node.positive.length), (index) =>
            weaveEffect(
              birthArray(birth({ node, path }, "positive"), index),
              options,
            ),
          ),
          flatMap(enumerate(node.negative.length), (index) =>
            weaveEffect(
              birthArray(birth({ node, path }, "negative"), index),
              options,
            ),
          ),
        ),
        ...listTrapEffect(
          {
            type: "branch.after",
            kind: "conditional",
            location,
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
              value: weaveExpression(birth({ node, path }, "right"), options),
              location,
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
              value: weaveExpression(birth({ node, path }, "right"), options),
              location,
            },
            options,
          ),
        ),
      ];
    case "WriteGlobalEffect":
      return [
        makeWriteGlobalEffect(
          node.variable,
          makeTrapExpression(
            {
              type: "global.write.before",
              variable: node.variable,
              value: weaveExpression(birth({ node, path }, "right"), options),
              location,
            },
            options,
          ),
        ),
        ...listTrapEffect(
          {
            type: "global.write.after",
            variable: node.variable,
            location,
          },
          options,
        ),
      ];
    default:
      throw new StaticError("invalid effect node", node);
  }
};

/**
 * @type {<S, L extends Json>(
 *   pair: {
 *     node: aran.Expression<weave.ArgAtom<S>>,
 *     path: weave.Path,
 *   },
 *   options: Options<S, L>
 * ) => aran.Expression<weave.ResAtom>}
 */
export const weaveExpression = ({ node, path }, options) => {
  const { locate } = options;
  const location = locate(options.root, node.tag.serial, path);
  switch (node.type) {
    case "PrimitiveExpression":
      return makeTrapExpression(
        {
          type: "primitive.after",
          value: unpackPrimitive(node.primitive),
          location,
        },
        options,
      );
    case "IntrinsicExpression":
      return makeTrapExpression(
        {
          type: "intrinsic.after",
          name: node.intrinsic,
          value: makeIntrinsicExpression(node.intrinsic),
          location,
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
          location,
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
          location,
        },
        options,
      );
    case "ReadGlobalExpression":
      return reduceReverse(
        listTrapEffect(
          {
            type: "global.read.before",
            variable: node.variable,
            location,
          },
          options,
        ),
        makeFlipSequenceExpression,
        makeTrapExpression(
          {
            type: "global.read.after",
            variable: node.variable,
            value: makeReadGlobalExpression(node.variable),
            location,
          },
          options,
        ),
      );
    case "TypeofGlobalExpression":
      return reduceReverse(
        listTrapEffect(
          {
            type: "global.typeof.before",
            variable: node.variable,
            location,
          },
          options,
        ),
        makeFlipSequenceExpression,
        makeTrapExpression(
          {
            type: "global.typeof.after",
            variable: node.variable,
            value: makeTypeofGlobalExpression(node.variable),
            location,
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
            weaveClosureBlock(birth({ node, path }, "body"), options, {
              type: "function",
              kind: node.kind,
              callee: variable,
            }),
          ),
          location,
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
        weaveEffect(birth({ node, path }, "head"), options),
        makeFlipSequenceExpression,
        weaveExpression(birth({ node, path }, "tail"), options),
      );
    case "ConditionalExpression":
      return makeTrapExpression(
        {
          type: "conditional.after",
          value: makeConditionalExpression(
            makeTrapExpression(
              {
                type: "conditional.before",
                value: weaveExpression(
                  birth({ node, path }, "condition"),
                  options,
                ),
                location,
              },
              options,
            ),
            weaveExpression(birth({ node, path }, "consequent"), options),
            weaveExpression(birth({ node, path }, "alternate"), options),
          ),
          location,
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
                value: weaveExpression(
                  birth({ node, path }, "promise"),
                  options,
                ),
                location,
              },
              options,
            ),
          ),
          location,
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
                value: weaveExpression(birth({ node, path }, "item"), options),
                location,
              },
              options,
            ),
          ),
          location,
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
                value: weaveExpression(birth({ node, path }, "code"), options),
                context: node.tag.context,
                location,
              },
              options,
            ),
          ),
          location,
        },
        options,
      );
    case "ApplyExpression":
      return makeTrapExpression(
        {
          type: "apply",
          callee: weaveExpression(birth({ node, path }, "callee"), options),
          this: weaveExpression(birth({ node, path }, "this"), options),
          arguments: map(enumerate(node.arguments.length), (index) =>
            weaveExpression(
              birthArray(birth({ node, path }, "arguments"), index),
              options,
            ),
          ),
          location,
        },
        options,
      );
    case "ConstructExpression":
      return makeTrapExpression(
        {
          type: "construct",
          callee: weaveExpression(birth({ node, path }, "callee"), options),
          arguments: map(enumerate(node.arguments.length), (index) =>
            weaveExpression(
              birthArray(birth({ node, path }, "arguments"), index),
              options,
            ),
          ),
          location,
        },
        options,
      );
    default:
      throw new StaticError("invalid expression node", node);
  }
};
