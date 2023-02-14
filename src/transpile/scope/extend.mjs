import { concat } from "array-lite";

import { constant, assert } from "../../util/index.mjs";

import {
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
  ESCAPE_CLOSURE,
  ENCLAVE,
  ILLEGAL,
  IMPORT_STATIC,
  MACRO,
} from "./frame/index.mjs";

import { makeScopeFrameBlock, makeScopeFrameScriptProgram } from "./frame.mjs";

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
    observable: false,
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
          observable: true,
        }),
        createFrame(CLOSURE_DYNAMIC, BASE, {
          macro: makeIntrinsicExpression("aran.globalObject"),
          observable: true,
        }),
        createFrame(BLOCK_DYNAMIC, BASE, {
          macro: makeIntrinsicExpression("aran.globalRecord"),
          observable: false,
        }),
      ];

const createLocalBaseFrameArray = (enclave, program) =>
  enclave ? [createFrame(ENCLAVE, BASE, { program })] : [];

const createEvalBaseFrameArray = (strict) =>
  strict
    ? [
        createFrame(CLOSURE_STATIC, BASE, {}),
        createFrame(BLOCK_STATIC, BASE, { distant: false }),
      ]
    : [createFrame(BLOCK_STATIC, BASE, { distant: false })];

const createModuleBaseFrameArray = () => [
  createFrame(CLOSURE_STATIC, BASE, {}),
  createFrame(BLOCK_STATIC, BASE, { distant: false }),
  createFrame(IMPORT_STATIC, BASE, {}),
];

const createEscapeClosureFrameArray = () => [
  createFrame(ESCAPE_CLOSURE, BASE, {}),
  createFrame(ESCAPE_CLOSURE, SPEC, {}),
  createFrame(ESCAPE_CLOSURE, META, {}),
];

const createStaticClosureBaseFrameArray = () => [
  createFrame(CLOSURE_STATIC, BASE, {}),
  createFrame(BLOCK_STATIC, BASE, { distant: false }),
];

const createDynamicClosureBaseFrameArray = (macro) => [
  createFrame(CLOSURE_DYNAMIC, BASE, { macro, observable: false }),
  createFrame(BLOCK_STATIC, BASE, { distant: false }),
];

const createWithBaseFrameArray = (macro) => [
  createFrame(EMPTY_DYNAMIC_WITH, BASE, { macro, observable: true }),
  createFrame(BLOCK_STATIC, BASE, { distant: false }),
];

const createBlockBaseFrameArray = () => [
  createFrame(BLOCK_STATIC, BASE, { distant: false }),
];

const createDistantBlockBaseFrameArray = () => [
  createFrame(BLOCK_STATIC, BASE, { distant: true }),
];

const createDeadBlockBaseFrameArray = () => [
  createFrame(BLOCK_STATIC_DEAD, BASE, {}),
];

/////////////
// Program //
/////////////

export const makeScopeScriptProgram = (
  { strict, scope },
  enclave,
  makeStatementArray,
) =>
  makeScopeFrameScriptProgram(
    strict,
    scope,
    concat(
      createPseudoMetaFrameArray(),
      createPseudoSpecFrameArray(),
      createRootBaseFrameArray(enclave, "script"),
    ),
    makeStatementArray,
  );

export const makeScopeModuleProgram = (
  { strict, scope },
  enclave,
  links,
  makeStatementArray,
) => {
  assert(strict === true, "module program should always be strict");
  return makeModuleProgram(
    links,
    makeScopeFrameBlock(
      strict,
      scope,
      [],
      concat(
        createMetaFrameArray(),
        createSpecFrameArray(),
        createRootBaseFrameArray(enclave, "module"),
        createModuleBaseFrameArray(),
      ),
      makeStatementArray,
    ),
  );
};

export const makeScopeGlobalEvalProgram = (
  { strict, scope },
  enclave,
  makeStatementArray,
) =>
  makeEvalProgram(
    makeScopeFrameBlock(
      strict,
      scope,
      [],
      concat(
        createMetaFrameArray(),
        createSpecFrameArray(),
        createRootBaseFrameArray(enclave, "eval"),
        createEvalBaseFrameArray(strict),
      ),
      makeStatementArray,
    ),
  );

export const makeScopeLocalEvalProgram = (
  { strict, scope },
  enclave,
  makeStatementArray,
) =>
  makeEvalProgram(
    makeScopeFrameBlock(
      strict,
      scope,
      [],
      concat(
        createMetaFrameArray(),
        createSpecFrameArray(),
        createLocalBaseFrameArray(enclave, "eval"),
        createEvalBaseFrameArray(strict),
      ),
      makeStatementArray,
    ),
  );

/////////////
// Closure //
/////////////

export const makeScopeClosureExpression = (
  { strict, scope },
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
      strict,
      scope,
      [],
      concat(
        createEscapeClosureFrameArray(),
        createMetaFrameArray(),
        createSpecFrameArray(),
        createBlockBaseFrameArray(),
      ),
      makeStatementArray,
    ),
  );

////////////
// Static //
////////////

const generateMakeBlueprintBlock =
  (createBaseFrameArray) =>
  ({ strict, scope }, labels, makeStatementArray) =>
    makeScopeFrameBlock(
      strict,
      scope,
      labels,
      concat(createMetaFrameArray(), createBaseFrameArray()),
      makeStatementArray,
    );

export const makeScopeNormalStaticBlock = generateMakeBlueprintBlock(
  createBlockBaseFrameArray,
);

export const makeScopeDistantStaticBlock = generateMakeBlueprintBlock(
  createDistantBlockBaseFrameArray,
);

export const makeScopeDeadStaticBlock = generateMakeBlueprintBlock(
  createDeadBlockBaseFrameArray,
);

export const makeScopeEmptyStaticBlock = generateMakeBlueprintBlock(
  constant([]),
);

export const makeScopeClosureStaticBlock = generateMakeBlueprintBlock(
  createStaticClosureBaseFrameArray,
);

/////////////
// Dynamic //
/////////////

const generateMakeScopeDynamicBlock =
  (createBaseFrameArray) =>
  ({ strict, scope }, labels, macro, makeStatementArray) =>
    makeScopeFrameBlock(
      strict,
      scope,
      labels,
      concat(createMetaFrameArray(), createBaseFrameArray(macro)),
      makeStatementArray,
    );

export const makeScopeClosureDynamicBlock = generateMakeScopeDynamicBlock(
  createDynamicClosureBaseFrameArray,
);

export const makeScopeWithDynamicBlock = generateMakeScopeDynamicBlock(
  createWithBaseFrameArray,
);
