import {concat, reduce, includes, slice, every} from "array-lite";

import {assert, partialx__, partialx___} from "../../util/index.mjs";

import {
  makeScriptProgram,
  makeBlock,
  makeEvalExpression,
} from "../../ast/index.mjs";

import {appendFrame, drawFrame, isRoot} from "./core.mjs";

import {isStrict} from "./binding.mjs";

import {
  conflictFrame,
  harvestFrameHeader,
  harvestFramePrelude,
  declareFrame,
  makeFrameInitializeStatementArray,
  lookupFrameAll,
  makeFrameReadExpression,
  makeFrameTypeofExpression,
  makeFrameDiscardExpression,
  makeFrameWriteEffect,
} from "./frame/index.mjs";

///////////
// Block //
///////////

const isUnique = (element, index, array) =>
  !includes(slice(array, 0, index), element);

const harvest = ({header, prelude, scope: scope1}, _frame) => {
  const {scope: scope2, frame, escaped} = drawFrame(scope1, false);
  assert(!escaped, "escaped scope during harvest");
  return {
    header: concat(harvestFrameHeader(frame), header),
    prelude: concat(harvestFramePrelude(frame), prelude),
    scope: scope2,
  };
};

const makeScopeNode = (makeNode, scope, frames, makeStatementArray) => {
  scope = reduce(frames, appendFrame, scope);
  const statements2 = makeStatementArray(scope);
  const {prelude: statements1, header: variables} = reduce(frames, harvest, {
    header: [],
    prelude: [],
    scope,
  });
  assert(every(variables, isUnique), "duplicate variable after grouping");
  return makeNode(variables, concat(statements1, statements2));
};

export const makeScopeBlock = (scope, labels, frames, makeStatementArray) =>
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

//////////
// Eval //
//////////

const harvestHeader = (scope1) => {
  if (isRoot(scope1)) {
    return [];
  } else {
    const {scope: scope2, frame} = drawFrame(scope1, false);
    return concat(harvestHeader(scope2), harvestFrameHeader(frame));
  }
};

const lookupAll = (strict, escaped1, scope1) => {
  if (!isRoot(scope1)) {
    const {
      scope: scope2,
      escaped: escaped2,
      frame,
    } = drawFrame(scope1, escaped1);
    lookupFrameAll(strict, escaped2, frame);
    lookupAll(strict, escaped2, scope2);
  }
};

export const makeScopeEvalExpression = (scope, expression) => {
  lookupAll(isStrict(scope), false, scope);
  return makeEvalExpression(harvestHeader(scope), expression);
};

/////////////
// Declare //
/////////////

const declareLoop = (strict, scope1, kind, layer, variable, options) => {
  const {scope: scope2, frame, escaped} = drawFrame(scope1, false);
  assert(!escaped, "escaped scope during declaration");
  conflictFrame(strict, frame, kind, layer, variable);
  if (!declareFrame(strict, frame, kind, layer, variable, options)) {
    declareLoop(strict, scope2, kind, layer, variable, options);
  }
};

export const declareScope = (scope, kind, layer, variable, options) =>
  declareLoop(isStrict(scope), scope, kind, layer, variable, options);

////////////////
// Initialize //
////////////////

const initializeLoop = (strict, scope1, kind, layer, variable, expression) => {
  const {scope: scope2, frame, escaped} = drawFrame(scope1, false);
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

export const makeScopeInitializeStatementArray = (
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
  const {scope: scope2, frame, escaped: escaped2} = drawFrame(scope1, escaped1);
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

export const makeScopeReadExpression = generateLookup(makeFrameReadExpression);

export const makeScopeTypeofExpression = generateLookup(
  makeFrameTypeofExpression,
);

export const makeScopeDiscardExpression = generateLookup(
  makeFrameDiscardExpression,
);

export const makeScopeWriteEffect = generateLookup(makeFrameWriteEffect);
