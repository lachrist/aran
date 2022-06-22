import {flatMap, concat, map, forEach} from "array-lite";

import {
  assert,
  partialx_,
  partial_xx,
  partialxx_,
  partial__x_x_,
  partial__x_,
} from "../../util/index.mjs";

import {
  makeModuleProgram as makeRawModuleProgram,
  makeGlobalEvalProgram as makeRawGlobalEvalProgram,
  makeExternalLocalEvalProgram as makeRawExternalLocalEvalProgram,
  makeInternalLocalEvalProgram as makeRawInternalLocalEvalProgram,
  makeClosureExpression as makeRawClosureExpression,
  makeIntrinsicExpression,
  makeEffectStatement,
  makeSequenceEffect,
  makeExpressionEffect,
  makeLiteralExpression,
  makeInputExpression,
} from "../../ast/index.mjs";

import {makeGetExpression} from "../../intrinsic.mjs";

import {
  BASE,
  SPEC,
  META,
  makeVariableBody,
  makeIndexedVariableBody,
} from "./variable.mjs";

import {
  // pack,
  unpack,
  enclose,
} from "./structure.mjs";

import {
  useStrict,
  isStrict,
  incrementGlobalCounter,
  resetGlobalCounter,
  createRoot,
} from "./property.mjs";

import {
  create as createFrame,
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
  IMPORT_STATIC,
} from "./frame/index.mjs";

import {
  makeChainBlock,
  makeChainScriptProgram,
  makeDeclareStatements,
  makeInitializeStatements,
  makeLookupExpression,
  makeLookupEffect,
} from "./chain.mjs";

export {makeEvalExpression} from "./chain.mjs";

const {
  Object: {fromEntries},
} = globalThis;

//////////
// meta //
//////////

const declareMetaGeneric = (scope, kind, variable, options) => {
  variable = indexVariable(name, incrementGlobalCounter(scope));
  declare(scope, kind, META, variable, options);
  return variable;
};

export const declareMeta = partial_x_x(declareMetaGeneric, "define", null);

export const declareMetaMacro = (scope, variable, expression) =>
  declareMetaGeneric(scope, "macro", variable, {binding: expression});

export const makeMetaReadExpression = (scope, meta) =>
  makeReadExpression(scope, META, meta, null);

export const makeMetaWriteEffect = (scope, meta, expression) => {
  const counter = createCounter(0);
  const effect = makeLookupEffect(scope, META, meta, {expression, counter});
  assert(gaugeCounter(counter) === 1, "expected single write access");
  return effect;
};

//////////
// spec //
//////////

export const declareSpecMacro = (scope, variable, binding) =>
  declare(scope, "macro", SPEC, variable, {binding});

export const declareSpecIllegal = (scope, variable) =>
  declare(scope, "illegal", SPEC, variable, {name: variable});

export const declareSpec = partial_xx_x(declare, "define", SPEC, null);

export const makeSpecInitializeStatementArray = partial_xx__(
  makeInitializeStatementArray,
  "define",
  SPEC,
);

export const makeSpecReadExpression = (scope, variable) =>
  partial_x_x(makeReadExpression, SPEC, null);

//////////
// base //
//////////

export const declareBaseImport = (scope, variable, source, specifier) =>
  declare(scope, "import", variable, {source, specifier});

export const declareBase = (scope, kind, variable, specifiers) =>
  declare(scope, kind, BASE, variable, {exports: specifiers});

export const makeBaseInitializeStatementArray = partial__x__(
  makeInitializeStatementArray,
  BASE,
);

export const makeBaseReadExpression = partial_x_x(
  makeReadExpression,
  BASE,
  null,
);

export const makeBaseTypeofExpression = partial_x_x(
  makeTypeofExpression,
  BASE,
  null,
);

export const makeBaseDiscardExpression = partial_x_x(
  makeDiscardExpression,
  BASE,
  null,
);

export const makeBaseMacroWriteEffect = (scope, variable, macro) =>
  makeWriteEffect(scope, BASE, makeVariableBody(variable), {
    expression: macro,
    counter: createCounter(0),
  });

