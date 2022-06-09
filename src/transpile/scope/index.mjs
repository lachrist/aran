
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
  BODY_BLOCK
  BODY_CLOSURE
  BODY_DEAD
  BODY_DEF
  BODY_IMPORT
  BODY_OBJECT
  BODY_RECORD
  BODY_WITH
  ROOT_DEF
  ROOT_ENCLAVE
  ROOT_GLOBAL
  ROOT_MISS
} from "./frame/index.mjs";

import {
  extend
  harvest
  makeDeclareStatements
  makeInitializeStatements
  makeLookupExpression
  makeLookupEffect
} from "./fetch.mjs";

//////////
// Root //
//////////

const makeEnclaveExpression = (variable) => makeReadExpression(
  makeVariable(
    BASE,
    makeVariableBody(variable),
  ),
);

const ABSTRACT_ROOT = [
  [ENCLAVE, BASE, {
    read: {
      strict: makeIntrinsicExpression("aran.getGlobal"),
      sloppy: makeIntrinsicExpression("aran.getGlobal"),
    },
    typeof: {
      strict: makeIntrinsicExpression("aran.typeofGlobal"),
      sloppy: makeIntrinsicExpression("aran.typeofGlobal"),
    },
    discard: {
      strict: makeIntrinsicExpression("aran.deleteGlobalStrict"),
      sloppy: makeIntrinsicExpression("aran.deleteGlobalSloppy"),
    },
    write: {
      strict: makeIntrinsicExpression("aran.setGlobalStrict"),
      sloppy: makeIntrinsicExpression("aran.setGlobalSloppy"),
    },
  }],
  [DEFINE_DYNAMIC, META, {
    dynamic: makeIntrinsicExpression("aran.globalCache"),
  }],
];

