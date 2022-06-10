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
  makeModuleProgram,
  makeGlobalEvalProgram,
  makeExternalLocalEvalProgram,
  makeInternalLocalEvalProgram,
  makeIntrinsicExpression,
  makeClosureExpression,
  makeEffectStatement,
  makeSequenceEffect,
  makeExpressionEffect,
  makeLiteralExpression,
  makeInputExpression,
} from "../../ast/index.mjs";

import {makeGetExpression} from "../../intrinsic.mjs";

import {
  BASE,
  META,
  makeVariableBody,
  makeIndexedVariableBody,
} from "./variable.mjs";

import {
  makeRead,
  makeTypeof,
  makeDiscard,
  makeWrite,
  accountWrite,
} from "./right.mjs";

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

const {
  Object: {fromEntries},
} = globalThis;

//////////
// meta //
//////////

const declareMeta = (scope, name) => {
  const meta = makeIndexedVariableBody(name, incrementGlobalCounter(scope));
  const statements = makeDeclareStatements(scope, "def", META, meta, null, []);
  assert(statements.length === 0, "unexpected declare statement for meta");
  return meta;
};

export const makeMetaReadExpression = (scope, meta) =>
  makeLookupExpression(scope, META, meta, makeRead());

export const makeMetaWriteEffect = (scope, meta, expression) => {
  const right = makeWrite(expression);
  const effect = makeLookupEffect(scope, META, meta, makeWrite(expression));
  assert(accountWrite(right) === 1, "expected single write access");
  return effect;
};

//////////
// base //
//////////

export const makeBaseDeclareStatementArray = (
  scope,
  kind,
  variable,
  iimport,
  eexports,
) =>
  makeDeclareStatements(
    scope,
    kind,
    BASE,
    makeVariableBody(variable),
    iimport,
    eexports,
  );

export const makeBaseInitializeStatementArray = (
  scope,
  kind,
  variable,
  expression,
) =>
  makeInitializeStatements(
    scope,
    kind,
    BASE,
    makeVariableBody(variable),
    expression,
  );

export const makeBaseReadExpression = (scope, variable) =>
  makeLookupExpression(scope, BASE, makeVariableBody(variable), makeRead());

export const makeBaseTypeofExpression = (scope, variable) =>
  makeLookupExpression(scope, BASE, makeVariableBody(variable), makeTypeof());

export const makeBaseDiscardExpression = (scope, variable) =>
  makeLookupExpression(scope, BASE, makeVariableBody(variable), makeDiscard());

export const makeBaseMetaWriteEffect = (scope, variable, meta) =>
  makeLookupEffect(
    scope,
    BASE,
    makeVariableBody(variable),
    makeWrite(makeMetaReadExpression(scope, meta)),
  );

export const makeBasePrimitiveWriteEffect = (scope, variable, primitive) =>
  makeLookupEffect(
    scope,
    BASE,
    makeVariableBody(variable),
    makeWrite(makeLiteralExpression(primitive)),
  );

export const makeBaseIntrinsicWriteEffect = (scope, variable, intrinsic) =>
  makeLookupEffect(
    scope,
    BASE,
    makeVariableBody(variable),
    makeWrite(makeIntrinsicExpression(intrinsic)),
  );