export const makeBaseWriteEffect = (scope, variable, expression) => {
  const counter = createCounter(0);
  const effect = makeWriteEffect(scope, BASE, variable, {
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

//////////////////////
// makeDynamicBlock //
//////////////////////

const makeDynamicBlock = (
  scope,
  labels,
  type,
  variable,
  observable,
  makeStatementArray,
) =>
  makeBlock(
    scope,
    labels,
    [
      createFrame(MACRO, META, {}),
      createFrame(DEFINE_STATIC, META, {}),
      createFrame(type, BASE, {
        macro: makeMetaReadExpression(scope, variable),
        observable,
      }),
      createFrame(BLOCK_STATIC, BASE, {distant: false}),
    ],
    makeStatementArray,
  );

export const makeScopeDynamicClosureBlock = partial__x_x_(
  makeDynamicBlock,
  CLOSURE_DYNAMIC,
  false,
);

export const makeScopeWithBlock = partial__x_x_(
  makeDynamicBlock,
  EMPTY_DYNAMIC_WITH,
  true,
);

///////////////////////////////////////
// makeScopeExternalLocalEvalProgram //
///////////////////////////////////////

const enclave_presence_entries = [
  ["read", true],
  ["typeof", true],
  ["discardStrict", false],
  ["discardSloppy", null],
  ["writeStrict", true],
  ["writeSloppy", null],
];

const makeDummyEnclaveEntry = ([name]) => [
  name,
  makeLiteralExpression(`dummy-${name}`),
];

const declareEnclave = (scope, [name, presence]) => [
  enclave,
  presence === false || (presence === null && isStrict(scope))
    ? null
    : declareMeta(scope, `enclave.${name}`),
];

const initializeEnclave = (scope, [name, variable]) =>
  variable === null
    ? []
    : [
        makeEffectStatement(
          makeMetaWriteEffect(
            scope,
            variable,
            makeGetExpression(makeInputExpression(), `scope.${name}`),
          ),
        ),
      ];

const populateEnclave = (scope, macros, [name, variable]) => {
  defineProperty(macros, name, {
    __proto__: null,
    value:
      variable === null
        ? makeLiteralExpression(`unexpected call to enclave.${name}`)
        : makeMetaReadExpression(scope, variable),
    writable: true,
    configurable: true,
    enumerable: true,
  });
};

const makeEnclaveStatementArray = (scope, macros, makeStatementArray) => {
  const entries = map(
    enclave_presence_entries,
    partialx_(declareEnclave, scope),
  );
  forEach(entries, partialxx_(populateEnclave, scope, macros));
  return concat(
    flatMap(entries, partialx_(initializeEnclave, scope)),
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
    makeBlock(
      strict ? useStrict(createRoot(counter)) : createRoot(counter),
      [],
      concat(
        [
          createFrame(MACRO, META, {}),
          createFrame(DEFINE_STATIC, META, {}),
          createFrame(ILLEGAL, SPEC, {}),
          createFrame(MACRO, SPEC, {}),
          createFrame(DEFINE, SPEC, {}),
          createFrame(ENCLAVE, BASE, {macros}),
        ],
        strict ? [createFrame(CLOSURE_STATIC, BASE, {})] : [],
        [createFrame(BLOCK_STATIC, BASE, {distant: false})],
      ),
      partial_xx(makeEnclaveStatementArray, macros, makeStatementArray),
    ),
  );
};

/////////////////////
// makeGlobalBlock //
/////////////////////

const makeGlobalBaseFrameArray = (enclave) =>
  enclave
    ? [
        createFrame(ENCLAVE, BASE, {
          read: makeIntrinsicExpression("aran.readGlobal"),
          typeof: makeIntrinsicExpression("aran.typeofGlobal"),
          discardSloppy: makeIntrinsicExpression("aran.discardGlobalSloppy"),
          discardStrict: makeLiteralExpression(
            "delete unqualified identifier should never happen in strict mode",
          ),
          writeSloppy: makeIntrinsicExpression("aran.writeGlobalSloppy"),
          writeStrict: makeIntrinsicExpression("aran.writeGlobalStrict"),
        }),
      ]
    : [
        createFrame(EMPTY_VOID, BASE, {
          dynamic: makeIntrinsicExpression("aran.globalObject"),
          observable: true,
        }),
        createFrame(CLOSURE_DYNAMIC, BASE, {
          dynamic: makeIntrinsicExpression("aran.globalObject"),
          observable: true,
        }),
        createFrame(BLOCK_DYNAMIC, BASE, {
          dynamic: makeIntrinsicExpression("aran.globalRecord"),
          observable: false,
        }),
      ];

export const makeScopeScriptProgram = (
  {strict, enclave, counter},
  makeStatementArray,
) =>
  makeChainScriptProgram(
    strict ? useStrict(createRoot(counter)) : createRoot(counter),
    concat(
      [
        createFrame(MACRO, META, {}),
        createFrame(DEFINE_DYNAMIC, META, {
          macro: makeIntrinsicExpression("aran.globalCache"),
        }),
        createFrame(INTRINSIC, SPEC, {}),
        createFrame(ILLEGAL, SPEC, {}),
      ],
      makeGlobalBaseFrameArray(enclave),
    ),
    makeStatementArray,
  );

export const makeScopeModuleProgram = (
  {enclave, counter, links},
  makeStatementArray,
) =>
  makeModuleProgram(
    links,
    makeChainBlock(
      useStrict(createRoot(counter)),
      [],
      concat(
        [
          createFrame(MACRO, META, {}),
          createFrame(DEFINE_STATIC, META, {}),
          createFrame(DEFINE_STATIC, SPEC, {}),
          createFrame(INTRINSIC, SPEC, {}),
          createFrame(ILLEGAL, SPEC, {}),
        ],
        makeGlobalBaseFrameArray(enclave),
        [
          createFrame(CLOSURE_STATIC, BASE, {}),
          createFrame(BLOCK_STATIC, BASE, {distant: false}),
          createFrame(IMPORT_STATIC, BASE, {}),
        ],
      ),
      makeStatementArray,
    ),
  );

export const makeScopeGlobalEvalProgram = (
  {strict, enclave, counter},
  makeStatementArray,
) =>
  makeGlobalEvalProgram(
    makeChainBlock(
      strict ? useStrict(createRoot(counter)) : createRoot(counter),
      [],
      concat(
        [
          createFrame(DEFINE_STATIC, META, {}),
          createFrame(DEFINE_STATIC, SPEC, {}),
          createFrame(INTRINSIC, SPEC, {}),
          createFrame(ILLEGAL, SPEC, {}),
        ],
        makeGlobalBaseFrameArray(enclave),
        strict ? [createFrame(CLOSURE_STATIC, BASE, {})] : [],
        [createFrame(BLOCK_STATIC, BASE, {distant: false})],
      ),
      makeStatementArray,
    ),
  );

////////////////////////
// makeBluePrintBlock //
////////////////////////

const createBlueprintFrame = ([type, layer, options]) =>
  createFrame(type, layer, options);

const makeBlueprintBlock = (scope, labels, blueprints, makeStatementArray) =>
  makeBlock(
    scope,
    labels,
    map(blueprints, createBlueprintFrame),
    makeStatementArray,
  );

export const makeScopeStaticClosureBlock = partial__x_(makeBlueprintBlock, [
  [MACRO, META, {}],
  [DEFINE_STATIC, META, {}],
  [CLOSURE_STATIC, BASE, {}],
  [BLOCK_STATIC, BASE, {distant: false}],
]);

export const makeScopeBlock = partial__x_(makeBlueprintBlock, [
  [MACRO, META, {}],
  [DEFINE_STATIC, META, {}],
  [BLOCK_STATIC, BASE, {distant: false}],
]);

export const makeScopeDistantBlock = partial__x_(makeBlueprintBlock, [
  [MACRO, META, {}],
  [DEFINE_STATIC, META, {}],
  [BLOCK_STATIC, META, {distant: true}],
]);

export const makeScopeEmptyBlock = partial__x_(makeBlueprintBlock, [
  [MACRO, META, {}],
  [DEFINE_STATIC, META, {}],
]);

export const makeScopeDeadBlock = partial__x_(makeBlueprintBlock, [
  [MACRO, META, {}],
  [DEFINE_STATIC, META, {}],
  [BLOCK_STATIC_DEAD, BASE, {}],
]);

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
    makeChainBlock(
      strict ? useStrict(enclose(scope)) : enclose(scope),
      [],
      [
        createFrame(MACRO, META, {}),
        createFrame(DEFINE_STATIC, META, {}),
        createFrame(ILLEGAL, SPEC, {}),
        createFrame(MACRO, SPEC, {}),
        createFrame(DEFINE_STATIC, SPEC, {}),
        createFrame(BLOCK_STATIC, BASE, {distant: false}),
      ],
      makeStatementArray,
    ),
  );

export const makeScopeInternalLocalEvalProgram = (
  {variables, strict, counter},
  packed_scope,
  makeStatementArray,
) => {
  const scope = unpack(packed_scope);
  resetGlobalCounter(scope, counter);
  return makeInternalLocalEvalProgram(
    variables,
    makeChainBlock(
      strict ? useStrict(scope) : scope,
      [],
      concat(
        [
          createFrame(MACRO, META, {}),
          createFrame(DEFINE_STATIC, META, {}),
          createFrame(ILLEGAL, SPEC, {}),
          createFrame(MACRO, SPEC, {}),
          createFrame(DEFINE_STATIC, SPEC, {}),
        ],
        strict ? [createFrame(CLOSURE_STATIC, BASE, {})] : [],
        [createFrame(BLOCK_STATIC, BASE, {distant: false})],
      ),
      makeStatementArray,
    ),
  );
};
