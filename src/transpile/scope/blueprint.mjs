import {concat} from "array-lite";

import {makeIntrinsicExpression} from "../../ast/index.mjs";

import {BASE, META} from "./variable.mjs";

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

const PARAMETER = null;

//////////
// Root //
//////////

const ENCLAVE_GLOBAL_HEAD = [
  [
    DEFINE_DYNAMIC,
    META,
    {
      dynamic: makeIntrinsicExpression("aran.globalCache"),
    },
  ],
  [
    ENCLAVE,
    BASE,
    {
      enclaves: {
        read: makeIntrinsicExpression("aran.getGlobal"),
        typeof: makeIntrinsicExpression("aran.typeofGlobal"),
        discardSloppy: makeIntrinsicExpression("aran.deleteGlobalStrict"),
        discardStrict: makeIntrinsicExpression("aran.deleteGlobalSloppy"),
        writeSloppy: makeIntrinsicExpression("aran.setGlobalSloppy"),
        writeStrict: makeIntrinsicExpression("aran.setGlobalStrict"),
      },
    },
  ],
];

const REIFIED_GLOBAL_HEAD = [
  [
    DEFINE_DYNAMIC,
    META,
    {
      dynamic: makeIntrinsicExpression("aran.globalCache"),
    },
  ],
  [EMPTY_VOID, BASE, {dynamic: makeIntrinsicExpression("aran.globalObject")}],
  [
    CLOSURE_DYNAMIC,
    BASE,
    {
      dynamic: makeIntrinsicExpression("aran.globalObject"),
      observable: true,
    },
  ],
  [
    BLOCK_DYNAMIC,
    BASE,
    {
      dynamic: makeIntrinsicExpression("aran.globalRecord"),
      observable: false,
    },
  ],
];

const ENCLAVE_LOCAL_HEAD = [
  [
    DEFINE_DYNAMIC,
    META,
    {
      dynamic: makeIntrinsicExpression("aran.globalCache"),
    },
  ],
  [ENCLAVE, BASE, {enclaves: PARAMETER}],
];

////////////
// Script //
////////////

const SCRIPT_BODY = [];

export const ENCLAVE_SCRIPT = concat(ENCLAVE_GLOBAL_HEAD, SCRIPT_BODY);

export const REIFIED_SCRIPT = concat(REIFIED_GLOBAL_HEAD, SCRIPT_BODY);

////////////
// Module //
////////////

const MODULE_BODY = [
  [CLOSURE_STATIC, BASE, {}],
  [BLOCK_STATIC, BASE, {distant: false}],
  [IMPORT_STATIC, BASE, {}],
];

export const ENCLAVE_MODULE = concat(ENCLAVE_GLOBAL_HEAD, MODULE_BODY);

export const REIFIED_MODULE = concat(REIFIED_GLOBAL_HEAD, MODULE_BODY);

//////////
// Eval //
//////////

const SLOPPY_EVAL_BODY = [
  [BLOCK_STATIC, BASE, {distant: false}],
  [DEFINE_STATIC, META, {}],
];

export const ENCLAVE_GLOBAL_SLOPPY_EVAL = concat(
  ENCLAVE_GLOBAL_HEAD,
  SLOPPY_EVAL_BODY,
);

export const REIFIED_GLOBAL_SLOPPY_EVAL = concat(
  REIFIED_GLOBAL_HEAD,
  SLOPPY_EVAL_BODY,
);

export const ENCLAVE_LOCAL_SLOPPY_EVAL = concat(
  ENCLAVE_LOCAL_HEAD,
  SLOPPY_EVAL_BODY,
);

const STRICT_EVAL_BODY = [
  [CLOSURE_STATIC, BASE, {}],
  [BLOCK_STATIC, BASE, {distant: false}],
  [DEFINE_STATIC, META, {}],
];

export const ENCLAVE_GLOBAL_STRICT_EVAL = concat(
  ENCLAVE_GLOBAL_HEAD,
  STRICT_EVAL_BODY,
);

export const REIFIED_GLOBAL_STRICT_EVAL = concat(
  REIFIED_GLOBAL_HEAD,
  STRICT_EVAL_BODY,
);

export const ENCLAVE_LOCAL_STRICT_EVAL = concat(
  ENCLAVE_LOCAL_HEAD,
  STRICT_EVAL_BODY,
);

///////////
// Other //
///////////

export const BLOCK = [
  [BLOCK_STATIC, BASE, {distant: false}],
  [DEFINE_STATIC, META, {}],
];

export const SWITCH_BLOCK = [
  [BLOCK_STATIC, BASE, {distant: true}],
  [DEFINE_STATIC, META, {}],
];

export const CASE_BLOCK = [[DEFINE_STATIC, META, {}]];

export const WITH_BLOCK = [
  [EMPTY_DYNAMIC_WITH, BASE, {dynamic: PARAMETER, observable: true}],
  [BLOCK_STATIC, BASE, {distant: false}],
  [DEFINE_STATIC, META, {}],
];

export const CLOSURE_STATIC_BLOCK = [
  [CLOSURE_STATIC, BASE, {}],
  [DEFINE_STATIC, META, {}],
];

export const CLOSURE_DYNAMIC_BLOCK = [
  [CLOSURE_DYNAMIC, BASE, {dynamic: PARAMETER, observable: false}],
  [DEFINE_STATIC, META, {}],
];

export const DEAD_BLOCK = [
  [BLOCK_STATIC_DEAD, BASE, {}],
  [DEFINE_STATIC, META, {}],
];

/////////////////
// createFrame //
/////////////////

export const createConstFrame = ([type, layer, options]) =>
  createFrame(type, layer, options);

export const createParamFrame = ([type, layer, options], parameter) => {
  options = {__proto__: null, ...options};
  for (const name in options) {
    if (options[name] === PARAMETER) {
      options[name] = parameter;
    }
  }
  return createFrame(type, layer, options);
};
