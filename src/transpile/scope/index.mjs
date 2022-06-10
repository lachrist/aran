import {flatMap, concat, map, forEach} from "array-lite";

import {
  assert,
  partialx_,
  partial_x,
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
  createConstFrame,
  createParamFrame,
  ENCLAVE_SCRIPT,
  REIFIED_SCRIPT,
  ENCLAVE_MODULE,
  REIFIED_MODULE,
  ENCLAVE_GLOBAL_SLOPPY_EVAL,
  REIFIED_GLOBAL_SLOPPY_EVAL,
  ENCLAVE_LOCAL_SLOPPY_EVAL,
  ENCLAVE_GLOBAL_STRICT_EVAL,
  REIFIED_GLOBAL_STRICT_EVAL,
  ENCLAVE_LOCAL_STRICT_EVAL,
  BLOCK,
  SWITCH_BLOCK,
  CASE_BLOCK,
  WITH_BLOCK,
  CLOSURE_STATIC_BLOCK,
  CLOSURE_DYNAMIC_BLOCK,
  DEAD_BLOCK,
} from "./blueprint.mjs";

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

//////////////////////////////////////////////
// makeWithBlock && makeClosureDynamicBlock //
//////////////////////////////////////////////

const makeParameterBlock = (scope, labels, inputs, meta, makeStatementArray) =>
  makeChainBlock(
    labels,
    scope,
    map(
      inputs,
      partial_x(createParamFrame, {
        dynamic: makeMetaReadExpression(scope, meta),
      }),
    ),
    makeStatementArray,
  );

export const makeWithBlock = partial__x_x_(makeParameterBlock, WITH_BLOCK);

export const makeClosureDynamicBlock = partial__x_x_(
  makeParameterBlock,
  CLOSURE_DYNAMIC_BLOCK,
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
      [],
      strict ? useStrict(createRoot(counter)) : createRoot(counter),
      map(
        strict ? ENCLAVE_LOCAL_STRICT_EVAL : ENCLAVE_LOCAL_SLOPPY_EVAL,
        partial_x(createParamFrame, {enclaves}),
      ),
      partial_xx(makeEnclaveStatementArray, enclaves, makeStatementArray),
    ),
  );
};

////////////////////
// makeConstBlock //
////////////////////

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
      [],
      strict ? useStrict(scope) : scope,
      map(
        // NB Fortunatelly:
        // CLOSURE_DYNAMIC_BLOCK is not necessary in strict mode.
        strict ? CLOSURE_STATIC_BLOCK : BLOCK,
        createConstFrame,
      ),
      makeStatementArray,
    ),
  );
};

export const makeScopeScriptProgram = (
  {strict, enclave, counter},
  makeStatementArray,
) =>
  makeChainScriptProgram(
    strict ? useStrict(createRoot(counter)) : createRoot(counter),
    map(enclave ? ENCLAVE_SCRIPT : REIFIED_SCRIPT, createConstFrame),
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
      map(enclave ? ENCLAVE_MODULE : REIFIED_MODULE, createConstFrame),
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
      map(
        strict
          ? enclave
            ? ENCLAVE_GLOBAL_STRICT_EVAL
            : REIFIED_GLOBAL_STRICT_EVAL
          : enclave
          ? ENCLAVE_GLOBAL_SLOPPY_EVAL
          : REIFIED_GLOBAL_SLOPPY_EVAL,
        createConstFrame,
      ),
      makeStatementArray,
    ),
  );

const makeBlock = (scope, labels, blueprints, makeStatementArray) =>
  makeChainBlock(
    scope,
    map(blueprints, createConstFrame),
    labels,
    makeStatementArray,
  );

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
      BLOCK,
      [],
      makeStatementArray,
    ),
  );

export const makeScopeBlock = partial__x_(makeBlock, BLOCK);

export const makeScopeClosureBlock = partial__x_(
  makeBlock,
  CLOSURE_STATIC_BLOCK,
);

export const makeSwitchBlock = partial__x_(makeBlock, SWITCH_BLOCK);

export const makeCaseBlock = partial__x_(makeBlock, CASE_BLOCK);

export const makeDeadBlock = partial__x_(makeBlock, DEAD_BLOCK);