export const makeBaseWriteEffect = (scope, variable, expression) => {
  const right = makeWrite(expression);
  const effect = makeLookupEffect(
    scope,
    BASE,
    makeVariableBody(variable),
    right,
  );
  const access = accountWrite(right);
  if (access === 0) {
    return makeSequenceEffect(makeExpressionEffect(expression), effect);
  } else if (access === 1) {
    return effect;
  } else {
    const meta = declareMeta(scope, "right");
    return makeSequenceEffect(
      makeMetaWriteEffect(scope, meta, expression),
      makeBaseMetaWriteEffect(scope, variable, meta),
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
  meta,
  observable,
  makeStatementArray,
) =>
  makeChainBlock(
    scope,
    labels,
    [
      createFrame(DEFINE_STATIC, META, {}),
      createFrame(type, BASE, {
        dynamic: makeMetaReadExpression(scope, meta),
        observable,
      }),
      createFrame(BLOCK_STATIC, BASE, {distant: false}),
    ],
    makeStatementArray,
  );

export const makeDynamicClosureBlock = partial__x_x_(
  makeDynamicBlock,
  CLOSURE_DYNAMIC,
  false,
);

export const makeWithBlock = partial__x_x_(
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
  ["discardStrict", false][("discardSloppy", null)],
  ["writeStrict", true][("writeSloppy", null)],
];

const makeDummyEnclaveEntry = ([name]) => [
  name,
  makeLiteralExpression(`dummy-${name}`),
];

const enclave_dummy_entries = map(
  enclave_presence_entries,
  makeDummyEnclaveEntry,
);

const declareEnclave = (scope, [enclave, presence]) => [
  enclave,
  presence === false || (presence === null && isStrict(scope))
    ? null
    : declareMeta(scope, `enclave.${enclave}`),
];

const initializeEnclave = (scope, [enclave, meta]) =>
  meta === null
    ? []
    : [
        makeEffectStatement(
          makeMetaWriteEffect(
            scope,
            meta,
            makeGetExpression(makeInputExpression(), `scope.${enclave}`),
          ),
        ),
      ];

const populateEnclave = (scope, enclaves, [enclave, meta]) => {
  enclaves[enclave] =
    meta === null
      ? makeLiteralExpression(`unexpected call to enclave.${enclave}`)
      : makeMetaReadExpression(scope, meta);
};

const makeEnclaveStatementArray = (scope, enclaves, makeStatementArray) => {
  const metas = map(enclave_presence_entries, partialx_(declareEnclave, scope));
  forEach(metas, partialxx_(populateEnclave, scope, enclaves));
  return concat(
    flatMap(metas, partialx_(initializeEnclave, scope)),
    makeStatementArray(scope),
  );
};

export const makeScopeExternalLocalEvalProgram = (
  {strict, allowances, counter},
  makeStatementArray,
) => {
  const enclaves = fromEntries(enclave_dummy_entries);
  return makeExternalLocalEvalProgram(
    allowances,
    makeChainBlock(
      strict ? useStrict(createRoot(counter)) : createRoot(counter),
      [],
      concat(
        [
          createFrame(DEFINE_STATIC, META, {}),
          createFrame(ENCLAVE, BASE, {enclaves}),
        ],
        strict ? [createFrame(CLOSURE_STATIC, BASE, {})] : [],
        [createFrame(BLOCK_STATIC, BASE, {distant: false})],
      ),
      partial_xx(makeEnclaveStatementArray, enclaves, makeStatementArray),
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
          read: makeIntrinsicExpression("aran.getGlobal"),
          typeof: makeIntrinsicExpression("aran.typeofGlobal"),
          discardSloppy: makeIntrinsicExpression("aran.deleteGlobalSloppy"),
          discardStrict: makeLiteralExpression(
            "delete unqualified identifier should never happen in strict mode",
          ),
          writeSloppy: makeIntrinsicExpression("aran.setGlobalSloppy"),
          writeStrict: makeIntrinsicExpression("aran.setGlobalStrict"),
        }),
      ]
    : [
        createFrame(EMPTY_VOID, BASE, {
          dynamic: makeIntrinsicExpression("aran.globalObject"),
        }),
        createFrame(CLOSURE_DYNAMIC, BASE, {
          dynamic: makeIntrinsicExpression("aran.globalObject"),
          observable: true,
        }),
        createFrame(BLOCK_DYNAMIC, BASE, {
          dynamic: makeIntrinsicExpression("aran.globalRecord"),
          observable: true,
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
        createFrame(DEFINE_DYNAMIC, META, {
          dynamic: makeIntrinsicExpression("aran.globalCache"),
        }),
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
        [createFrame(DEFINE_STATIC, META, {})],
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
        [createFrame(DEFINE_STATIC, META, {})],
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

const makeBluePrintBlock = (scope, labels, blueprints, makeStatementArray) =>
  makeChainBlock(
    scope,
    labels,
    map(blueprints, createBlueprintFrame),
    makeStatementArray,
  );

export const makeScopeBlock = partial__x_(makeBluePrintBlock, [
  [DEFINE_STATIC, META, {}],
  [BLOCK_STATIC, BASE, {distant: false}],
]);

export const makeStaticClosureBlock = partial__x_(makeBluePrintBlock, [
  [DEFINE_STATIC, META, {}],
  [CLOSURE_STATIC, META, {}],
  [BLOCK_STATIC, META, {distant: false}],
]);

export const makeDistantBlock = partial__x_(makeBluePrintBlock, [
  [DEFINE_STATIC, META, {}],
  [BLOCK_STATIC, META, {distant: true}],
]);

export const makeEmptyBlock = partial__x_(makeBluePrintBlock, [
  [DEFINE_STATIC, META, {}],
]);

export const makeDeadBlock = partial__x_(makeBluePrintBlock, [
  [DEFINE_STATIC, META, {}],
  [BLOCK_STATIC_DEAD, META, {}],
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
        createFrame(DEFINE_STATIC, BASE, {}),
        createFrame(CLOSURE_STATIC, BASE, {}),
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
        [createFrame(DEFINE_STATIC, META, {})],
        strict ? [createFrame(CLOSURE_STATIC, BASE, {})] : [],
        [createFrame(BLOCK_STATIC, BASE, {distant: false})],
      ),
      makeStatementArray,
    ),
  );
};
