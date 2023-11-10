/* eslint-disable no-use-before-define */

import {
  AranTypeError,
  map,
  flatMap,
  reduceReverse,
  filter,
  includes,
  some,
  reduce,
  unzip,
} from "../util/index.mjs";
import { unpackPrimitive } from "../lang.mjs";
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
  makeControlBlock,
  makeClosureBlock,
  makePseudoBlock,
  makeConditionalEffect,
  makeExporLink,
  makeAggregateLink,
  makeImportLink,
  combineFree,
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
import { escapePseudoBlock } from "../escape.mjs";
import {
  makeGetExpression,
  makeJsonExpression,
  makeSetExpression,
} from "./intrinsic.mjs";
import { drill, drillArray, drillAll } from "./drill.mjs";
import {
  makeReadCalleeExpression,
  makeReadOriginalExpression,
  makeWriteCalleeEffect,
  makeWriteLocationEffect,
  makeWriteOriginalEffect,
} from "./variable.mjs";

const {
  Object: { values: listValue, entries: listEntry },
  Reflect: { ownKeys: listKey },
} = globalThis;

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

/** @typedef {import("../../type/advice.js").ClosureKind} ClosureKind */

/** @typedef {import("../../type/advice.js").ProgramKind} ProgramKind */

/** @typedef {import("../../type/advice.js").BlockKind} BlockKind */

/**
 * @template L
 * @typedef {{
 *   base: import("../../type/options.d.ts").Base,
 *   pointcut: Pointcut<L>,
 *   locate: import("../../type/options.d.ts").Locate<L>,
 *   advice: import("../../type/options.d.ts").Advice,
 * }} Options
 */

/**
 * @typedef {{
 *   type: "program",
 *   kind: ProgramKind,
 *   links: LinkData[],
 * } | {
 *   type: "closure",
 *   kind: ClosureKind,
 *   callee: weave.TargetPath,
 * } | {
 *   type: "block",
 *   kind: BlockKind,
 * }} Parent
 */

