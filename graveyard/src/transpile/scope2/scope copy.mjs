import {
  makeBlock,
  makeReadExpression,
  makeSequenceEffect,
  makeWriteEffect,
} from "../../ast/index.mjs";

import {
  makeFrame,
  listFrameVariable,
  generateFrameDeclareStatement,
  generateFrameInitializeStatement,
  makeFrameLookupNode,
} from "./frame.mjs";
import { listMetaVariable } from "./meta.mjs";

////////////////////
// makeScopeBlock //
////////////////////

const makeScopeBlock = (
  strict,
  scope,
  options,
  labels,
  kinds,
  generateStatement,
) => {
  const frame = makeFrame(strict, kinds, options);
  const statements = generateStatement({
    car: frame,
    cdr: scope,
  });
  return makeBlock(
    labels,
    concat(listMetaVariable(statements), listFrameVariable(strict, frame)),
    concat(makeFrameDeclareStatementArray(strict, frame), statements),
  );
};

////////////////////////////
// generateScopeStatement //
////////////////////////////

export const generateScopeStatement = (
  strict,
  scope,
  options,
  kinds,
  generateStatement,
) => {
  const frame = makeFrame(strict, kinds, options);
  assert(listFrameVariable(strict, frame).length === 0, "unexpected variable");
  const statements = generateStatement({ car: frame, cdr: scope });
  return concat(map(listMetaVariable(statement, ), makeFrameDeclareStatementArray(strict, frame), statements);
};

/////////////////////////
// makeScopeLookupNode //
/////////////////////////

const makeScopeLookupNode = (
  strict,
  { car: frame, cdr: scope },
  variable,
  escaped1,
  lookup,
) =>
  makeFrameLookupNode(strict, frame, variable, escaped1, lookup, (escaped2) =>
    makeScopeLookupNode(strict, scope, variable, escaped2, lookup),
  );

const compileMakeScopeLookupExpression =
  (lookup) => (strict, scope, variable) =>
    makeScopeLookupNode(strict, scope, variable, false, lookup);

export const makeScopeReadExpression = compileMakeScopeLookupExpression({
  type: "read",
});

export const makeScopeTypeofExpression = compileMakeScopeLookupExpression({
  type: "typeof",
});

export const makeScopeDiscardExpression = compileMakeScopeLookupExpression({
  type: "discard",
});

export const makeScopeWriteEffect = (
  strict,
  scope,
  variable,
  pure,
  expression,
) =>
  makeScopeLookupNode(strict, scope, variable, false, {
    type: "write",
    pure,
    right: expression,
  });
