import {concat, forEach} from "array-lite";

import {
  constant,
  incrementCounter,
  createCounter,
  gaugeCounter,
  assert,
  partialxxx_x,
  partialx_xxx,
  partial__x_x,
  partial__x__,
  partial__x__x,
  partial__xx_x,
  partial___x__,
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

export {ROOT_SCOPE, packScope, unpackScope} from "./core.mjs";

export {makeScopeEvalExpression} from "./frame.mjs";

export {unmangleVariable} from "./variable.mjs";

const {
  Reflect: {defineProperty},
} = globalThis;

const makeOptimisticWriteEffect = (
  strict,
  scope,
  layer,
  variable,
  expression,
) => {
  const counter = createCounter(0);
  const effect = makeScopeWriteEffect(strict, scope, layer, variable, {
    expression,
    counter,
  });
  assert(gaugeCounter(counter) === 1, "expected single write access");
  return effect;
};

//////////
// meta //
//////////

const declareMetaGeneric = (
  strict,
  scope,
  kind,
  counter,
  variable,
  options,
) => {
  variable = indexVariable(variable, incrementCounter(counter));
  declareScope(strict, scope, kind, META, variable, options);
  return variable;
};

export const declareMeta = partial__x__x(declareMetaGeneric, "define", null);

export const declareMetaMacro = (
  strict,
  scope,
  counter,
  variable,
  expression,
) =>
  declareMetaGeneric(strict, scope, "macro", counter, variable, {
    binding: expression,
  });

export const makeMetaReadExpression = (strict, scope, meta) =>
  makeScopeReadExpression(strict, scope, META, meta, null);

export const makeMetaWriteEffect = partial__x__(
  makeOptimisticWriteEffect,
  META,
);

export const makeMetaInitializeEffect = makeMetaWriteEffect;

//////////
// spec //
//////////

export const declareSpecMacro = (strict, scope, variable, binding) =>
  declareScope(strict, scope, "macro", SPEC, variable, {binding});

export const declareSpecIllegal = (strict, scope, variable) =>
  declareScope(strict, scope, "illegal", SPEC, variable, {name: variable});

export const declareSpec = partial__xx_x(declareScope, "define", SPEC, null);

export const makeSpecInitializeEffect = partial__x__(
  makeOptimisticWriteEffect,
  SPEC,
);

export const makeSpecReadExpression = partial__x_x(
  makeScopeReadExpression,
  SPEC,
  null,
);

//////////
// base //
//////////

export const declareBaseImport = (strict, scope, variable, source, specifier) =>
  declareScope(strict, scope, "import", BASE, variable, {source, specifier});

export const declareBase = (strict, scope, kind, variable, specifiers) =>
  declareScope(strict, scope, kind, BASE, variable, {exports: specifiers});

export const makeBaseInitializeStatementArray = partial___x__(
  makeScopeInitializeStatementArray,
  BASE,
);

export const makeBaseReadExpression = partial__x_x(
  makeScopeReadExpression,
  BASE,
  null,
);

export const makeBaseTypeofExpression = partial__x_x(
  makeScopeTypeofExpression,
  BASE,
  null,
);

export const makeBaseDiscardExpression = partial__x_x(
  makeScopeDiscardExpression,
  BASE,
  null,
);

export const makeBaseMacroWriteEffect = (strict, scope, variable, macro) =>
  makeScopeWriteEffect(strict, scope, BASE, variable, {
    expression: macro,
    counter: createCounter(0),
  });

export const makeBaseWriteEffect = (
  strict,
  scope,
  counter1,
  variable,
  expression,
) => {
  const counter2 = createCounter(0);
  const effect = makeScopeWriteEffect(strict, scope, BASE, variable, {
    expression,
    counter: counter2,
  });
  if (gaugeCounter(counter2) === 0) {
    return makeSequenceEffect(makeExpressionEffect(expression), effect);
  } else if (gaugeCounter(counter2) === 1) {
    return effect;
  } else {
    const meta = declareMeta(strict, scope, counter1, "right");
    return makeSequenceEffect(
      makeMetaWriteEffect(strict, scope, meta, expression),
      makeBaseMacroWriteEffect(
        strict,
        scope,
        variable,
        makeMetaReadExpression(strict, scope, meta),
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
  (strict, scope, labels, macro, makeStatementArray) =>
    makeScopeFrameBlock(
      strict,
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

const populateEnclave = (strict, scope, macros, name, variable) => {
  defineProperty(macros, name, {
    __proto__: null,
    value: makeGetExpression(
      makeMetaReadExpression(strict, scope, variable),
      makeLiteralExpression(`scope.${name}`),
    ),
    writable: true,
    configurable: true,
    enumerable: true,
  });
};

const makeEnclaveStatementArray = (
  strict,
  scope,
  counter,
  macros,
  makeStatementArray,
) => {
  const variable = declareMeta(strict, scope, counter, "input");
  forEach(
    enclave_name_array,
    partialxxx_x(populateEnclave, strict, scope, macros, variable),
  );
  return concat(
    [
      makeEffectStatement(
        makeMetaWriteEffect(strict, scope, variable, makeInputExpression()),
      ),
    ],
    makeStatementArray(scope),
  );
};

export const makeScopeExternalLocalEvalProgram = (
  strict,
  scope,
  enclave,
  specials,
  counter,
  makeStatementArray,
) => {
  assert(
    enclave === true,
    "external local eval program should always be enclave",
  );
  const macros = {};
  return makeExternalLocalEvalProgram(
    specials,
    makeScopeFrameBlock(
      strict,
      scope,
      [],
      concat(
        createMetaFrameArray(),
        createSpecFrameArray(),
        createExternalGlobalBaseFrameArray(macros),
        createEvalBaseFrameArray(strict),
      ),
      partialx_xxx(
        makeEnclaveStatementArray,
        strict,
        counter,
        macros,
        makeStatementArray,
      ),
    ),
  );
};

/////////////////////
// makeGlobalBlock //
/////////////////////

export const makeScopeScriptProgram = (
  strict,
  scope,
  enclave,
  makeStatementArray,
) =>
  makeScopeFrameScriptProgram(
    strict,
    scope,
    concat(
      createTransparentMetaFrameArray(),
      createTransparentSpecFrameArray(),
      createInternalGlobalBaseFrameArray(enclave),
    ),
    makeStatementArray,
  );

export const makeScopeModuleProgram = (
  strict,
  scope,
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
        createInternalGlobalBaseFrameArray(enclave),
        createModuleBaseFrameArray(),
      ),
      makeStatementArray,
    ),
  );
};

export const makeScopeGlobalEvalProgram = (
  strict,
  scope,
  enclave,
  makeStatementArray,
) =>
  makeGlobalEvalProgram(
    makeScopeFrameBlock(
      strict,
      scope,
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
  (createBaseFrameArray) => (strict, scope, labels, makeStatementArray) =>
    makeScopeFrameBlock(
      strict,
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
  strict,
  scope,
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
      encloseScope(scope),
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
  strict,
  scope,
  enclave,
  makeStatementArray,
) => {
  assert(
    enclave === false,
    "internal local eval program should not be enclave",
  );
  return makeScopeFrameInternalLocalEvalProgram(
    strict,
    scope,
    concat(
      createMetaFrameArray(),
      createSpecFrameArray(),
      createEvalBaseFrameArray(strict),
    ),
    makeStatementArray,
  );
};
