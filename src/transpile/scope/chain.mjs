import {concat, reduce, includes, slice, every} from "array-lite";

import {assert, partialx__, partialx___} from "../../util/index.mjs";

import {
  makeScriptProgram as makeRawScriptProgram,
  makeBlock as makeRawBlock,
} from "../../ast/index.mjs";

import {
  extend as extendStructure,
  fetch as fetchStructure,
} from "./structure.mjs";

import {isStrict} from "./property.mjs";

import {
  conflict as conflictFrame,
  harvest as harvestFrame,
  declare as declareFrame,
  makeInitializeStatementArray as makeFrameInitializeStatementArray,
  makeReadExpression as makeFrameReadExpression,
  makeTypeofExpression as makeFrameTypeofExpression,
  makeDiscardExpression as makeFrameDiscardExpression,
  makeWriteEffect as makeFrameWriteEffect,
} from "./frame/index.mjs";

///////////
// Block //
///////////

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

export const makeBlock = (scope, labels, frames, makeStatementArray) =>
  makeScopeNode(
    partialx__(makeRawBlock, labels),
    scope,
    frames,
    makeStatementArray,
  );

export const makeScriptProgram = partialx___(
  makeScopeNode,
  makeRawScriptProgram,
);

/////////////
// Declare //
/////////////

const declareLoop = (strict, scope1, kind, layer, variable, options) => {
  const {scope: scope2, frame, escaped} = fetchStructure(scope1, false);
  assert(!escaped, "escaped scope during declaration");
  conflictFrame(strict, frame, kind, layer, variable);
  if (!declareFrame(strict, frame, kind, layer, variable, options)) {
    declareLoop(strict, scope2, kind, layer, variable, options);
  }
};

export const declare = (scope, kind, layer, variable, options) =>
  declareLoop(isStrict(scope), scope, kind, layer, variable, options);

////////////////
// Initialize //
////////////////

const initializeLoop = (strict, scope1, kind, layer, variable, expression) => {
  const {scope: scope2, frame, escaped} = fetchStructure(scope1, false);
  assert(!escaped, "escaped scope during initialization");
  const maybe = makeFrameInitializeStatementArray(
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

export const makeInitializeStatementArray = (
  scope,
  kind,
  layer,
  variable,
  expression,
) => initializeLoop(isStrict(scope), scope, kind, layer, variable, expression);

////////////
// Lookup //
////////////

const lookupLoop = (
  makeFrameLookupNode,
  strict,
  escaped1,
  scope1,
  layer,
  variable,
  options,
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
        options,
      ),
    strict,
    escaped2,
    frame,
    layer,
    variable,
    options,
  );
};

const generateLookup =
  (makeFrameLookupNode) => (scope, layer, variable, options) =>
    lookupLoop(
      makeFrameLookupNode,
      isStrict(scope),
      false,
      scope,
      layer,
      variable,
      options,
    );

export const makeReadExpression = generateLookup(makeFrameReadExpression);

export const makeTypeofExpression = generateLookup(makeFrameTypeofExpression);

export const makeDiscardExpression = generateLookup(makeFrameDiscardExpression);

export const makeWriteEffect = generateLookup(makeFrameWriteEffect);
