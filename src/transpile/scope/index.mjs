
import {
  BASE,
  META,
  makeVariableBody,
} from "./variable.mjs";

import {
  makeRead,
  makeTypeof,
  makeDiscard,
  makeWrite,
} from "./right.mjs";

import {pack, unpack} from "./structure.mjs";

import {
  useStrict,
  isStrict,
  incrementGlobalCounter,
  restoreGlobalCounter,
  createRoot,
} from "./property.mjs";

import {
  extend
  harvest
  makeDeclareStatements
  makeInitializeStatements
  makeLookupExpression
  makeLookupEffect
} from "./fetch.mjs";

//////////
// meta //
//////////

const declareMeta = (scope, name) => {
  const meta = makeIndexedVariableBody(name, incrementGlobalCounter(scope));
  const statements = makeDeclareStatements(scope, "def", META, body, null, []);
  assert(statements.length === 0, "unexpected declare statement for meta");
  return meta;
};

export const makeMetaReadExpression = (scope, meta) => makeLookupExpression(
  scope,
  META,
  meta,
  makeRead(),
);

export const makeMetaWriteEffect = (scope, meta, expression) => {
  const right = makeWrite(expression);
  const effect = makeLookupEffect(
    scope,
    META,
    meta,
    makeWrite(expression),
  );
  assert(isWriteOrdered(right), "unexpected affected ordering");
  assert(isWriteSingleAccessed(right), "unexpected meta write account");
  return effect;
};

//////////
// base //
//////////

export const makeBaseDeclareStatementArray =
  partial__x___(makeDeclareStatementArray, BASE);

export const makeBaseInitializeStatementArray =
  partial__x__(makeInitializeStatementArray, BASE);

export const makeBaseReadExpression =
  partial_x_x(makeLookupExpression, BASE, makeRead());

export const makeBaseTypeofExpression =
  partial_x_x(makeLookupExpression, BASE, makeTypeof());

export const makeBaseDiscardExpression =
  partial_x_x(makeLookupExpression, BASE, makeDiscard());

export const makeBaseMetaWriteEffect = (scope, base, meta) =>
  makeLookupEffect(scope, BASE, base, makeWrite(
    makeMetaReadExpression(scope, META, meta),
  ));

export const makeBasePrimitiveWriteEffect = (scope, base, primitive) =>
  makeLookupEffect(scope, BASE, base, makeWrite(
    makeLiteralExpression(primitive),
  ));

export const makeBaseIntrinsicWriteEffect = (scope, base, intrinsic) =>
  makeLookupEffect(scope, BASE, base, makeWrite(
    makeIntrinsicExpression(intrinsic),
  ));

export const makeBaseWriteEffect = (scope, base, expression) => {
  const right = makeWrite(expression);
  const effect = makeLookupEffect(scope, BASE, base, right);
  const access = accountWrite(right);
  if (access === 0) {
    return makeSequenceEffect(
      makeExpressionEffect(expression),
      effect,
    );
  } else if (access === 1) {
    return effect;
  } else {
    const meta = declareMeta(scope, "right");
    return makeSequenceEffect(
      makeMetaWriteEffect(scope, meta, expression),
      makeBaseMetaWriteEffect(scope, base, meta),
    );
  }
}

//////////////////////////////////////////////
// makeWithBlock && makeClosureDynamicBlock //
//////////////////////////////////////////////

const makeParameterBlock = (scope, labels, inputs, dynamic, observable, makeStatementArray) =>
  makeFetchBlock(
    scope,
    labels,
    map(
      inputs,
      partial_x(createParameterFrame, {
        dynamic: makeMetaReadExpression(scope, meta),
        observable: true,
      }),
    ),
    makeStatementArray,
  );

export const makeWithBlock = partial__x_x_(makeParameterBlock, WITH, true);

export const makeClosureDynamicBlock = partial__x_x_(makeParameterBlock, CLOSURE_DYNAMIC, false);

//////////////////////
// makeEnclaveBlock //
//////////////////////

const enclave_presence_entries = [
  ["read", true],
  ["typeof", true],
  ["discardStrict", false]
  ["discardSloppy", null],
  ["writeStrict", true]
  ["writeSloppy", null],
];

const makeDummyEnclaveEntry = ([name, _presence]) => [
  name,
  makeLiteralExpression(`dummy-${name}`),
];

const enclave_dummy_entries = map(
  enclave_presence_entries,
  makeDummyEnclaveEntry,
);

const declareEnclave = (scope, [enclave, presence]) => [
  enclave,
  (presence === false || (presence === null && isStrict(scope)))
    ? null
    : declareMeta(scope, `enclave.${enclave}`),
];

const initializeEnclave = (scope, [enclave, meta]) => meta === null
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
  enclaves[enclave] = meta === null
    ? makePrimitiveExpression(`unexpected call to enclave.${enclave}`)
    : enclave, makeMetaReadExpression(scope, meta);
};

const makeEnclaveStatementArray = (scope, enclaves, makeStatementArray) => {
  const metas = map(enclave_presence_entries, partialx_(declareEnclave, scope));
  forEach(metas, partialxx_(populateEnclave, scope, enclaves));
  return concat(
    flatMap(metas, partialx_(initializeEnclave, scope)),
    makeStatementArray(scope),
  );
}

export const makeEnclaveBlock = (scope, labels, makeStatementArray) => {
  const enclaves = fromEntries(enclave_dummy_entries);
  return makeFetchBlock(
    scope,
    labels,
    map(ENCLAVE, partial_x(createParameterFrame, {enclaves})),
    partial_xx(enclaves, makeStatementArray)
  );
};

////////////////////
// makeConstBlock //
////////////////////

export const makeSwitchBlock = partial__x_(makeFetchBlock, SWITCH);

export const makeCaseBlock = partial__x_(makeFetchBlock, CASE);
