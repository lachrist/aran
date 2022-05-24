import {concat, flatMap} from "array-lite";

import {
  assert,
  partialx,
  partialx__,
  partialx___,
  partialxx__,
  partialx____,
  partialxx___,
  partialxx____,
  partialxx_x_x_x__,
} from "./util/index.mjs";

import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makeLiteralExpression,
  makeConstructExpression,
} from "./ast/index.mjs";

const {undefined} = globalThis;

const makeIntrinsicConstructExpression = (
  name,
  expressions,
  annotation = undefined,
) =>
  makeConstructExpression(
    makeIntrinsicExpression(name),
    expressions,
    annotation,
  );

const makeIntrinsicApplyExpression = (
  name,
  expressions,
  annotation = undefined,
) =>
  makeApplyExpression(
    makeIntrinsicExpression(name),
    makeLiteralExpression({undefined: null}),
    expressions,
    annotation,
  );

const makeIntrinsicApplyExpression1 = (
  name,
  expression1,
  annotation = undefined,
) => makeIntrinsicApplyExpression(name, [expression1], annotation);

const makeIntrinsicApplyExpression2 = (
  name,
  expression1,
  expression2,
  annotation = undefined,
) => makeIntrinsicApplyExpression(name, [expression1, expression2], annotation);

const makeIntrinsicApplyExpression3 = (
  name,
  expression1,
  expression2,
  expression3,
  annotation = undefined,
) =>
  makeIntrinsicApplyExpression(
    name,
    [expression1, expression2, expression3],
    annotation,
  );

const makeLiteralIntrinsicApplyExpression1 = (
  name,
  literal,
  expression1,
  annotation = undefined,
) =>
  makeIntrinsicApplyExpression2(
    name,
    makeLiteralExpression(literal),
    expression1,
    annotation,
  );

const makeLiteralIntrinsicApplyExpression2 = (
  name,
  literal,
  expression1,
  expression2,
  annotation = undefined,
) =>
  makeIntrinsicApplyExpression3(
    name,
    makeLiteralExpression(literal),
    expression1,
    expression2,
    annotation,
  );

// const makeDualIntrinsicApplyExpression1 = (
//   name1,
//   name2,
//   boolean,
//   expression1,
//   annotation = undefined,
// ) =>
//   makeIntrinsicApplyExpression1(
//     boolean ? name1 : name2,
//     expression1,
//     annotation,
//   );

const makeDualIntrinsicApplyExpression2 = (
  name1,
  name2,
  boolean,
  expression1,
  expression2,
  annotation = undefined,
) =>
  makeIntrinsicApplyExpression2(
    boolean ? name1 : name2,
    expression1,
    expression2,
    annotation,
  );

const makeDualIntrinsicApplyExpression3 = (
  name1,
  name2,
  boolean,
  expression1,
  expression2,
  expression3,
  annotation = undefined,
) =>
  makeIntrinsicApplyExpression3(
    boolean ? name1 : name2,
    expression1,
    expression2,
    expression3,
    annotation,
  );

//////////////
// operator //
//////////////

export const makeUnaryExpression = partialx___(
  makeLiteralIntrinsicApplyExpression1,
  "aran.unary",
);

export const makeBinaryExpression = partialx____(
  makeLiteralIntrinsicApplyExpression2,
  "aran.binary",
);

////////////
// create //
////////////

export const makeArrayExpression = partialx__(
  makeIntrinsicApplyExpression,
  "Array.of",
);

const flatenProperty = ({0: name, 1: value}) =>
  value === null ? [] : [name, value];

export const makeObjectExpression = (
  prototype,
  properties,
  annotation = undefined,
) =>
  makeIntrinsicApplyExpression(
    "aran.createObject",
    concat([prototype], flatMap(properties, flatenProperty)),
    annotation,
  );

const makeObjectExpression4 = (
  prototype,
  name1,
  value1,
  name2,
  value2,
  name3,
  value3,
  name4,
  value4,
  annotation = undefined,
) =>
  makeObjectExpression(
    prototype,
    [
      [name1, value1],
      [name2, value2],
      [name3, value3],
      [name4, value4],
    ],
    annotation,
  );

export const makeDataDescriptorExpression = partialxx_x_x_x__(
  makeObjectExpression4,
  makeLiteralExpression(null),
  makeLiteralExpression("value"),
  makeLiteralExpression("writable"),
  makeLiteralExpression("enumerable"),
  makeLiteralExpression("configurable"),
);

