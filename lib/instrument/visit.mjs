/* eslint-disable no-use-before-define */

import {
  StaticError,
  map,
  flatMap,
  reduceReverse,
  enumerate,
} from "../util/index.mjs";

import { PARAMETER_ENUM, unpackPrimitive } from "../deconstruct/syntax.mjs";

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
  makeParameterExpression,
  makePrimitiveExpression,
  makeReturnStatement,
  makeSequenceExpression,
  makeTryStatement,
  makeWhileStatement,
  makeWriteEnclaveEffect,
  makeYieldExpression,
} from "./syntax.mjs";

import { makeObjectExpression } from "./intrinsic.mjs";

import {
  makeNewReadExpression,
  makeOldReadExpression,
  makeNewWriteEffect,
  makeOldWriteEffect,
  makeLayerPseudoBlock,
  hasNewVariable,
} from "../../new_graveyard/usage.mjs";

import { mangleCalleeVariable, mangleParameterVariable } from "./mangle.mjs";

import {
  listParameterTrapStatement,
  listTrapStatement,
  listTrapEffect,
  makeTrapClosureBlock,
  makeTrapControlBlock,
  makeTrapExpression,
} from "./trap.mjs";

const {
  undefined,
  Object: { fromEntries: reduceEntry },
} = globalThis;

/**
 * @template S, L, V
 * @typedef {{
 *   pointcut: Pointcut<S, L, V>,
 *   advice: Variable,
 *   escape: string,
 *   inline: {
 *     variable: boolean,
 *     label: boolean,
 *     serial: boolean,
 *   },
 *   parseLabel: (label: string) => L,
 *   parseVariable: (variable: string) => V,
 *   stringifyLabel: (label: L) => Label,
 *   stringifyVariable: (variable: V) => Variable,
 * }} Context
 */

///////////
// Other //
///////////

/** @type {<X>(x: X) => [x, boolean]} */
const makeTrueEntry = (x) => [x, true];

/** @type {<X>(x: X) => [x, boolean]} */
const makeFalseEntry = (x) => [x, false];

const OVERWRITTEN = /** @type {Record<Parameter, boolean>} */ (
  reduceEntry(map(PARAMETER_ENUM, makeFalseEntry))
);

/**
 * @type {(
 *   expression: Expression<Usage>,
 *   effect: Effect<Usage>,
 * ) => Expression<Usage>}
 */
const makeFlipSequenceExpression = (expression, effect) =>
  makeSequenceExpression(effect, expression);

/** @type {(parameter: Parameter) => [Expression<Usage>, Expression<Usage>]} */
const makeParameterEntry = (parameter) => [
  makePrimitiveExpression(parameter),
  makeParameterExpression(parameter),
];

/** @type {(parameters: Parameter[]) => Expression<Usage>} */
const makeParameterObjectExpression = (parameters) =>
  makeObjectExpression(
    makePrimitiveExpression("Object.prototype"),
    map(parameters, makeParameterEntry),
  );

/**
 * @type {(
 *   overwritten: Record<Parameter, boolean>,
 *   parameters: Parameter[],
 *   triggered: boolean,
 * ) => Record<Parameter, boolean>}
 */
const updateOverwritten = (overwritten, parameters, triggered) => ({
  ...overwritten,
  ...reduceEntry(map(parameters, triggered ? makeTrueEntry : makeFalseEntry)),
});

////////////
// Parent //
////////////

/**
 * @typedef {{
 *   type: "closure",
 *   kind: ClosureKind,
 *   callee: Variable,
 * } | {
 *   type: "program",
 *   kind: ProgramKind,
 *   links: Link[],
 * } | {
 *   type: "block",
 *   kind: BlockKind,
 * }} Parent
 */

/** @type {(parent: Parent) => Parameter[]} */
const listParentParameter = (parent) => {
  if (parent.type === "block") {
    return parent.kind === "catch" ? ["error"] : [];
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
      return ["arguments"];
    } else if (parent.kind === "method") {
      return ["this", "arguments"];
    } else if (parent.kind === "function" || parent.kind === "constructor") {
      return ["this", "new.target", "arguments"];
    } else {
      throw new StaticError("invalid closure kind", parent.kind);
    }
  } else {
    throw new StaticError("invalid parent", parent);
  }
};

