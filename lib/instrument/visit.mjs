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
  makeReadExpression,
  makeWriteEffect,
  makeControlBlock,
  makeClosureBlock,
  makePseudoBlock,
} from "./syntax.mjs";

import { makeJsonExpression, makeObjectExpression } from "./intrinsic.mjs";

import {
  makeNewReadExpression,
  makeOldReadExpression,
  makeNewWriteEffect,
  makeOldWriteEffect,
  hasNewVariable,
} from "../../new_graveyard/usage.mjs";

import {
  mangleSerialVariable,
  mangleCalleeVariable,
  mangleParameterVariable,
  mangleLabelVariable,
  mangleShadowVariable,
  COMPLETION_VARIABLE,
  isCalleeVariable,
  isSerialVariable,
  mangleOriginalVariable,
} from "./mangle.mjs";

import {
  listTrapEffect,
  makeTrapExpression,
  trapClosureBlock,
  trapControlBlock,
  trapParameter,
} from "./trap.mjs";

import { escapePseudoBlock } from "./escape.mjs";
import { getNodeTag } from "../syntax.mjs";

const {
  undefined,
  Reflect: { apply },
  Set,
  Set: {
    prototype: { has: hasSet },
  },
  Object: { fromEntries: reduceEntry },
} = globalThis;

/**
 * @template S, L, V
 * @typedef {{
 *   pointcut: Pointcut<S, L, V>,
 *   advice: Expression<Variable[]>,
 *   makeSerialExpression: (value: S) => Expression<Variable[]>,
 *   makeLabelExpression: (data: L) => Expression<Variable[]>,
 *   makeVariableExpression: (data: V) => Expression<Variable[]>,
 *   parseSerial: (print: string) => S,
 *   parseLabel: (variable: Label) => L,
 *   parseVariable: (variable: Variable) => V,
 * }} Context
 */

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

/**
 * @type {(
 *   expression: Expression<Variable[]>,
 *   effect: Effect<Variable[]>,
 * ) => Expression<Variable[]>}
 */
const makeFlipSequenceExpression = (expression, effect) =>
  makeSequenceExpression(effect, expression);

/////////////
// Program //
/////////////

const OVERWRITTEN = /** @type {Record<Parameter, Expression<Variable[]>>} */ (
  reduceEntry(
    map(PARAMETER_ENUM, (parameter) => [
      parameter,
      makeParameterExpression(parameter),
    ]),
  )
);

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   options: {
 *     inline: {variable: boolean, label: boolean, serial: boolean },
 *     stringifySerial: (serial: S) => string,
 *     stringifyLabel: (label: L) => Label,
 *     stringifyVariable: (variable: V) => Variable,
 *   },
 * ) => {
 *   makeSerialExpression: (serial: S) => Expression<Variable[]>,
 *   makeLabelExpression: (data: L) => Expression<Variable[]>,
 *   makeVariableExpression: (data: V) => Expression<Variable[]>,
 * }}
 */
const compileInjecter = ({
  inline,
  stringifySerial,
  stringifyLabel,
  stringifyVariable,
}) => ({
  makeSerialExpression: inline.serial
    ? makeJsonExpression
    : (serial) =>
        makeReadExpression(mangleSerialVariable(stringifySerial(serial))),
  makeLabelExpression: inline.label
    ? makeJsonExpression
    : (data) => makeReadExpression(mangleLabelVariable(stringifyLabel(data))),
  makeVariableExpression: inline.variable
    ? makeJsonExpression
    : (data) =>
        makeReadExpression(mangleShadowVariable(stringifyVariable(data))),
});

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   node: Program<S>,
 *   options: {
 *     escape: Variable,
 *     advice: Variable,
 *     pointcut: Pointcut<S, L, V>,
 *     inline: { serial: boolean, label: boolean, variable: boolean },
 *     parseSerial: (print: string) => S,
 *     parseLabel: (label: Label) => L,
 *     parseVariable: (variable: Variable) => V,
 *     stringifySerial: (serial: S) => string,
 *     stringifyLabel: (label: L) => Label,
 *     stringifyVariable: (variable: V) => Variable,
 *   },
 * ) => Program<Variable[]>}
 */
