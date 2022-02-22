import {getLast, pop} from "../util.mjs";

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

const generateMakeConstruct1 =
  (name) =>
  (expression1, annotation = undefined) =>
    makeConstructExpression(
      makeIntrinsicExpression(name),
      [expression1],
      annotation,
    );

// aran object //
export const makeObjectExpression = (...expressions) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject"),
    makeLiteralExpression({undefined: null}),
    expressions,
    typeof getLast(expressions) === "object" && getLast(expressions) !== null
      ? undefined
      : pop(expressions),
  );

export const makeGetExpression = generateMakeApply2("aran.get");
export const makeSloppySetExpression = generateMakeApply3("aran.setSloppy");
export const makeStrictSetExpression = generateMakeApply3("aran.setStrict");
export const makeThrowExpression = generateMakeApply1("aran.throw");

// aran global //
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

// aran operator //
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

export const makeReferenceErrorExpression =
  generateMakeConstruct1("ReferenceError");
export const makeSyntaxErrorExpression = generateMakeConstruct1("SyntaxError");
export const makeTypeErrorExpression = generateMakeConstruct1("TypeError");