/**
 * @type {<S, L, V>(
 *   parent: Parent,
 *   labels: L[],
 *   variables: V[],
 *   serial: S,
 * ) => Point<S, L, V>}
 */
const makeEnterPoint = (parent, labels, variables, serial) => ({
  type: `${parent.type}.enter`,
  // @ts-ignore
  kind: parent.kind,
  ...(parent.type === "closure" ? { callee: parent.callee } : {}),
  ...(parent.type === "program" ? { links: parent.links } : {}),
  ...(parent.type === "block" ? { labels } : {}),
  parameters: makeParameterObjectExpression(listParentParameter(parent)),
  variables,
  serial,
});

/**
 * @type {<S, L, V>(
 *   parent: Parent,
 *   completion: Expression<Usage> | null,
 *   serial: S,
 * ) => Point<S, L, V>}
 */
const makeCompletionPoint = (parent, completion, serial) => ({
  type: `${parent.type}.completion`,
  // @ts-ignore
  kind: parent.kind,
  ...(parent.type === "block" || completion === null
    ? {}
    : { value: completion }),
  serial,
});

/** @type {<S, L, V>(parent: Parent, serial: S) => Point<S, L, V>} */
const makeFailurePoint = (parent, serial) => ({
  type: `${parent.type}.enter`,
  // @ts-ignore
  kind: parent.kind,
  value: makeParameterExpression("error"),
  serial,
});

/** @type {<S, L, V>(parent: Parent, serial: S) => Point<S, L, V>} */
const makeLeavePoint = (parent, serial) => ({
  type: `${parent.type}.enter`,
  // @ts-ignore
  kind: parent.kind,
  serial,
});

///////////
// Block //
///////////

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   node: ClosureBlock<S>,
 *   path: string,
 *   overwritten: Record<Parameter, boolean>,
 *   context: Context<S, L, V>,
 *   parent: Parent,
 * ) => ClosureBlock<Usage>}
 */
const instrumentClosureBlock = (
  node,
  path,
  old_overwritten,
  context,
  parent,
) => {
  const parameters = listParentParameter(parent);
  const enter_statement_array = listParameterTrapStatement(
    makeEnterPoint(
      parent,
      [],
      map(node.variables, context.parseVariable),
      node.tag,
    ),
    path,
    context,
    parameters,
  );
  const new_overwritten = updateOverwritten(
    old_overwritten,
    parameters,
    enter_statement_array.length > 0,
  );
  return makeTrapClosureBlock(
    {
      variables: node.variables,
      statements: [
        ...enter_statement_array,
        ...flatMap(enumerate(node.statements.length), (index) =>
          instrumentStatement(
            node.statements[index],
            `${path}_${index}`,
            new_overwritten,
            context,
          ),
        ),
      ],
      completion: makeTrapExpression(
        makeCompletionPoint(
          parent,
          instrumentExpression(
            node.completion,
            `${path}_completion`,
            new_overwritten,
            context,
          ),
          node.tag,
        ),
        path,
        context,
      ),
    },
    {
      catch: makeFailurePoint(parent, node.tag),
      finally: makeLeavePoint(parent, node.tag),
    },
    path,
    context,
  );
};

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   node: ControlBlock<S>,
 *   path: string,
 *   overwritten: Record<Parameter, boolean>,
 *   context: Context<S, L, V>,
 *   parent: Parent,
 * ) => ControlBlock<Usage>}
 */
const instrumentControlBlock = (
  node,
  path,
  old_overwritten,
  context,
  parent,
) => {
  const parameters = listParentParameter(parent);
  const enter_statement_array = listParameterTrapStatement(
    makeEnterPoint(
      parent,
      map(node.labels, context.parseLabel),
      map(node.variables, context.parseVariable),
      node.tag,
    ),
    path,
    context,
    parameters,
  );
  const new_overwritten = updateOverwritten(
    old_overwritten,
    parameters,
    enter_statement_array.length > 0,
  );
  return makeTrapControlBlock(
    {
      labels: node.labels,
      variables: node.variables,
      statements: [
        ...enter_statement_array,
        ...flatMap(enumerate(node.statements.length), (index) =>
          instrumentStatement(
            node.statements[index],
            `${path}_${index}`,
            new_overwritten,
            context,
          ),
        ),
        ...listTrapStatement(
          makeCompletionPoint(parent, null, node.tag),
          path,
          context,
        ),
      ],
    },
    {
      catch: makeFailurePoint(parent, node.tag),
      finally: makeLeavePoint(parent, node.tag),
    },
    path,
    context,
  );
};

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   node: PseudoBlock<S>,
 *   path: string,
 *   overwritten: Record<Parameter, boolean>,
 *   context: Context<S, L, V>,
 *   parent: Parent,
 * ) => PseudoBlock<Usage>}
 */
