import { concat, flatMap, map } from "array-lite";

import {
  assert,
  partialx_,
  partialx__,
  partialx___,
  partialx____,
  partialxx___,
  partialxx____,
  partialxx_x_x_x__,
  partialxf__,
  partialxf___,
} from "./util/index.mjs";

import {
  makeConditionalExpression,
  makeApplyExpression,
  makeIntrinsicExpression,
  makeLiteralExpression,
  makeConstructExpression,
} from "./ast/index.mjs";

const {
  Array: { isArray },
  undefined,
  Reflect: { ownKeys },
} = globalThis;

/////////////
// Factory //
/////////////

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
    makeLiteralExpression({ undefined: null }),
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

//////////
// Aran //
//////////

export const makeArrayExpression = partialx__(
  makeIntrinsicApplyExpression,
  "Array.of",
);

export const makeUnaryExpression = partialxf__(
  makeIntrinsicApplyExpression2,
  "aran.unary",
  makeLiteralExpression,
);

export const makeBinaryExpression = partialxf___(
  makeIntrinsicApplyExpression3,
  "aran.binary",
  makeLiteralExpression,
);

const flatenProperty = ({ key, value }) => (value === null ? [] : [key, value]);

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

////////////////
// Descriptor //
////////////////

const makeObjectExpression4 = (
  prototype,
  key1,
  value1,
  key2,
  value2,
  key3,
  value3,
  key4,
  value4,
  annotation = undefined,
) =>
  makeObjectExpression(
    prototype,
    [
      { key: key1, value: value1 },
      { key: key2, value: value2 },
      { key: key3, value: value3 },
      { key: key4, value: value4 },
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

///////////
// Throw //
///////////

const makeThrowExpression = (name, message, annotation = undefined) =>
  makeIntrinsicApplyExpression(
    "aran.throw",
    [
      makeIntrinsicConstructExpression(
        name,
        [makeLiteralExpression(message)],
        annotation,
      ),
    ],
    annotation,
  );

export const makeThrowReferenceErrorExpression = partialx__(
  makeThrowExpression,
  "ReferenceError",
);

export const makeThrowSyntaxErrorExpression = partialx__(
  makeThrowExpression,
  "SyntaxError",
);

export const makeThrowTypeErrorExpression = partialx__(
  makeThrowExpression,
  "TypeError",
);

export const makeThrowAranErrorExpression = partialx__(
  makeThrowExpression,
  "aran.AranError",
);

//////////
// JSON //
//////////

/* eslint-disable no-use-before-define */

const makeJsonProperty = (object, key) => {
  assert(typeof key === "string", "unexpected symbol property");
  return {
    key: makeLiteralExpression(key),
    value: makeJsonExpression(object[key]),
  };
};

export const makeJsonExpression = (json, annotation = undefined) => {
  if (isArray(json)) {
    return makeArrayExpression(map(json, makeJsonExpression), annotation);
  } else if (typeof json === "object" && json !== null) {
    return makeObjectExpression(
      makeLiteralExpression(null),
      map(ownKeys(json), partialx_(makeJsonProperty, json)),
      annotation,
    );
  } else {
    return makeLiteralExpression(json);
  }
};

/* eslint-enable no-use-before-define */

/////////////
// Reflect //
/////////////

export const makeReflectDefinePropertyExpression = partialx____(
  makeIntrinsicApplyExpression3,
  "Reflect.defineProperty",
);

export const makeReflectSetPrototypeOfExpression = partialx____(
  makeIntrinsicApplyExpression2,
  "Reflect.setProtoypeOf",
);

///////////
// Array //
///////////

export const makeArrayFromExpression = partialx__(
  makeIntrinsicApplyExpression1,
  "Array.from",
);

////////////
// Object //
////////////

// Compared to Reflect, Object methods sometimes lead
// to more efficient transpiled code because they
// return the object and allow operation chaining.

export const makeObjectFreezeExpression = partialx__(
  makeIntrinsicApplyExpression1,
  "Object.freeze",
);

export const makeObjectDefinePropertyExpression = partialx____(
  makeIntrinsicApplyExpression3,
  "Object.defineProperty",
);

export const makeObjectAssignExpression = partialx___(
  makeIntrinsicApplyExpression2,
  "Object.assign",
);

//////////
// Data //
//////////

// const intrinsics = [
//   "aran.globalCache",
//   "aran.globalObject",
//   "aran.globalRecord",
//   "aran.deadzone",
//   "Symbol.iterator",
//   "Symbol.unscopables",
// ];
//
// export const makeIntrinsicExpression = (name) => {
//   assert(includes(intrinsics, name), "invalid direct intrinsic expression");
//   return makeRawIntrinsicExpression(name);
// };
//
//
// export const makeGlobalCacheExpression = partialx(
//   makeIntrinsicExpression,
//   "aran.globalCache",
// );
//
// export const makeGlobalObjectExpression = partialx(
//   makeIntrinsicExpression,
//   "aran.globalObject",
// );
//
// export const makeGlobalRecordExpression = partialx(
//   makeIntrinsicExpression,
//   "aran.globalRecord",
// );
//
// export const makeDeadzoneExpression = partialx(
//   makeIntrinsicExpression,
//   "aran.deadzone",
// );
//
// export const makeSymbolIteratorExpression = partialx(
//   makeIntrinsicExpression,
//   "Symbol.iterator",
// );
//
// export const makeSymbolUnscopablesExpression = partialx(
//   makeIntrinsicExpression,
//   "Symbol.unscopables",
// );

///////////
// Macro //
///////////

export const makeIsNullishExpression = (pure) =>
  makeConditionalExpression(
    makeBinaryExpression("===", pure, makeLiteralExpression(null)),
    makeLiteralExpression(true),
    makeBinaryExpression(
      "===",
      pure,
      makeLiteralExpression({ undefined: null }),
    ),
  );

////////////
// Global //
////////////

// export const makeTypeofGlobalExpression = partialxf_(
//   makeIntrinsicApplyExpression1,
//   "aran.typeofGlobal",
//   makeLiteralExpression,
// );
//
// export const makeReadGlobalExpression = partialxf_(
//   makeIntrinsicApplyExpression1,
//   "aran.readGlobal",
//   makeLiteralExpression,
// );
//
// export const makeDiscardGlobalSloppyExpression = partialxf_(
//   makeIntrinsicApplyExpression1,
//   "aran.discardGlobalSloppy",
//   makeLiteralExpression,
// );
//
// export const makeDiscardGlobalExpression = (
//   strict,
//   variable,
//   annotation = undefined,
// ) => {
//   assert(!strict, "unexpected strict global delete");
//   return makeDiscardGlobalSloppyExpression(variable, annotation);
// };
//
// export const makeWriteGlobalStrictExpression = partialxf__(
//   makeIntrinsicApplyExpression2,
//   "aran.writeGlobalStrict",
//   makeLiteralExpression,
// );
//
// export const makeWriteGlobalSloppyExpression = partialxf__(
//   makeIntrinsicApplyExpression2,
//   "aran.writeGlobalSloppy",
//   makeLiteralExpression,
// );
//
// export const makeWriteGlobalExpression = partialxx_f__(
//   makeDualIntrinsicApplyExpression2,
//   "aran.writeGlobalStrict",
//   "aran.writeGlobalSloppy",
//   makeLiteralExpression,
// );