const {
  Error,
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
 * @type {<L extends Json>(
 *   pair: {
 *     node: aran.Program<weave.ArgAtom>,
 *     path: weave.TargetPath,
 *   },
 *   options: Options<L>,
 * ) => aran.Program<weave.ResAtom>}
 */
export const weaveProgram = ({ node, path }, options) => {
  switch (node.type) {
    case "EvalProgram": {
      return makeEvalProgram(
        weaveClosureBlock(drill({ node, path }, "body"), options, {
          type: "program",
          kind: "eval",
          links: [],
        }),
      );
    }
    case "ModuleProgram": {
      return makeModuleProgram(
        map(node.links, weaveLink),
        weaveClosureBlock(drill({ node, path }, "body"), options, {
          type: "program",
          kind: "module",
          links: map(node.links, serializeLink),
        }),
      );
    }
    case "ScriptProgram": {
      const { base } = options;
      const body = weavePseudoBlock(drill({ node, path }, "body"), options, {
        type: "program",
        kind: "script",
        links: [],
      });
      return makeScriptProgram(
        escapePseudoBlock(
          body,
          /** @type {weave.ResVariable[]} */ (listKey(body.tag)),
          {
            makeReadExpression: (variable, _free) =>
              makeGetExpression(
                makeIntrinsicExpression("aran.hidden.weave"),
                makePrimitiveExpression(`${base}.${variable}`),
              ),
            makeWriteEffect: (variable, right, _free) =>
              makeExpressionEffect(
                makeSetExpression(
                  "strict",
                  makeIntrinsicExpression("aran.hidden.weave"),
                  makePrimitiveExpression(`${base}.${variable}`),
                  right,
                ),
              ),
          },
        ),
      );
    }
    default: {
      throw new AranTypeError("invalid program node", node);
    }
  }
};

//////////
// Link //
//////////

/**
 * @type {(
 *   node: aran.Link<weave.ArgAtom>,
 * ) => aran.Link<weave.ResAtom>}
 */
const weaveLink = (node) => {
  switch (node.type) {
    case "ImportLink": {
      return makeImportLink(node.source, node.import);
    }
    case "ExportLink": {
      return makeExporLink(node.export);
    }
    case "AggregateLink": {
      return node.export === null
        ? makeAggregateLink(node.source, node.import, node.export)
        : makeAggregateLink(node.source, node.import, node.export);
    }
    default: {
      throw new AranTypeError("invalid link node", node);
    }
  }
};

/** @type {(node: aran.Link<weave.ArgAtom>) => LinkData} */
const serializeLink = (node) => {
  switch (node.type) {
    case "ImportLink": {
      return {
        type: "import",
        source: node.source,
        specifier: node.import,
      };
    }
    case "ExportLink": {
      return {
        type: "export",
        export: node.export,
      };
    }
    case "AggregateLink": {
      return {
        type: "aggregate",
        source: node.source,
        import: node.import,
        export: node.export,
      };
    }
    default: {
      throw new AranTypeError("invalid link node", node);
    }
  }
};

///////////
// Block //
///////////

/** @type {(parent: Parent) => aran.Parameter[]} */
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
          throw new AranTypeError("invalid closure parent kind", parent);
        }
      }
    }
    case "program": {
      switch (parent.kind) {
        case "eval": {
          return [
            "this",
            "import",
            "scope.read",
            "scope.typeof",
            "scope.write",
            "super.call",
            "super.get",
            "super.set",
          ];
        }
        case "module": {
          return ["this", "import", "import.meta"];
        }
        case "script": {
          return ["this", "import"];
        }
        default: {
          throw new AranTypeError("invalid program parent kind", parent);
        }
      }
    }
    default: {
      throw new AranTypeError("invalid parent type", parent);
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
 *   parent: Parent,
 *   labels: weave.Label[],
 *   variables: weave.ArgVariable[],
 *   location: L,
 * ) => Point<L> & { type: "program.enter" | "closure.enter" | "block.enter" }}
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
        kind: parent.kind,
        links: parent.links,
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
      throw new AranTypeError("invalid parent", parent);
    }
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
    case "program": {
      return {
        type: "program.completion",
        kind: parent.kind,
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
      throw new AranTypeError("invalid parent", parent);
    }
  }
};

