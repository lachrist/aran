import {concat, reduce, includes, slice, every} from "array-lite";

import {
  assert,
  partialx__,
  partialx___,
  partialx____,
} from "../../util/index.mjs";

import {makeScriptProgram, makeBlock} from "../../ast/index.mjs";

import {
  extend as extendStructure,
  fetch as fetchStructure,
} from "./structure.mjs";

import {isStrict} from "./property.mjs";

import {
  conflict as conflictFrame,
  harvest as harvestFrame,
  makeDeclareStatements as makeFrameDeclareStatements,
  makeInitializeStatements as makeFrameInitializeStatements,
  makeLookupExpression as makeFrameLookupExpression,
  makeLookupEffect as makeFrameLookupEffect,
} from "./frame/index.mjs";

const isUnique = (element, index, array) =>
  !includes(slice(array, 0, index), element);

const harvest = (
  {header: header2, prelude: prelude2, scope: scope1},
  _input,
) => {
  const {scope: scope2, frame, escaped} = fetchStructure(scope1, false);
  assert(!escaped, "escaped scope during harvest");
  const {header: header1, prelude: prelude1} = harvestFrame(frame);
  return {
    header: concat(header1, header2),
    prelude: concat(prelude1, prelude2),
    scope: scope2,
  };
};

const makeScopeNode = (makeNode, scope, frames, makeStatementArray) => {
  scope = reduce(frames, extendStructure, scope);
  const statements2 = makeStatementArray(scope);
  const {prelude: statements1, header: variables} = reduce(frames, harvest, {
    header: [],
    prelude: [],
    scope,
  });
  assert(every(variables, isUnique), "duplicate variable after grouping");
  return makeNode(variables, concat(statements1, statements2));
};

export const makeScopeBlock = (scope, frames, labels, makeStatementArray) =>
  makeScopeNode(
    partialx__(makeBlock, labels),
    scope,
    frames,
    makeStatementArray,
  );

export const makeScopeScriptProgram = partialx___(
  makeScopeNode,
  makeScriptProgram,
);

const declareLoop = (
  strict,
  scope1,
  kind,
  layer,
  variable,
  iimport,
  eexports,
) => {
  const {scope: scope2, frame, escaped} = fetchStructure(scope1, false);
  assert(!escaped, "escaped scope during declaration");
  conflictFrame(strict, frame, kind, layer, variable);
  const maybe = makeFrameDeclareStatements(
    strict,
    frame,
    kind,
    layer,
    variable,
    iimport,
    eexports,
  );
  return maybe === null
    ? declareLoop(strict, scope2, kind, layer, variable, iimport, eexports)
    : maybe;
};

export const makeDeclareStatements = (
  scope,
  kind,
  layer,
  variable,
  iimport,
  eexports,
) =>
  declareLoop(isStrict(scope), scope, kind, layer, variable, iimport, eexports);

const initializeLoop = (strict, scope1, kind, layer, variable, expression) => {
  const {scope: scope2, frame, escaped} = fetchStructure(scope1, false);
  assert(!escaped, "escaped scope during initialization");
  const maybe = makeFrameInitializeStatements(
    strict,
    frame,
    kind,
    layer,
    variable,
    expression,
  );
  if (maybe === null) {
    conflictFrame(strict, frame, kind, layer, variable);
    return initializeLoop(strict, scope2, kind, layer, variable, expression);
  } else {
    return maybe;
  }
};

export const makeInitializeStatements = (
  scope,
  kind,
  layer,
  variable,
  expression,
) => initializeLoop(isStrict(scope), scope, kind, layer, variable, expression);

const lookupLoop = (
  makeFrameLookupNode,
  strict,
  escaped1,
  scope1,
  layer,
  variable,
  right,
) => {
  const {
    scope: scope2,
    frame,
    escaped: escaped2,
  } = fetchStructure(scope1, escaped1);
  return makeFrameLookupNode(
    () =>
      lookupLoop(
        makeFrameLookupNode,
        strict,
        escaped2,
        scope2,
        layer,
        variable,
        right,
      ),
    strict,
    escaped2,
    frame,
    layer,
    variable,
    right,
  );
};

const makeLookupNode = (makeFrameLookupNode, scope, layer, variable, right) =>
  lookupLoop(
    makeFrameLookupNode,
    isStrict(scope),
    false,
    scope,
    layer,
    variable,
    right,
  );

export const makeLookupExpression = partialx____(
  makeLookupNode,
  makeFrameLookupExpression,
);

export const makeLookupEffect = partialx____(
  makeLookupNode,
  makeFrameLookupEffect,
);
