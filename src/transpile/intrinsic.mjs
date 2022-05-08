import {includes, concat, flat, map} from "array-lite";

import {assert} from "../util.mjs";

import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makeLiteralExpression,
  makeConstructExpression,
} from "../ast/index.mjs";

const {
  undefined,
  Object: {entries: getEntries},
} = globalThis;

const generateMakeApply1 =
  (name) =>
  (expression1, annotation = undefined) =>
    makeApplyExpression(
      makeIntrinsicExpression(name),
      makeLiteralExpression({undefined: null}),
      [expression1],
      annotation,
    );

const generateMakeApply2 =
  (name) =>
  (expression1, expression2, annotation = undefined) =>
    makeApplyExpression(
      makeIntrinsicExpression(name),
      makeLiteralExpression({undefined: null}),
      [expression1, expression2],
      annotation,
    );

const generateMakeApply3 =
  (name) =>
  (expression1, expression2, expression3, annotation = undefined) =>
    makeApplyExpression(
      makeIntrinsicExpression(name),
      makeLiteralExpression({undefined: null}),
      [expression1, expression2, expression3],
      annotation,
    );

// const generateMakeConstruct1 =
//   (name) =>
//   (expression1, annotation = undefined) =>
//     makeConstructExpression(
//       makeIntrinsicExpression(name),
//       [expression1],
//       annotation,
//     );

//////////////
// operator //
//////////////

export const makeUnaryExpression = (
  operator,
  expression,
  annotation = undefined,
) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.unary"),
    makeLiteralExpression({undefined: null}),
    [makeLiteralExpression(operator), expression],
    annotation,
  );

export const makeBinaryExpression = (
  operator,
  expression1,
  expression2,
  annotation = undefined,
) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.binary"),
    makeLiteralExpression({undefined: null}),
    [makeLiteralExpression(operator), expression1, expression2],
    annotation,
  );

////////////
// object //
////////////

export const makeObjectExpression = (
  prototype,
  properties,
  annotation = undefined,
) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject"),
    makeLiteralExpression({undefined: null}),
    concat([prototype], flat(properties)),
    annotation,
  );

const makeProperty = ({0: key, 1: value}) => [
  makeLiteralExpression(key),
  value,
];

export const makeSimpleObjectExpression = (
  prototype,
  object,
  annotation = undefined,
) =>
  makeObjectExpression(
    prototype,
    map(getEntries(object), makeProperty),
    annotation,
  );

export const makeHasExpression = generateMakeApply2("aran.has");
export const makeGetExpression = generateMakeApply2("aran.get");
export const makeSloppySetExpression = generateMakeApply3("aran.setSloppy");
export const makeStrictSetExpression = generateMakeApply3("aran.setStrict");
export const makeSloppyDeleteExpression =
  generateMakeApply2("aran.deleteSloppy");
export const makeStrictDeleteExpression =
  generateMakeApply2("aran.deleteStrict");

export const makeDeleteExpression = (
  strict,
  object,
  key,
  annotation = undefined,
) =>
  (strict ? makeStrictDeleteExpression : makeSloppyDeleteExpression)(
    object,
    key,
    annotation,
  );

export const makeSetExpression = (
  strict,
  object,
  key,
  value,
  annotation = undefined,
) =>
  (strict ? makeStrictSetExpression : makeSloppySetExpression)(
    object,
    key,
    value,
    annotation,
  );

export const makeDefineExpression = generateMakeApply3(
  "Reflect.defineProperty",
);

////////////
// global //
////////////

export const makeTypeofGlobalExpression =
  generateMakeApply1("aran.typeofGlobal");
export const makeDeleteGlobalExpression =
  generateMakeApply1("aran.deleteGlobal");
export const makeReadGlobalExpression = generateMakeApply1("aran.readGlobal");
export const makeDeclareGlobalExpression =
  generateMakeApply2("aran.declareGlobal");
export const makeSloppyWriteGlobalExpression = generateMakeApply2(
  "aran.writeGlobalSloppy",
);
export const makeStrictWriteGlobalExpression = generateMakeApply2(
  "aran.writeGlobalStrict",
);

///////////
// throw //
///////////

const generateMakeThrow = (name) => (message) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.throw"),
    makeLiteralExpression({undefined: null}),
    [
      makeConstructExpression(makeIntrinsicExpression(name), [
        makeLiteralExpression(message),
      ]),
    ],
  );

export const makeThrowReferenceErrorExpression =
  generateMakeThrow("ReferenceError");
export const makeThrowAranErrorExpression = generateMakeThrow("aran.AranError");
export const makeThrowSyntaxErrorExpression = generateMakeThrow("SyntaxError");
export const makeThrowTypeErrorExpression = generateMakeThrow("TypeError");

//////////
// data //
//////////

const whitelist = [
  "aran.globalCache",
  "aran.globalRecord",
  "aran.globalObject",
  "aran.deadzone",
  "globalThis",
  "Symbol.iterator",
  "Symbol.unscopables",
];

export const makeDirectIntrinsicExpression = (name) => {
  assert(includes(whitelist, name), "invalid intrinsic name");
  return makeIntrinsicExpression(name);
};
