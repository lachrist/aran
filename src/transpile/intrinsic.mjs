import {includes} from "array-lite";

import {assert, getLast, pop} from "../util.mjs";

import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makeLiteralExpression,
  makeConstructExpression,
} from "../ast/index.mjs";

const {undefined} = globalThis;

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

export const makeObjectExpression = (...expressions) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject"),
    makeLiteralExpression({undefined: null}),
    expressions,
    typeof getLast(expressions) === "object" && getLast(expressions) !== null
      ? undefined
      : pop(expressions),
  );

export const makeHasExpression = (object, key, annotation = undefined) =>
  makeBinaryExpression("in", key, object, annotation);
export const makeGetExpression = generateMakeApply2("aran.get");
export const makeSloppySetExpression = generateMakeApply3("aran.setSloppy");
export const makeStrictSetExpression = generateMakeApply3("aran.setStrict");

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
  "aran.globalDeclarativeRecord",
  "aran.globalObjectRecord",
  "globalThis",
  "Symbol.iterator",
  "Symbol.unscopables",
];

export const makeDirectIntrinsicExpression = (name) => {
  assert(includes(whitelist, name), "invalid intrinsic name");
  return makeIntrinsicExpression(name);
};
