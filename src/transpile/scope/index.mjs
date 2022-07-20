import {concat, forEach} from "array-lite";

import {
  constant,
  incrementCounter,
  createCounter,
  gaugeCounter,
  assert,
  partial_x_x,
  partialxx_x,
  partialx_xxx,
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
  makeScopeEvalExpression as makeScopeEvalExpression_,
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
// Eval //
//////////

export const makeScopeEvalExpression = ({strict, scope}, expression) =>
  makeScopeEvalExpression_(strict, scope, expression);

//////////
// meta //
//////////

const declareMetaGeneric = (
  {strict, scope, counter},
  kind,
  variable,
  options,
) => {
  variable = indexVariable(variable, incrementCounter(counter));
  declareScope(strict, scope, kind, META, variable, options);
  return variable;
};

export const declareMeta = partial_x_x(declareMetaGeneric, "define", null);

export const declareMetaMacro = (scoping, variable, expression) =>
  declareMetaGeneric(scoping, "macro", variable, {
    binding: expression,
  });

export const makeMetaReadExpression = ({strict, scope}, meta) =>
  makeScopeReadExpression(strict, scope, META, meta, null);

export const makeMetaWriteEffect = ({strict, scope}, meta, expression) =>
  makeOptimisticWriteEffect(strict, scope, META, meta, expression);

export const makeMetaInitializeEffect = makeMetaWriteEffect;

//////////
// spec //
//////////

export const declareSpecMacro = ({strict, scope}, variable, binding) =>
  declareScope(strict, scope, "macro", SPEC, variable, {binding});

export const declareSpecIllegal = ({strict, scope}, variable) =>
  declareScope(strict, scope, "illegal", SPEC, variable, {name: variable});

export const declareSpec = ({strict, scope}, variable) =>
  declareScope(strict, scope, "define", SPEC, variable, null);

export const makeSpecInitializeEffect = (
  {strict, scope},
  variable,
  expression,
) => makeOptimisticWriteEffect(strict, scope, SPEC, variable, expression);

export const makeSpecReadExpression = ({strict, scope}, variable) =>
  makeScopeReadExpression(strict, scope, SPEC, variable, null);

//////////
// base //
//////////

export const declareBaseImport = (
  {strict, scope},
  variable,
  source,
  specifier,
) => declareScope(strict, scope, "import", BASE, variable, {source, specifier});

export const declareBase = ({strict, scope}, kind, variable, specifiers) =>
  declareScope(strict, scope, kind, BASE, variable, {exports: specifiers});

export const makeBaseInitializeStatementArray = (
  {strict, scope},
  kind,
  variable,
  expression,
) =>
  makeScopeInitializeStatementArray(
    strict,
    scope,
    kind,
    BASE,
    variable,
    expression,
  );

export const makeBaseReadExpression = ({strict, scope}, variable) =>
  makeScopeReadExpression(strict, scope, BASE, variable, null);

export const makeBaseTypeofExpression = ({strict, scope}, variable) =>
  makeScopeTypeofExpression(strict, scope, BASE, variable, null);

export const makeBaseDiscardExpression = ({strict, scope}, variable) =>
  makeScopeDiscardExpression(strict, scope, BASE, variable, null);

export const makeBaseMacroWriteEffect = ({strict, scope}, variable, macro) =>
  makeScopeWriteEffect(strict, scope, BASE, variable, {
    expression: macro,
    counter: createCounter(0),
  });

export const makeBaseWriteEffect = (scoping, variable, expression) => {
  const {strict, scope} = scoping;
  const counter = createCounter(0);
  const effect = makeScopeWriteEffect(strict, scope, BASE, variable, {
    expression,
    counter,
  });
  if (gaugeCounter(counter) === 0) {
    return makeSequenceEffect(makeExpressionEffect(expression), effect);
  } else if (gaugeCounter(counter) === 1) {
    return effect;
  } else {
    const meta = declareMeta(scoping, "right");
    return makeSequenceEffect(
      makeMetaWriteEffect(scoping, meta, expression),
      makeBaseMacroWriteEffect(
        scoping,
        variable,
        makeMetaReadExpression(scoping, meta),
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
  ({strict, scope}, labels, macro, makeStatementArray) =>
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

const populateEnclave = (scoping, macros, name, variable) => {
  defineProperty(macros, name, {
    __proto__: null,
    value: makeGetExpression(
      makeMetaReadExpression(scoping, variable),
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
  const scoping = {strict, scope, counter};
  const variable = declareMeta(scoping, "input");
  forEach(
    enclave_name_array,
    partialxx_x(populateEnclave, scoping, macros, variable),
  );
  return concat(
    [
      makeEffectStatement(
        makeMetaWriteEffect(scoping, variable, makeInputExpression()),
      ),
    ],
    makeStatementArray(scope),
  );
};

export const makeScopeExternalLocalEvalProgram = (
  {strict, scope, counter},
  enclave,
  specials,
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
  {strict, scope},
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
  {strict, scope},
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
  {strict, scope},
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
  (createBaseFrameArray) =>
  ({strict, scope}, labels, makeStatementArray) =>
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
  {strict, scope},
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
  {strict, scope},
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