export const makeAccessorDescriptorExpression = partialxx_x_x_x__(
  makeObjectExpression4,
  makeLiteralExpression(null),
  makeLiteralExpression("get"),
  makeLiteralExpression("set"),
  makeLiteralExpression("enumerable"),
  makeLiteralExpression("configurable"),
);

////////////
// object //
////////////

export const makeGetExpression = partialx___(
  makeIntrinsicApplyExpression2,
  "aran.get",
);

export const makeDeleteStrictExpression = partialx___(
  makeIntrinsicApplyExpression2,
  "aran.deleteStrict",
);

export const makeDeleteSloppyExpression = partialx___(
  makeIntrinsicApplyExpression2,
  "aran.deleteSloppy",
);

export const makeDeleteExpression = partialxx___(
  makeDualIntrinsicApplyExpression2,
  "aran.deleteStrict",
  "aran.deleteSloppy",
);

export const makeDefineExpression = partialx____(
  makeIntrinsicApplyExpression3,
  "Reflect.defineProperty",
);

export const makeSetStrictExpression = partialx____(
  makeIntrinsicApplyExpression3,
  "aran.setStrict",
);

export const makeSetSloppyExpression = partialx____(
  makeIntrinsicApplyExpression3,
  "aran.setSloppy",
);
export const makeSetExpression = partialxx____(
  makeDualIntrinsicApplyExpression3,
  "aran.setStrict",
  "aran.setSloppy",
);

////////////
// global //
////////////

export const makeTypeofGlobalExpression = partialx__(
  makeIntrinsicApplyExpression1,
  "aran.typeofGlobal",
);

export const makeGetGlobalExpression = partialx__(
  makeIntrinsicApplyExpression1,
  "aran.getGlobal",
);

export const makeDeleteGlobalSloppyExpression = partialx__(
  makeIntrinsicApplyExpression1,
  "aran.deleteGlobalSloppy",
);

export const makeDeleteGlobalExpression = (
  strict,
  expression,
  annotation = undefined,
) => {
  assert(!strict, "unexpected strict global delete");
  return makeDeleteGlobalSloppyExpression(expression, annotation);
};

export const makeSetGlobalStrictExpression = partialx___(
  makeIntrinsicApplyExpression2,
  "aran.setGlobalStrict",
);

export const makeSetGlobalSloppyExpression = partialx___(
  makeIntrinsicApplyExpression2,
  "aran.setGlobalSloppy",
);

export const makeSetGlobalExpression = partialxx___(
  makeDualIntrinsicApplyExpression2,
  "aran.setGlobalStrict",
  "aran.setGlobalSloppy",
);

///////////
// throw //
///////////

const makeApplyConstructExpression1 = (
  name1,
  name2,
  expression,
  annotation = undefined,
) =>
  makeIntrinsicApplyExpression(
    name1,
    [makeIntrinsicConstructExpression(name2, [expression], annotation)],
    annotation,
  );

export const makeThrowReferenceErrorExpression = partialxx__(
  makeApplyConstructExpression1,
  "aran.throw",
  "ReferenceError",
);

export const makeThrowSyntaxErrorExpression = partialxx__(
  makeApplyConstructExpression1,
  "aran.throw",
  "SyntaxError",
);

export const makeThrowTypeErrorExpression = partialxx__(
  makeApplyConstructExpression1,
  "aran.throw",
  "TypeError",
);

export const makeThrowAranErrorExpression = partialxx__(
  makeApplyConstructExpression1,
  "aran.throw",
  "aran.AranError",
);

//////////
// data //
//////////

export const makeGlobalCacheExpression = partialx(
  makeIntrinsicExpression,
  "aran.globalCache",
);

export const makeGlobalObjectExpression = partialx(
  makeIntrinsicExpression,
  "aran.globalObject",
);

export const makeGlobalRecordExpression = partialx(
  makeIntrinsicExpression,
  "aran.globalRecord",
);

export const makeDeadzoneExpression = partialx(
  makeIntrinsicExpression,
  "aran.deadzone",
);

export const makeSymbolIteratorExpression = partialx(
  makeIntrinsicExpression,
  "Symbol.iterator",
);

export const makeSymbolUnscopablesExpression = partialx(
  makeIntrinsicExpression,
  "Symbol.unscopables",
);