const instrumentPseudoBlock = (
  node,
  path,
  old_overwritten,
  context,
  parent,
) => {
  const parameters = listParentParameter(parent);
  const enter_statement_array = listParameterTrapStatement(
    makeEnterPoint(parent, [], [], node.tag),
    path,
    context,
    parameters,
  );
  const new_overwritten = updateOverwritten(
    old_overwritten,
    parameters,
    enter_statement_array.length > 0,
  );
  return makeLayerPseudoBlock(
    context.escape,
    [
      ...enter_statement_array,
      ...flatMap(enumerate(node.statements.length), (index) =>
        instrumentStatement(
          node.statements[index],
          `${path}_${index}`,
          new_overwritten,
          context,
        ),
      ),
    ],
    makeTrapExpression(
      makeCompletionPoint(
        parent,
        instrumentExpression(
          node.completion,
          `${path}_completion`,
          new_overwritten,
          context,
        ),
        node.tag,
      ),
      path,
      context,
    ),
  );
};

/////////////
// Program //
/////////////

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   node: Program<S>,
 *   context: Context<S, L, V>,
 * ) => Program<Usage>}
 */
export const instrumentProgram = (node, context) => {
  switch (node.type) {
    case "EvalProgram":
      return makeEvalProgram(
        instrumentClosureBlock(node.body, "", OVERWRITTEN, context, {
          type: "program",
          kind: "eval",
          links: [],
        }),
      );
    case "ModuleProgram":
      return makeModuleProgram(
        node.links,
        instrumentClosureBlock(node.body, "", OVERWRITTEN, context, {
          type: "program",
          kind: "module",
          links: node.links,
        }),
      );
    case "ScriptProgram":
      return makeScriptProgram(
        instrumentPseudoBlock(node.body, "", OVERWRITTEN, context, {
          type: "program",
          kind: "script",
          links: [],
        }),
      );
    default:
      throw new StaticError("invalid program node", node);
  }
};

///////////////
// Statement //
///////////////

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   node: Statement<S>,
 *   path: string,
 *   overwritten: Record<Parameter, boolean>,
 *   context: Context<S, L, V>
 * ) => Statement<Usage>[]}
 */
