import {concat, forEach} from "array-lite";

import {
  constant,
  createCounter,
  gaugeCounter,
  assert,
  partial_xx,
  partialxx_x,
  partial_x__,
  partial_x_x,
  partial_xx_x,
  partial__x__,
} from "../../util/index.mjs";

import {
  makeModuleProgram,
  makeGlobalEvalProgram,
  makeExternalLocalEvalProgram,
  makeClosureExpression,
  makeIntrinsicExpression,
  makeEffectStatement,
  makeSequenceEffect,
  makeExpressionEffect,
  makeLiteralExpression,
  makeInputExpression,
} from "../../ast/index.mjs";

import {makeGetExpression} from "../../intrinsic.mjs";

import {BASE, SPEC, META, indexVariable} from "./variable.mjs";

import {encloseScope} from "./core.mjs";

import {
  useStrictScope,
  isStrictScope,
  incrementScopeCounter,
  resetScopeCounter,
  createRootScope,
} from "./binding.mjs";

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
  ENCLAVE,
  ILLEGAL,
  IMPORT_STATIC,
  MACRO,
} from "./frame/index.mjs";

import {
  makeScopeFrameBlock,
  makeScopeFrameScriptProgram,
  declareScope,
  makeScopeInitializeStatementArray,
  makeScopeReadExpression,
  makeScopeTypeofExpression,
  makeScopeDiscardExpression,
  makeScopeWriteEffect,
  makeScopeFrameInternalLocalEvalProgram,
} from "./frame.mjs";

export {packScope, unpackScope} from "./core.mjs";

export {makeScopeEvalExpression} from "./frame.mjs";

export {unmangleVariable} from "./variable.mjs";

const {
  Reflect: {defineProperty},
} = globalThis;

const makeOptimisticWriteEffect = (scope, layer, variable, expression) => {
  const counter = createCounter(0);
  const effect = makeScopeWriteEffect(scope, layer, variable, {
    expression,
    counter,
  });
  assert(gaugeCounter(counter) === 1, "expected single write access");
  return effect;
};

const applyStrict = (strict, scope) => (strict ? useStrictScope(scope) : scope);

//////////
// meta //
//////////

const declareMetaGeneric = (scope, kind, variable, options) => {
  variable = indexVariable(variable, incrementScopeCounter(scope));
  declareScope(scope, kind, META, variable, options);
  return variable;
};

export const declareMeta = partial_x_x(declareMetaGeneric, "define", null);

export const declareMetaMacro = (scope, variable, expression) =>
  declareMetaGeneric(scope, "macro", variable, {binding: expression});

export const makeMetaReadExpression = (scope, meta) =>
  makeScopeReadExpression(scope, META, meta, null);

export const makeMetaWriteEffect = partial_x__(makeOptimisticWriteEffect, META);

export const makeMetaInitializeEffect = makeMetaWriteEffect;

//////////
// spec //
//////////

export const declareSpecMacro = (scope, variable, binding) =>
  declareScope(scope, "macro", SPEC, variable, {binding});

export const declareSpecIllegal = (scope, variable) =>
  declareScope(scope, "illegal", SPEC, variable, {name: variable});

export const declareSpec = partial_xx_x(declareScope, "define", SPEC, null);

export const makeSpecInitializeEffect = partial_x__(
  makeOptimisticWriteEffect,
  SPEC,
);

export const makeSpecReadExpression = partial_x_x(
  makeScopeReadExpression,
  SPEC,
  null,
);

//////////
// base //
//////////

export const declareBaseImport = (scope, variable, source, specifier) =>
  declareScope(scope, "import", BASE, variable, {source, specifier});

export const declareBase = (scope, kind, variable, specifiers) =>
  declareScope(scope, kind, BASE, variable, {exports: specifiers});

export const makeBaseInitializeStatementArray = partial__x__(
  makeScopeInitializeStatementArray,
  BASE,
);

export const makeBaseReadExpression = partial_x_x(
  makeScopeReadExpression,
  BASE,
  null,
);

export const makeBaseTypeofExpression = partial_x_x(
  makeScopeTypeofExpression,
  BASE,
  null,
);

export const makeBaseDiscardExpression = partial_x_x(
  makeScopeDiscardExpression,
  BASE,
  null,
);

export const makeBaseMacroWriteEffect = (scope, variable, macro) =>
  makeScopeWriteEffect(scope, BASE, variable, {
    expression: macro,
    counter: createCounter(0),
  });