export const instrumentProgram = (node, options) => {
  const context = {
    ...compileInjecter(options),
    ...options,
    advice: makeReadEnclaveExpression(options.advice),
  };
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
        escapePseudoBlock(
          instrumentPseudoBlock(node.body, "", OVERWRITTEN, context, {
            type: "program",
            kind: "script",
            links: [],
          }),
          options.escape,
        ),
      );
    default:
      throw new StaticError("invalid program node", node);
  }
};

///////////
// Block //
///////////

/** @type {(parent: Parent) => Parameter[]} */
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

/** @type {(parameter: Parameter) => [Expression<Variable[]>, Expression<Variable[]>]} */
const makeParameterEntry = (parameter) => [
  makePrimitiveExpression(parameter),
  makeParameterExpression(parameter),
];

/** @type {(parameters: Parameter[]) => Expression<Variable[]>} */
const makeParameterObjectExpression = (parameters) =>
  makeObjectExpression(
    makePrimitiveExpression("Object.prototype"),
    map(parameters, makeParameterEntry),
  );

/**
 * @type {<S, L, V>(
 *   parent: Parent,
 *   labels: L[],
 *   variables: V[],
 *   serial: S,
 * ) => Point<Variable[], S, L, V>}
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
 *   completion: Expression<Variable[]> | null,
 *   serial: S,
 * ) => Point<Variable[], S, L, V>}
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

/** @type {<S, L, V>(parent: Parent, serial: S) => Point<Variable[], S, L, V>} */
const makeFailurePoint = (parent, serial) => ({
  type: `${parent.type}.enter`,
  // @ts-ignore
  kind: parent.kind,
  value: makeParameterExpression("catch.error"),
  serial,
});

/** @type {<S, L, V>(parent: Parent, serial: S) => Point<Variable[], S, L, V>} */
const makeLeavePoint = (parent, serial) => ({
  type: `${parent.type}.enter`,
  // @ts-ignore
  kind: parent.kind,
  serial,
});

/**
 * @type {{
 *   makeSaveEffect: (parameter: Parameter | null, right: Expression<Variable[]>) => Effect<Variable[]>,
 *   makeLoadExpression: (parameter: Parameter | null) => Expression<Variable[]>,
 * }}
 */
const parameter_access = {
  makeSaveEffect: (parameter, right) =>
    makeWriteEffect(mangleParameterVariable(parameter), right),
  makeLoadExpression: (parameter) =>
    makeReadExpression(mangleParameterVariable(parameter)),
};

/**
 * @type {{
 *   makeSaveEffect: (right: Expression<Variable[]>) => Effect<Variable[]>,
 *   makeLoadExpression: () => Expression<Variable[]>,
 * }}
 */
const completion_access = {
  makeSaveEffect: (right) => makeWriteEffect(COMPLETION_VARIABLE, right),
  makeLoadExpression: () => makeReadExpression(COMPLETION_VARIABLE),
};

/**
 * @type {(
 *   free: Variable[],
 *   labels: Label[],
 *   parameters: Parameter[],
 *   variables: Variable[],
 * ) => (variable: Variable) => boolean}
 */
const compileIsBound = (free, labels, parameters, variables) => {
  const bound = new Set([
    ...map(labels, mangleLabelVariable),
    ...map(parameters, mangleParameterVariable),
    ...map(variables, mangleShadowVariable),
    ...map(variables, mangleOriginalVariable),
  ]);
  return (variable) =>
    !includes(free, variable) &&
    (apply(hasSet, bound, [variable]) ||
      isCalleeVariable(variable) ||
      isSerialVariable(variable));
};

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   node: ClosureBlock<S>,
 *   path: string,
 *   overwritten: Record<Parameter, Expression<Variable[]>>,
 *   context: Context<S, L, V>,
 *   parent: Parent,
 * ) => ClosureBlock<Variable[]>}
 */
