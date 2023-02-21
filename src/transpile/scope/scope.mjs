import { flatMap, concat, reduce, includes, slice, every } from "array-lite";

import {
  consFlip,
  assert,
  partialx__,
  partialx____,
  partial__x_x,
  partial__x__,
  bind_,
  convertListArray,
  convertArrayList,
} from "../../util/index.mjs";

import {
  makeScriptProgram,
  makeBlock,
  makeEvalExpression,
} from "../../ast/index.mjs";

import {
  harvestFrameHeader,
  harvestFramePrelude,
  declareFrame,
  makeFrameInitializeStatementArray,
  lookupFrameAll,
  makeFrameReadExpression,
  makeFrameTypeofExpression,
  makeFrameDiscardExpression,
  makeFrameWriteEffect,
} from "./frame.mjs";

const {
  Array: { isArray },
  JSON: { stringify: stringifyJSON, parse: parseJSON },
} = globalThis;

//////////
// Core //
//////////

export const ROOT_SCOPE = null;

const deepClone = bind_(parseJSON, stringifyJSON);

export const packScope = bind_(deepClone, convertListArray);

export const unpackScope = bind_(deepClone, convertArrayList);

///////////
// Block //
///////////

const isUnique = (element, index, array) =>
  !includes(slice(array, 0, index), element);

const makeScopeNode = (
  makeNode,
  _strict,
  scope,
  frames,
  makeStatementArray,
) => {
  scope = reduce(frames, consFlip, scope);
  const statements2 = makeStatementArray(scope);
  const variables = flatMap(frames, harvestFrameHeader);
  const statements1 = flatMap(frames, harvestFramePrelude);
  assert(every(variables, isUnique), "duplicate variable after grouping");
  return makeNode(variables, concat(statements1, statements2));
};

export const makeScopeFrameBlock = (
  strict,
  scope,
  labels,
  frames,
  makeStatementArray,
) =>
  makeScopeNode(
    partialx__(makeBlock, labels),
    strict,
    scope,
    frames,
    makeStatementArray,
  );

export const makeScopeFrameScriptProgram = partialx____(
  makeScopeNode,
  (variables, statements) => {
    assert(variables.length === 0, "unexpected script header");
    return makeScriptProgram(statements);
  },
);

//////////
// Eval //
//////////

const lookupScopeAll = (strict, scope1) => {
  if (scope1 !== null) {
    const { car: frame, cdr: scope2 } = scope1;
    // We need to assume the worse case regarding deadzone.
    // That is that the eval code will lookup variables from
    // inside closures. So `escaped = true`.
    lookupFrameAll(strict, true, frame);
    lookupScopeAll(strict, scope2);
  }
};

export const makeScopeEvalExpression = (strict, scope, expression) => {
  lookupScopeAll(strict, scope);
  return makeEvalExpression(expression);
};

/////////////
// Declare //
/////////////

export const declareScope = (strict, scope, kind, variable, options) => {
  let maybe_trail = { program: false };
  while (maybe_trail !== null) {
    assert(scope !== null, "missing binding scope during declaration");
    const { car: frame, cdr: parent_scope } = scope;
    scope = parent_scope;
    maybe_trail = declareFrame(
      strict,
      frame,
      maybe_trail,
      kind,
      variable,
      options,
    );
  }
};

////////////////
// Initialize //
////////////////

export const makeScopeInitializeStatementArray = (
  strict,
  scope,
  kind,
  variable,
  expression,
) => {
  let either = { program: false };
  while (!isArray(either)) {
    assert(scope !== null, "missing binding scope during initialization");
    const { car: frame, cdr: parent_scope } = scope;
    scope = parent_scope;
    either = makeFrameInitializeStatementArray(
      strict,
      frame,
      either,
      kind,
      variable,
      expression,
    );
  }
  return either;
};

////////////
// Lookup //
////////////

const compileMakeScopeLookupNode = (makeFrameLookupNode) => {
  const makeScopeLookupNode = (strict, scope1, escaped, variable, options) => {
    assert(scope1 !== null, "missing binding scope during declaration");
    const { car: frame, cdr: scope2 } = scope1;
    return makeFrameLookupNode(
      makeScopeLookupNode,
      strict,
      frame,
      scope2,
      escaped,
      variable,
      options,
    );
  };
  return makeScopeLookupNode;
};

export const makeScopeReadExpression = partial__x_x(
  compileMakeScopeLookupNode(makeFrameReadExpression),
  false,
  null,
);

export const makeScopeTypeofExpression = partial__x_x(
  compileMakeScopeLookupNode(makeFrameTypeofExpression),
  false,
  null,
);

export const makeScopeDiscardExpression = partial__x_x(
  compileMakeScopeLookupNode(makeFrameDiscardExpression),
  false,
  null,
);

export const makeScopeWriteEffect = partial__x__(
  compileMakeScopeLookupNode(makeFrameWriteEffect),
  false,
);