/** @type {<L>(parent: Parent, location: L) => Point<L>} */
const makeFailurePoint = (parent, location) => {
  switch (parent.type) {
    case "program": {
      return {
        type: "program.failure",
        kind: parent.kind,
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
      throw new AranTypeError("invalid parent", parent);
    }
  }
};

/** @type {<L>(parent: Parent, location: L) => Point<L>} */
const makeLeavePoint = (parent, location) => {
  switch (parent.type) {
    case "program": {
      return {
        type: "program.leave",
        kind: parent.kind,
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
      throw new AranTypeError("invalid parent", parent);
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
 * @type {<L extends Json>(
 *   pair: {
 *     node: aran.ClosureBlock<weave.ArgAtom>,
 *     path: weave.TargetPath,
 *   },
 *   options: Options<L>,
 *   parent: Parent & { type: "program" | "closure" },
 * ) => aran.ClosureBlock<weave.ResAtom>}
 */
const weaveClosureBlock = ({ node, path }, options, parent) => {
  const { locate } = options;
  const location = locate(node.tag.path, options.base);
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
          reduce(block.statements, combineFree, recordFree(block.completion)),
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
 * @type {<L extends Json>(
 *   pair: {
 *     node: aran.ControlBlock<weave.ArgAtom>,
 *     path: weave.TargetPath,
 *   },
 *   options: Options<L>,
 *   parent: Parent,
 * ) => aran.ControlBlock<weave.ResAtom>}
 */
const weaveControlBlock = ({ node, path }, options, parent) => {
  const { locate } = options;
  const location = locate(node.tag.path, options.base);
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
        listEntry(reduce(statements, combineFree, {}))
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

/**
 * @type {<L extends Json>(
 *   pair: {
 *     node: aran.PseudoBlock<weave.ArgAtom>,
 *     path: weave.TargetPath,
 *   },
 *   options: Options<L>,
 *   parent: Parent,
 * ) => aran.PseudoBlock<weave.ResAtom>}
 */
const weavePseudoBlock = ({ node, path }, options, parent) => {
  const { locate } = options;
  const location = locate(node.tag.path, options.base);
  const statements = flatMap(
    drillAll(drillArray({ node, path }, "statements")),
    (pair) => weaveStatement(pair, options),
  );
  return makePseudoBlock(
    [
      ...map(
        flatMap(
          listValue(reduce(statements, combineFree, {})),
          listLocationInitializeEffect,
        ),
        makeEffectStatement,
      ),
      ...map(
        listEnterTrapEffect(
          makeEnterPoint(parent, [], [], location),
          path,
          options,
        ),
        makeEffectStatement,
      ),
      ...statements,
    ],
    makeTrapExpression(
      makeCompletionPoint(
        parent,
        weaveExpression(drill({ node, path }, "completion"), options),
        location,
      ),
      path,
      options,
    ),
  );
};

///////////////
// Statement //
///////////////

/**
 * @type {<L extends Json>(
 *   pair: {
 *     node: aran.Statement<weave.ArgAtom>,
 *     path: weave.TargetPath,
 *   },
 *   options: Options<L>
 * ) => aran.Statement<weave.ResAtom>[]}
 */
const weaveStatement = ({ node, path }, options) => {
  const { locate } = options;
  const location = locate(node.tag.path, options.base);
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
              value: weaveExpression(drill({ node, path }, "right"), options),
              location,
            },
            path,
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
            path,
            options,
          ),
          makeEffectStatement,
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
      throw new AranTypeError("invalid statement node", node);
    }
  }
};

/**
 * @type {<L extends Json>(
 *   pair: {
 *     node: aran.Effect<weave.ArgAtom>,
 *     path: weave.TargetPath,
 *   },
 *   options: Options<L>
 * ) => aran.Effect<weave.ResAtom>[]}
 */
const weaveEffect = ({ node, path }, options) => {
  const { locate } = options;
  const location = locate(node.tag.path, options.base);
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
    case "WriteGlobalEffect": {
      return [
        makeWriteGlobalEffect(
          node.variable,
          makeTrapExpression(
            {
              type: "global.write.before",
              variable: node.variable,
              value: weaveExpression(drill({ node, path }, "right"), options),
              location,
            },
            path,
            options,
          ),
        ),
        ...listTrapEffect(
          {
            type: "global.write.after",
            variable: node.variable,
            location,
          },
          path,
          options,
        ),
      ];
    }
    default: {
      throw new AranTypeError("invalid effect node", node);
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
        makeWriteCalleeEffect(path, node),
        makeReadCalleeExpression(path),
      )
    : node;

/**
 * @type {<L extends Json>(
 *   pair: {
 *     node: aran.Expression<weave.ArgAtom>,
 *     path: weave.TargetPath,
 *   },
 *   options: Options<L>,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const weaveExpression = ({ node, path }, options) => {
  const { locate } = options;
  const location = locate(node.tag.path, options.base);
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
    case "ReadGlobalExpression": {
      return reduceReverse(
        listTrapEffect(
          {
            type: "global.read.before",
            variable: node.variable,
            location,
          },
          path,
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
          path,
          options,
        ),
      );
    }
    case "TypeofGlobalExpression": {
      return reduceReverse(
        listTrapEffect(
          {
            type: "global.typeof.before",
            variable: node.variable,
            location,
          },
          path,
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
          path,
          options,
        ),
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
      return reduceReverse(
        weaveEffect(drill({ node, path }, "head"), options),
        makeFlipSequenceExpression,
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
                value: weaveExpression(drill({ node, path }, "code"), options),
                context: node.tag.context,
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
      throw new AranTypeError("invalid expression node", node);
    }
  }
};