export const makeBaseWriteEffect = (scope, variable, expression) => {
  const counter = createCounter(0);
  const effect = makeScopeWriteEffect(scope, BASE, variable, {
    expression,
    counter,
  });
  if (gaugeCounter(counter) === 0) {
    return makeSequenceEffect(makeExpressionEffect(expression), effect);
  } else if (gaugeCounter(counter) === 1) {
    return effect;
  } else {
    const meta = declareMeta(scope, "right");
    return makeSequenceEffect(
      makeMetaWriteEffect(scope, meta, expression),
      makeBaseMacroWriteEffect(
        scope,
        variable,
        makeMetaReadExpression(scope, meta),
      ),
    );
  }
};

///////////////
// Blueprint //
///////////////

const createMetaFrameArray = () => [
  createFrame(DEFINE_STATIC, META, {}),
  createFrame(MACRO, META, {}),
];

const createTransparentMetaFrameArray = () => [
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

const createTransparentSpecFrameArray = () => [
  createFrame(MACRO, SPEC, {}),
  createFrame(ILLEGAL, SPEC, {}),
];

const createExternalGlobalBaseFrameArray = (macros) => [
  createFrame(ENCLAVE, BASE, {macros}),
];

const createInternalGlobalBaseFrameArray = (enclave) =>
  enclave
    ? [
        createFrame(ENCLAVE, BASE, {
          macros: {
            read: makeIntrinsicExpression("aran.readGlobal"),
            typeof: makeIntrinsicExpression("aran.typeofGlobal"),
            discardSloppy: makeIntrinsicExpression("aran.discardGlobalSloppy"),
            discardStrict: makeLiteralExpression(
              "delete unqualified identifier should never happen in strict mode",
            ),
            writeSloppy: makeIntrinsicExpression("aran.writeGlobalSloppy"),
            writeStrict: makeIntrinsicExpression("aran.writeGlobalStrict"),
          },
        }),
      ]
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

const createEvalBaseFrameArray = (strict) =>
  concat(strict ? [createFrame(CLOSURE_STATIC, BASE, {})] : [], [
    createFrame(BLOCK_STATIC, BASE, {distant: false}),
  ]);

const createModuleBaseFrameArray = () => [
  createFrame(CLOSURE_STATIC, BASE, {}),
  createFrame(BLOCK_STATIC, BASE, {distant: false}),
  createFrame(IMPORT_STATIC, BASE, {}),
];

const createStaticClosureBaseFrameArray = () => [
  createFrame(CLOSURE_STATIC, BASE, {}),
  createFrame(BLOCK_STATIC, BASE, {distant: false}),
];

const createDynamicClosureBaseFrameArray = (macro) => [
  createFrame(CLOSURE_DYNAMIC, BASE, {macro, observable: false}),
  createFrame(BLOCK_STATIC, BASE, {distant: false}),
];

const createWithBaseFrameArray = (macro) => [
  createFrame(EMPTY_DYNAMIC_WITH, BASE, {macro, observable: true}),
  createFrame(BLOCK_STATIC, BASE, {distant: false}),
];

const createBlockBaseFrameArray = () => [
  createFrame(BLOCK_STATIC, BASE, {distant: false}),
];

const createDistantBlockBaseFrameArray = () => [
  createFrame(BLOCK_STATIC, BASE, {distant: true}),
];

const createDeadBlockBaseFrameArray = () => [
  createFrame(BLOCK_STATIC_DEAD, BASE, {}),
];

//////////////////////
// makeDynamicBlock //
//////////////////////

const generateMakeScopeDynamicBlock =
  (createBaseFrameArray) =>
  (scope, {labels, frame: macro}, makeStatementArray) =>
    makeScopeFrameBlock(
      scope,
      labels,
      concat(createMetaFrameArray(), createBaseFrameArray(macro)),
      makeStatementArray,
    );

export const makeScopeDynamicClosureBlock = generateMakeScopeDynamicBlock(
  createDynamicClosureBaseFrameArray,
);

export const makeScopeDynamicWithBlock = generateMakeScopeDynamicBlock(
  createWithBaseFrameArray,
);

///////////////////////////////////////
// makeScopeExternalLocalEvalProgram //
///////////////////////////////////////

const enclave_name_array = [
  "read",
  "typeof",
  "discardStrict",
  "discardSloppy",
  "writeStrict",
  "writeSloppy",
];

const populateEnclave = (scope, macros, name, variable) => {
  defineProperty(macros, name, {
    __proto__: null,
    value: makeGetExpression(
      makeMetaReadExpression(scope, variable),
      makeLiteralExpression(`scope.${name}`),
    ),
    writable: true,
    configurable: true,
    enumerable: true,
  });
};

const makeEnclaveStatementArray = (scope, macros, makeStatementArray) => {
  const variable = declareMeta(scope, "input");
  forEach(
    enclave_name_array,
    partialxx_x(populateEnclave, scope, macros, variable),
  );
  return concat(
    [
      makeEffectStatement(
        makeMetaWriteEffect(scope, variable, makeInputExpression()),
      ),
    ],
    makeStatementArray(scope),
  );
};

export const makeScopeExternalLocalEvalProgram = (
  {strict, specials, counter},
  makeStatementArray,
) => {
  const macros = {};
  return makeExternalLocalEvalProgram(
    specials,
    makeScopeFrameBlock(
      applyStrict(strict, createRootScope(counter)),
      [],
      concat(
        createMetaFrameArray(),
        createSpecFrameArray(),
        createExternalGlobalBaseFrameArray(macros),
        createEvalBaseFrameArray(strict),
      ),
      partial_xx(makeEnclaveStatementArray, macros, makeStatementArray),
    ),
  );
};

/////////////////////
// makeGlobalBlock //
/////////////////////

export const makeScopeScriptProgram = (
  {strict, enclave, counter},
  makeStatementArray,
) =>
  makeScopeFrameScriptProgram(
    applyStrict(strict, createRootScope(counter)),
    concat(
      createTransparentMetaFrameArray(),
      createTransparentSpecFrameArray(),
      createInternalGlobalBaseFrameArray(enclave),
    ),
    makeStatementArray,
  );

export const makeScopeModuleProgram = (
  {enclave, counter, links},
  makeStatementArray,
) =>
  makeModuleProgram(
    links,
    makeScopeFrameBlock(
      useStrictScope(createRootScope(counter)),
      [],
      concat(
        createMetaFrameArray(),
        createSpecFrameArray(),
        createInternalGlobalBaseFrameArray(enclave),
        createModuleBaseFrameArray(),
      ),
      makeStatementArray,
    ),
  );

export const makeScopeGlobalEvalProgram = (
  {strict, enclave, counter},
  makeStatementArray,
) =>
  makeGlobalEvalProgram(
    makeScopeFrameBlock(
      applyStrict(strict, createRootScope(counter)),
      [],
      concat(
        createMetaFrameArray(),
        createSpecFrameArray(),
        createInternalGlobalBaseFrameArray(enclave),
        createEvalBaseFrameArray(strict),
      ),
      makeStatementArray,
    ),
  );

////////////////////////
// makeBluePrintBlock //
////////////////////////

const generateMakeBlueprintBlock =
  (createBaseFrameArray) =>
  (scope, {labels}, makeStatementArray) =>
    makeScopeFrameBlock(
      scope,
      labels,
      concat(createMetaFrameArray(), createBaseFrameArray()),
      makeStatementArray,
    );

export const makeScopeBlock = generateMakeBlueprintBlock(
  createBlockBaseFrameArray,
);

export const makeScopeDistantBlock = generateMakeBlueprintBlock(
  createDistantBlockBaseFrameArray,
);

export const makeScopeDeadBlock = generateMakeBlueprintBlock(
  createDeadBlockBaseFrameArray,
);

export const makeScopeEmptyBlock = generateMakeBlueprintBlock(constant([]));

export const makeScopeStaticClosureBlock = generateMakeBlueprintBlock(
  createStaticClosureBaseFrameArray,
);

///////////
// Other //
///////////

export const makeScopeClosureExpression = (
  scope,
  {strict, type, asynchronous, generator},
  makeStatementArray,
) =>
  makeClosureExpression(
    type,
    asynchronous,
    generator,
    makeScopeFrameBlock(
      encloseScope(applyStrict(strict, scope)),
      [],
      concat(
        createMetaFrameArray(),
        createSpecFrameArray(),
        createBlockBaseFrameArray(),
      ),
      makeStatementArray,
    ),
  );

export const makeScopeInternalLocalEvalProgram = (
  scope,
  {strict, counter},
  makeStatementArray,
) => {
  resetScopeCounter(scope, counter);
  scope = applyStrict(strict, scope);
  return makeScopeFrameInternalLocalEvalProgram(
    scope,
    concat(
      createMetaFrameArray(),
      createSpecFrameArray(),
      createEvalBaseFrameArray(isStrictScope(scope)),
    ),
    makeStatementArray,
  );
};