const CONCRETE_ROOT = [
  [EMPTY_VOID, BASE, {dynamic:makeIntrinsicExpression("aran.globalObject")}],
  [CLOSURE_DYNAMIC, BASE, {dynamic:makeIntrinsicExpression("aran.globalObject")}],
  [BLOCK_DYNAMIC, BASE, {dynamic:makeIntrinsicExpression("aran.globalRecord")}],
  [DEFINE_DYNAMIC, META, {
    dynamic: makeIntrinsicExpression("aran.globalCache"),
  },
];

const ENCLAVE_ROOT = [
  [ENCLAVE, BASE, {
    read: {
      strict: makeEnclaveExpression("scope.read"),
      sloppy: makeEnclaveExpression("scope.read"),
    },
    typeof: {
      strict: makeEnclaveExpression("scope.typeof"),
      sloppy: makeEnclaveExpression("scope.typeof"),
    },
    discard: {
      strict: makeEnclaveExpression("scope.discardStrict"),
      sloppy: makeEnclaveExpression("scope.discardSloppy"),
    },
    write: {
      strict: makeEnclaveExpression("scope.writeStrict"),
      sloppy: makeEnclaveExpression("scope.writeSloppy"),
    },
  }],
  [DEFINE_DYNAMIC, META, {
    dynamic: makeIntrinsicExpression("aran.globalCache"),
  },
];

////////////
// Script //
////////////

const SCRIPT_BODY = [];

const ABTRACT_SCRIPT = concat(ABSTRACT_ROOT, SCRIPT_BODY);

const CONCRETE_SCRIPT = concat(CONCRETE_ROOT, SCRIPT_BODY);

////////////
// Module //
////////////

const MODULE_BODY = [
  [CLOSURE_STATIC, BASE, {}],
  [BLOCK_STATIC, BASE, {distant:false}],
  [IMPORT_STATIC, BASE, {}],
  [DEFINE_STATIC, META, {}],
];

const ABSTRACT_MODULE = concat(
  ABSTRACT_ROOT,
  MODULE_BODY,
);

const CONCRETE_MODULE = concat(
  CONCRETE_ROOT,
  MODULE_BODY,
);

/////////////
// Enclave //
/////////////

const ENCLAVE_BODY = [
  [BLOCK_STATIC, BASE, {distant:false}],
  [DEFINE_STATIC, META, {}],
];

const ENCLAVE = concat(
  ENCLAVE_ROOT,
  ENCLAVE_BODY,
);

//////////
// Eval //
//////////

const SLOPPY_EVAL_BODY = [
  [CLOSURE_STATIC, BASE, {}],
  [DEFINE_STATIC, META, {}],
];

const ABSTRACT_EVAL_SLOPPY = concat(
  ABSTRACT_ROOT,
  SLOPPY_EVAL_BODY,
);

const CONCRETE_EVAL_SLOPPY = concat(
  CONCRETE_ROOT,
  SLOPPY_EVAL_BODY,
);

const STRICT_EVAL_BODY = [
  [CLOSURE_STATIC, BASE, {}],
  [BLOCK_STATIC, BASE, {distant:false}],
  [DEFINE_STATIC, META, {}],
];

const ABSTRACT_EVAL_STRICT = concat(
  ABSTRACT_ROOT,
  STRICT_EVAL_BODY,
);

const CONCRETE_EVAL_STRICT = concat(
  CONCRETE_ROOT,
  STRICT_EVAL_BODY,
);

///////////
// Other //
///////////

const BLOCK = [
  [BLOCK_STATIC, BASE, {distant:false}],
  [DEFINE_STATIC, META, {}],
];

const SWITCH = [
  [BLOCK_STATIC, BASE, {distant:true}],
  [DEFINE_STATIC, META, {}],
];

const CASE = [
  [DEFINE_STATIC, META, {}],
];

const WITH = (dynamic) => [
  [EMPTY_DYNAMIC_WITH, BASE, {dynamic}],
  [BLOCK_STATIC, BASE, {distant:false}],
  [DEFINE_STATIC, META, {}],
];

const CLOSURE_STATIC = [
  [CLOSURE_STATIC, BASE, {}],
  [DEFINE_STATIC, META, {}],
];

const CLOSURE_DYNAMIC = (dynamic) => [
  [CLOSURE_DYNAMIC, BASE, {dynamic}],
  [DEFINE_STATIC, META, {}],
];

const FOR = [
  [BLOCK_STATIC_DEAD, BASE, {}],
  [DEFINE_STATIC, META, {}],
];

///////////////
// extension //
///////////////

const declare = (scope, {kind, variable:base, import:iimport, exports:eexports}) =>
  makeDeclareStatements(scope, kind, BASE, base, iimport, eexport);

const harvest = ({header:header1, prelude:header2, scope:scope1}) => {
  const {header:header2, prelude:prelude2, scope:scope2} = harvestFetch(scope);
  return {
    header: concat(header1, header2),
    prelude: concat(prelude1, prelude2),
    scope: scope2,
  };
};

export const deploy = (makeNode, scope, frames, declarations, makeStatementArray) => {
  scope = reduce(map(inputs, makeFrame), extendStructure, scope);
  const statements2 = flatMap(declarations, partialx_(declare, scope));
  const statements3 = makeStatementArray(scope);
  const {
    prelude:statements1,
    header: variables,
  } = reduce(inputs, harvest, {header:[], prelude:[], scope});
  return makeNode(variables, concat(statement1, statements2, statements3));
};

export const makeScopeBlock = (scope, labels, frames, declarations, makeStatementArray) => {
  const {variables, statements} = deploy(scope, frames, declarations, makeStatementArray);
  return makeBlock(labels, variables, statements);
};

export const makeScopeScriptProgram = (scope, frames, declarations, makeStatementArray) => {
  const {variables, statements} = deploy(scope, frames, declarations, makeStatementArray);
  return makeScope(labels, variables, statements);
};

export const makeScopeScriptProgram = (scope, declarations, makeStatementArray) => {
  const {head, body} = deploy(scope, makeScriptInputs(), makeStatementArray);
  return makeScriptProgram(head, body);
};

export const makeScopeWithBlock = (scope, labels, meta, declarations, makeStatementArray) => {
  const {head, body} = deploy(
    scope,
    makeWithInputs(makeMetaReadExpression(scope, meta)),
    declarations,
    makeStatementArray,
  );
  return makeBlock(labels, head, body);
};

export const makeScopeSwitchBlock = (scope, labels, declarations, makeStatementArray) => {
  const {head, body} = deploy(
    scope,
    makeSwitchInputs(),
    declarations,
    makeStatementArray,
  );
  return makeBlock(labels, head, body);
};

export const makeScopeCaseBlock = (scope, makeStatementArray) => {
  const {head, body} = deploy(scope, makeCaseInputs(), [], makeStatementArray);
  return makeBlock([], head, body);
};

export const generateMakeBlock = (inputs) => (scope, labels, declarations, makeStatementArray) => {
  const {head, body} = deploy(scope, inputs, declarations, makeStatementArray);


  const scopes = map(framing, extend, [scope]);
  const statements2 = flatMap(declarations, partialx_(declare, scope));
  const statements3 = makeStatementArray(scope);
  const {
    prelude:statements1,
    header,
  } = harvest();
  return makeBlock(
    labels,
    header,
    concat(statement1, statements2, statements3),
  );
};

export const makeScopeBlock = (scope, declarations, callback) => {

};

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

// const generateMakeMetaNode = (makeSequenceNode) => (scope, name, expression, makeNode) => {
//   const meta = makeIndexedVariableBody(name, incrementGlobalCounter(scope));
//   const statements = makeDeclareStatements(scope, "def", META, body, null, []);
//   assert(statements.length === 0, "unexpected declare statement for meta");
//   return makeSequenceNode(
//     makeInitializeEffect(scope, "def", META, meta, expression),
//     callback(meta),
//   );
// };
//
// export const makeMetaExpression = generateMakeMetaNode(makeSequenceExpression);
//
// export const makeMetaEffect = generateMakeMetaNode(makeSequenceEffect);

//////////
// base //
//////////

export const makeBaseInitializeStatements = (scope, kind, variable, expression) => {
  conflict(scope, kind, BASE, variable);
  return makeInitializeStatements(scope, kind, BASE, variable, expression);
};

export const makeBaseReadExpression = partial_x_x(makeLookupExpression, BASE, makeRead());

export const makeBaseTypeofExpression = partial_x_x(makeLookupExpression, BASE, makeTypeof());

export const makeBaseDiscardExpression = partial_x_x(makeLookupExpression, BASE, makeDiscard());

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
