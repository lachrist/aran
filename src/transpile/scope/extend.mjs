import { forEach, concat } from "array-lite";

import { assert } from "../../util/index.mjs";

import {
  makeLiteralExpression,
  makeModuleProgram,
  makeEvalProgram,
  makeClosureExpression,
  makeIntrinsicExpression,
} from "../../ast/index.mjs";

import { BASE, SPEC, META } from "./variable.mjs";

import {
  createFrame,
  BLOCK_DYNAMIC,
  BLOCK_STATIC_DEAD,
  BLOCK_STATIC,
  CLOSURE_DYNAMIC,
  CLOSURE_STATIC,
  DEFINE_DYNAMIC,
  DEFINE_STATIC,
  EMPTY_DYNAMIC_WITH,
  EMPTY_VOID,
  ESCAPE,
  ENCLAVE,
  ILLEGAL,
  IMPORT_STATIC,
  MACRO,
  OBSERVABLE,
  TRAIL,
} from "./frame.mjs";

import {
  declareScope,
  makeScopeFrameBlock,
  makeScopeFrameScriptProgram,
} from "./scope.mjs";

const compileContextCallback = (callback, context) => (scope) =>
  callback({ ...context, scope });

///////////////
// Blueprint //
///////////////

const createMetaFrameArray = () => [
  createFrame(DEFINE_STATIC, META, {}),
  createFrame(MACRO, META, {}),
];

const createPseudoMetaFrameArray = () => [
  createFrame(DEFINE_DYNAMIC, META, {
    macro: makeIntrinsicExpression("aran.globalCache"),
  }),
  createFrame(MACRO, META, {}),
];

const createSpecFrameArray = () => [
  createFrame(DEFINE_STATIC, SPEC, {}),
  createFrame(MACRO, SPEC, {}),
  createFrame(ILLEGAL, SPEC, {}),
];

const createPseudoSpecFrameArray = () => [
  createFrame(MACRO, SPEC, {}),
  createFrame(ILLEGAL, SPEC, {}),
];

const createRootBaseFrameArray = (enclave, program) =>
  enclave
    ? [createFrame(ENCLAVE, BASE, { program })]
    : [
        createFrame(EMPTY_VOID, BASE, {
          macro: makeIntrinsicExpression("aran.globalObject"),
        }),
        createFrame(CLOSURE_DYNAMIC, BASE, {
          macro: makeIntrinsicExpression("aran.globalObject"),
        }),
        createFrame(OBSERVABLE, BASE, {}),
        createFrame(BLOCK_DYNAMIC, BASE, {
          macro: makeIntrinsicExpression("aran.globalRecord"),
        }),
      ];

const createLocalBaseFrameArray = (enclave, program) =>
  enclave ? [createFrame(ENCLAVE, BASE, { program })] : [];

const createEvalBaseFrameArray = (strict) =>
  strict
    ? [
        createFrame(TRAIL, BASE, { key: "program" }),
        createFrame(CLOSURE_STATIC, BASE, {}),
        createFrame(BLOCK_STATIC, BASE, {}),
      ]
    : [
        createFrame(TRAIL, BASE, { key: "program" }),
        createFrame(BLOCK_STATIC, BASE, {}),
      ];

const createModuleBaseFrameArray = () => [
  createFrame(TRAIL, BASE, { key: "program" }),
  createFrame(CLOSURE_STATIC, BASE, {}),
  createFrame(BLOCK_STATIC, BASE, {}),
  createFrame(IMPORT_STATIC, BASE, {}),
];

const createEscapeFrameArray = () => [
  createFrame(ESCAPE, BASE, {}),
  createFrame(ESCAPE, SPEC, {}),
  createFrame(ESCAPE, META, {}),
];

const createStaticClosureBaseFrameArray = () => [
  createFrame(CLOSURE_STATIC, BASE, {}),
  createFrame(BLOCK_STATIC, BASE, {}),
];

const createDynamicClosureBaseFrameArray = (macro) => [
  createFrame(CLOSURE_DYNAMIC, BASE, { macro }),
  createFrame(BLOCK_STATIC, BASE, {}),
];

const createWithBaseFrameArray = (macro) => [
  createFrame(EMPTY_DYNAMIC_WITH, BASE, { macro }),
  createFrame(OBSERVABLE, BASE, {}),
  createFrame(BLOCK_STATIC, BASE, {}),
];

const createBlockBaseFrameArray = () => [createFrame(BLOCK_STATIC, BASE, {})];

const createDistantBlockBaseFrameArray = () => [
  createFrame(TRAIL, BASE, { key: "distant" }),
];

const createDeadBlockBaseFrameArray = () => [
  createFrame(BLOCK_STATIC_DEAD, BASE, {}),
];

/////////////
// Program //
/////////////