const instrumentStatement = (node, path, overwritten, context) => {
  const { parseLabel } = context;
  switch (node.type) {
    case "EffectStatement":
      return map(
        instrumentEffect(node.inner, `${path}1`, overwritten, context),
        makeEffectStatement,
      );
    case "ReturnStatement":
      return [
        makeReturnStatement(
          makeTrapExpression(
            {
              type: "return.before",
              value: instrumentExpression(
                node.result,
                `${path}1`,
                overwritten,
                context,
              ),
              serial: node.tag,
            },
            path,
            context,
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
              value: instrumentExpression(
                node.right,
                `${path}1`,
                overwritten,
                context,
              ),
              serial: node.tag,
            },
            path,
            context,
          ),
        ),
        ...listTrapStatement(
          {
            type: "enclave.declare.after",
            kind: node.kind,
            variable: node.variable,
            serial: node.tag,
          },
          path,
          context,
        ),
      ];
    }
    case "BreakStatement":
      return [
        ...map(
          listTrapEffect(
            {
              type: "break.before",
              label: parseLabel(node.label),
              serial: node.tag,
            },
            path,
            context,
          ),
          makeEffectStatement,
        ),
        makeBreakStatement(node.label),
      ];
    case "DebuggerStatement": {
      return [
        ...listTrapStatement(
          {
            type: "debugger.before",
            serial: node.tag,
          },
          path,
          context,
        ),
        makeDebuggerStatement(),
        ...map(
          listTrapEffect(
            {
              type: "debugger.after",
              serial: node.tag,
            },
            path,
            context,
          ),
          makeEffectStatement,
        ),
      ];
    }
    case "BlockStatement":
      return [
        makeBlockStatement(
          instrumentControlBlock(node.do, `${path}1`, overwritten, context, {
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
              type: "test.before",
              kind: "if",
              value: instrumentExpression(
                node.if,
                `${path}1`,
                overwritten,
                context,
              ),
              serial: node.tag,
            },
            path,
            context,
          ),
          instrumentControlBlock(node.then, `${path}2`, overwritten, context, {
            type: "block",
            kind: "then",
          }),
          instrumentControlBlock(node.else, `${path}3`, overwritten, context, {
            type: "block",
            kind: "else",
          }),
        ),
      ];
    case "WhileStatement":
      return [
        makeWhileStatement(
          makeTrapExpression(
            {
              type: "test.before",
              kind: "while",
              value: instrumentExpression(
                node.while,
                `${path}1`,
                overwritten,
                context,
              ),
              serial: node.tag,
            },
            path,
            context,
          ),
          instrumentControlBlock(node.do, `${path}2`, overwritten, context, {
            type: "block",
            kind: "loop",
          }),
        ),
      ];
    case "TryStatement":
      return [
        makeTryStatement(
          instrumentControlBlock(node.try, `${path}1`, overwritten, context, {
            type: "block",
            kind: "try",
          }),
          instrumentControlBlock(node.catch, `${path}2`, overwritten, context, {
            type: "block",
            kind: "catch",
          }),
          instrumentControlBlock(
            node.finally,
            `${path}3`,
            overwritten,
            context,
            {
              type: "block",
              kind: "finally",
            },
          ),
        ),
      ];
    default:
      throw new StaticError("invalid statement node", node);
  }
};

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   node: Effect<S>,
 *   path: string,
 *   overwritten: Record<Parameter, boolean>,
 *   context: Context<S, L, V>
 * ) => Effect<Usage>[]}
 */
const instrumentEffect = (node, path, overwritten, context) => {
  const { parseVariable } = context;
  switch (node.type) {
    case "ExpressionEffect":
      return [
        makeExpressionEffect(
          makeTrapExpression(
            {
              type: "drop.before",
              value: instrumentExpression(
                node.discard,
                `${path}1`,
                overwritten,
                context,
              ),
              serial: node.tag,
            },
            path,
            context,
          ),
        ),
      ];
    case "WriteEffect":
      return [
        makeOldWriteEffect(
          node.variable,
          makeTrapExpression(
            {
              type: "write.before",
              variable: parseVariable(node.variable),
              value: instrumentExpression(
                node.right,
                `${path}1`,
                overwritten,
                context,
              ),
              serial: node.tag,
            },
            path,
            context,
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
              value: instrumentExpression(
                node.right,
                `${path}1`,
                overwritten,
                context,
              ),
              serial: node.tag,
            },
            path,
            context,
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
              value: instrumentExpression(
                node.right,
                `${path}1`,
                overwritten,
                context,
              ),
              serial: node.tag,
            },
            path,
            context,
          ),
        ),
        ...listTrapEffect(
          {
            type: "enclave.write.after",
            variable: node.variable,
            serial: node.tag,
          },
          path,
          context,
        ),
      ];
    default:
      throw new StaticError("invalid effect node", node);
  }
};

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   node: Expression<S>,
 *   path: string,
 *   overwritten: Record<Parameter, boolean>,
 *   context: Context<S, L, V>
 * ) => Expression<Usage>}
 */