const instrumentClosureBlock = (
  node,
  path,
  old_overwritten,
  context,
  parent,
) => {
  const parameters = listParentParameter(parent);
  const enter = trapParameter(
    makeEnterPoint(
      parent,
      [],
      map(node.variables, context.parseVariable),
      node.tag,
    ),
    context,
    parameters,
    parameter_access,
  );
  const new_overwritten = {
    ...old_overwritten,
    ...enter.overwritten,
  };
  const closure = trapClosureBlock(
    {
      statements: [
        ...enter.statements,
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
            `${path}_c`,
            new_overwritten,
            context,
          ),
          node.tag,
        ),
        context,
      ),
    },
    {
      catch: makeFailurePoint(parent, node.tag),
      finally: makeLeavePoint(parent, node.tag),
    },
    context,
    completion_access,
  );
  return makeClosureBlock(
    filter(
      removeDuplicate([
        ...flatMap(closure.statements, getNodeTag),
        ...closure.completion.tag,
      ]),
      compileIsBound(
        parent.type === "closure" ? [parent.callee] : [],
        [],
        parameters,
        node.variables,
      ),
    ),
    closure.statements,
    closure.completion,
  );
};

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   node: ControlBlock<S>,
 *   path: string,
 *   overwritten: Record<Parameter, Expression<Variable[]>>,
 *   context: Context<S, L, V>,
 *   parent: Parent,
 * ) => ControlBlock<Variable[]>}
 */
const instrumentControlBlock = (
  node,
  path,
  old_overwritten,
  context,
  parent,
) => {
  const parameters = listParentParameter(parent);
  const enter = trapParameter(
    makeEnterPoint(
      parent,
      map(node.labels, context.parseLabel),
      map(node.variables, context.parseVariable),
      node.tag,
    ),
    context,
    parameters,
    parameter_access,
  );
  const new_overwritten = {
    ...old_overwritten,
    ...enter.overwritten,
  };
  const statements = trapControlBlock(
    [
      ...enter.statements,
      ...flatMap(enumerate(node.statements.length), (index) =>
        instrumentStatement(
          node.statements[index],
          `${path}_${index}`,
          new_overwritten,
          context,
        ),
      ),
      ...map(
        listTrapEffect(makeCompletionPoint(parent, null, node.tag), context),
        makeEffectStatement,
      ),
    ],
    {
      catch: makeFailurePoint(parent, node.tag),
      finally: makeLeavePoint(parent, node.tag),
    },
    context,
  );

  return makeControlBlock(
    node.labels,
    filter(
      removeDuplicate(flatMap(statements, getNodeTag)),
      compileIsBound([], node.labels, parameters, node.variables),
    ),
    statements,
  );
};

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   node: PseudoBlock<S>,
 *   path: string,
 *   overwritten: Record<Parameter, Expression<Variable[]>>,
 *   context: Context<S, L, V>,
 *   parent: Parent,
 * ) => PseudoBlock<Variable[]>}
 */
const instrumentPseudoBlock = (
  node,
  path,
  old_overwritten,
  context,
  parent,
) => {
  const enter = trapParameter(
    makeEnterPoint(parent, [], [], node.tag),
    context,
    listParentParameter(parent),
    parameter_access,
  );
  const new_overwritten = {
    ...old_overwritten,
    ...enter.overwritten,
  };
  return makePseudoBlock(
    [
      ...enter.statements,
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
      context,
    ),
  );
};

///////////////
// Statement //
///////////////

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   node: Statement<S>,
 *   path: string,
 *   overwritten: Record<Parameter, Expression<Variable[]>>,
 *   context: Context<S, L, V>
 * ) => Statement<Variable[]>[]}
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
            context,
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
            context,
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
              label: parseLabel(node.label),
              serial: node.tag,
            },
            context,
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
            context,
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
 *   overwritten: Record<Parameter, Expression<Variable[]>>,
 *   context: Context<S, L, V>
 * ) => Effect<Variable[]>[]}
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
            context,
          ),
        ),
        ...listTrapEffect(
          {
            type: "enclave.write.after",
            variable: node.variable,
            serial: node.tag,
          },
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
 *   overwritten: Record<Parameter, Expression<Variable[]>>,
 *   context: Context<S, L, V>
 * ) => Expression<Variable[]>}
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
                callee: variable,
              },
            ),
          ),
          serial: node.tag,
        },
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
              context,
            ),
          ),
          serial: node.tag,
        },
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
              context,
            ),
          ),
          serial: node.tag,
        },
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
              context,
            ),
          ),
          serial: node.tag,
        },
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
        context,
      );
    default:
      throw new StaticError("invalid expression node", node);
  }
};