export const makeScopeScriptProgram = (context, enclave, makeStatementArray) =>
  makeScopeFrameScriptProgram(
    context.strict,
    context.scope,
    concat(
      createPseudoMetaFrameArray(),
      createPseudoSpecFrameArray(),
      createRootBaseFrameArray(enclave, "script"),
    ),
    compileContextCallback(makeStatementArray, context),
  );

export const makeScopeModuleProgram = (
  context,
  enclave,
  links,
  makeStatementArray,
) => {
  assert(context.strict === true, "module program should always be strict");
  return makeModuleProgram(
    links,
    makeScopeFrameBlock(
      context.strict,
      context.scope,
      [],
      concat(
        createMetaFrameArray(),
        createSpecFrameArray(),
        createRootBaseFrameArray(enclave, "module"),
        createModuleBaseFrameArray(),
      ),
      compileContextCallback(makeStatementArray, context),
    ),
  );
};

export const makeScopeGlobalEvalProgram = (
  context,
  enclave,
  makeStatementArray,
) =>
  makeEvalProgram(
    makeScopeFrameBlock(
      context.strict,
      context.scope,
      [],
      concat(
        createMetaFrameArray(),
        createSpecFrameArray(),
        createRootBaseFrameArray(enclave, "eval"),
        createEvalBaseFrameArray(context.strict),
      ),
      compileContextCallback(makeStatementArray, context),
    ),
  );

export const makeScopeLocalEvalProgram = (
  context,
  enclave,
  makeStatementArray,
) =>
  makeEvalProgram(
    makeScopeFrameBlock(
      context.strict,
      context.scope,
      [],
      concat(
        createMetaFrameArray(),
        createSpecFrameArray(),
        createLocalBaseFrameArray(enclave, "eval"),
        createEvalBaseFrameArray(context.strict),
      ),
      compileContextCallback(makeStatementArray, context),
    ),
  );

/////////////
// Closure //
/////////////

export const makeScopeClosureExpression = (
  context,
  type,
  asynchronous,
  generator,
  makeStatementArray,
) =>
  makeClosureExpression(
    type,
    asynchronous,
    generator,
    makeScopeFrameBlock(
      context.strict,
      context.scope,
      [],
      concat(
        createEscapeFrameArray(),
        createMetaFrameArray(),
        createSpecFrameArray(),
        createBlockBaseFrameArray(),
      ),
      compileContextCallback(makeStatementArray, context),
    ),
  );

////////////
// Static //
////////////

const generateMakeBlueprintBlock =
  (createBaseFrameArray) => (context, labels, makeStatementArray) =>
    makeScopeFrameBlock(
      context.strict,
      context.scope,
      labels,
      concat(createMetaFrameArray(), createBaseFrameArray()),
      compileContextCallback(makeStatementArray, context),
    );

export const makeScopeNormalStaticBlock = generateMakeBlueprintBlock(
  createBlockBaseFrameArray,
);

export const makeScopeDeadStaticBlock = generateMakeBlueprintBlock(
  createDeadBlockBaseFrameArray,
);

export const makeScopeDistantStaticBlock = generateMakeBlueprintBlock(
  createDistantBlockBaseFrameArray,
);

export const makeScopeClosureStaticBlock = generateMakeBlueprintBlock(
  createStaticClosureBaseFrameArray,
);

/////////////
// Dynamic //
/////////////

const generateMakeScopeDynamicBlock =
  (createBaseFrameArray) => (context, labels, macro, makeStatementArray) =>
    makeScopeFrameBlock(
      context.strict,
      context.scope,
      labels,
      concat(createMetaFrameArray(), createBaseFrameArray(macro)),
      compileContextCallback(makeStatementArray, context),
    );

export const makeScopeClosureDynamicBlock = generateMakeScopeDynamicBlock(
  createDynamicClosureBaseFrameArray,
);

export const makeScopeWithDynamicBlock = generateMakeScopeDynamicBlock(
  createWithBaseFrameArray,
);

//////////
// Test //
//////////

/* c8 ignore start */
export const makeScopeTestBlock = (context, makeStatementArray) =>
  makeScopeFrameBlock(
    context.strict,
    context.scope,
    [],
    [
      createFrame(DEFINE_STATIC, META, {}),
      createFrame(MACRO, SPEC, {}),
      createFrame(ENCLAVE, BASE, {}),
    ],
    (scope) => {
      forEach(
        [
          "this",
          "import",
          "new.target",
          "import.meta",
          "super.get",
          "super.set",
          "super.call",
        ],
        (name) => {
          declareScope(context.strict, scope, "macro", name, {
            macro: makeLiteralExpression(name),
          });
        },
      );
      return makeStatementArray({ ...context, scope });
    },
  );
/* c8 ignore stop */