export const instrumentExpression = (node, path, overwritten, context) => {
  const { parseVariable } = context;
  switch (node.type) {
    case "PrimitiveExpression":
      return makeTrapExpression(
        {
          type: "primitive.after",
          value: unpackPrimitive(node.primitive),
          serial: node.tag,
        },
        path,
        context,
      );
    case "ParameterExpression":
      return makeTrapExpression(
        {
          type: "parameter.after",
          name: node.parameter,
          value: overwritten[node.parameter]
            ? makeNewReadExpression(
                mangleParameterVariable(node.parameter),
                undefined,
              )
            : makeParameterExpression(node.parameter),
          serial: node.tag,
        },
        path,
        context,
      );
    case "IntrinsicExpression":
      return makeTrapExpression(
        {
          type: "intrinsic.after",
          name: node.intrinsic,
          value: makeIntrinsicExpression(node.intrinsic),
          serial: node.tag,
        },
        path,
        context,
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
        path,
        context,
      );
    case "ReadExpression":
      return makeTrapExpression(
        {
          type: "read.after",
          variable: parseVariable(node.variable),
          value: makeOldReadExpression(node.variable),
          serial: node.tag,
        },
        path,
        context,
      );
    case "ReadEnclaveExpression":
      return reduceReverse(
        listTrapEffect(
          {
            type: "enclave.read.before",
            variable: node.variable,
            serial: node.tag,
          },
          path,
          context,
        ),
        makeFlipSequenceExpression,
        makeTrapExpression(
          {
            type: "enclave.read.after",
            variable: node.variable,
            value: makeReadEnclaveExpression(node.variable),
            serial: node.tag,
          },
          path,
          context,
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
          path,
          context,
        ),
        makeFlipSequenceExpression,
        makeTrapExpression(
          {
            type: "enclave.typeof.after",
            variable: node.variable,
            value: makeTypeofEnclaveExpression(node.variable),
            serial: node.tag,
          },
          path,
          context,
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
            instrumentClosureBlock(
              node.body,
              `${path}1`,
              overwritten,
              context,
              {
                type: "closure",
                kind: node.kind,
                callee: makeNewReadExpression(variable, undefined),
              },
            ),
          ),
          serial: node.tag,
        },
        path,
        context,
      );
      return hasNewVariable(expression, variable)
        ? makeSequenceExpression(
            makeNewWriteEffect(variable, expression, undefined),
            makeNewReadExpression(variable, undefined),
          )
        : expression;
    }
    case "SequenceExpression":
      return reduceReverse(
        instrumentEffect(node.head, `${path}1`, overwritten, context),
        makeFlipSequenceExpression,
        instrumentExpression(node.tail, `${path}2`, overwritten, context),
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
                  overwritten,
                  context,
                ),
                serial: node.tag,
              },
              path,
              context,
            ),
            instrumentExpression(
              node.consequent,
              `${path}2`,
              overwritten,
              context,
            ),
            instrumentExpression(
              node.alternate,
              `${path}3`,
              overwritten,
              context,
            ),
          ),
          serial: node.tag,
        },
        path,
        context,
      );
    case "AwaitExpression":
      return makeTrapExpression(
        {
          type: "await.after",
          value: makeAwaitExpression(
            makeTrapExpression(
              {
                type: "await.before",
                value: instrumentExpression(
                  node.promise,
                  `${path}1`,
                  overwritten,
                  context,
                ),
                serial: node.tag,
              },
              path,
              context,
            ),
          ),
          serial: node.tag,
        },
        path,
        context,
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
                value: instrumentExpression(
                  node.item,
                  `${path}1`,
                  overwritten,
                  context,
                ),
                serial: node.tag,
              },
              path,
              context,
            ),
          ),
          serial: node.tag,
        },
        path,
        context,
      );
    case "EvalExpression":
      return makeTrapExpression(
        {
          type: "eval.after",
          value: makeEvalExpression(
            makeTrapExpression(
              {
                type: "eval.before",
                value: instrumentExpression(
                  node.code,
                  `${path}1`,
                  overwritten,
                  context,
                ),
                serial: node.tag,
              },
              path,
              context,
            ),
          ),
          serial: node.tag,
        },
        path,
        context,
      );
    case "ApplyExpression":
      return makeTrapExpression(
        {
          type: "apply",
          callee: instrumentExpression(
            node.callee,
            `${path}1`,
            overwritten,
            context,
          ),
          this: instrumentExpression(
            node.this,
            `${path}2`,
            overwritten,
            context,
          ),
          arguments: map(enumerate(node.arguments.length), (index) =>
            instrumentExpression(
              node.arguments[index],
              `${path}3_${index}`,
              overwritten,
              context,
            ),
          ),
          serial: node.tag,
        },
        path,
        context,
      );
    case "ConstructExpression":
      return makeTrapExpression(
        {
          type: "construct",
          callee: instrumentExpression(
            node.callee,
            `${path}1`,
            overwritten,
            context,
          ),
          arguments: map(enumerate(node.arguments.length), (index) =>
            instrumentExpression(
              node.arguments[index],
              `${path}2_${index}`,
              overwritten,
              context,
            ),
          ),
          serial: node.tag,
        },
        path,
        context,
      );
    default:
      throw new StaticError("invalid expression node", node);
  }
};
