import {concat, reduce, includes, slice, every} from "array-lite";

import {assert, partialx__, partialx___} from "../../util/index.mjs";

import {
  makeInternalLocalEvalProgram,
  makeScriptProgram,
  makeBlock,
  makeEvalExpression,
} from "../../ast/index.mjs";

import {pushScopeFrame, popScopeFrame, hasScopeFrame} from "./core.mjs";

import {isStrictScope} from "./binding.mjs";

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
  const {scope: scope2, frame, escaped} = popScopeFrame(scope1, false);
  assert(!escaped, "escaped scope during harvest");
  return {
    header: concat(harvestFrameHeader(frame), header),
    prelude: concat(harvestFramePrelude(frame), prelude),
    scope: scope2,
  };
};

const makeScopeNode = (makeNode, scope, frames, makeStatementArray) => {
  scope = reduce(frames, pushScopeFrame, scope);
  const statements2 = makeStatementArray(scope);
  const {prelude: statements1, header: variables} = reduce(frames, harvest, {
    header: [],
    prelude: [],
    scope,
  });
  assert(every(variables, isUnique), "duplicate variable after grouping");
  return makeNode(variables, concat(statements1, statements2));
};

export const makeScopeFrameBlock = (
  scope,
  labels,
  frames,
  makeStatementArray,
) =>
  makeScopeNode(
    partialx__(makeBlock, labels),
    scope,
    frames,
    makeStatementArray,
  );

export const makeScopeFrameScriptProgram = partialx___(
  makeScopeNode,
  makeScriptProgram,
);

//////////
// Eval //
//////////

const harvestHeader = (scope1) => {
  if (hasScopeFrame(scope1)) {
    const {scope: scope2, frame} = popScopeFrame(scope1, false);
    return concat(harvestHeader(scope2), harvestFrameHeader(frame));
  } else {
    return [];
  }
};

const lookupAll = (strict, escaped1, scope1) => {
  if (hasScopeFrame(scope1)) {
    const {
      scope: scope2,
      escaped: escaped2,
      frame,
    } = popScopeFrame(scope1, escaped1);
    lookupFrameAll(strict, escaped2, frame);
    lookupAll(strict, escaped2, scope2);
  }
};

const makeLabelessBlock = partialx__(makeBlock, []);

export const makeScopeFrameInternalLocalEvalProgram = (
  scope,
  frames,
  makeStatementArray,
) =>
  makeInternalLocalEvalProgram(
    harvestHeader(scope),
    makeScopeNode(makeLabelessBlock, scope, frames, makeStatementArray),
  );

export const makeScopeEvalExpression = (scope, expression) => {
  // We need to assume the worse case regarding deadzone.
  // That is that the eval code will lookup variables from closures.
  lookupAll(isStrictScope(scope), true, scope);
  return makeEvalExpression(harvestHeader(scope), expression);
};

/////////////
// Declare //
/////////////

const declareLoop = (strict, scope1, kind, layer, variable, options) => {
  const {scope: scope2, frame, escaped} = popScopeFrame(scope1, false);
  assert(!escaped, "escaped scope during declaration");
  conflictFrame(strict, frame, kind, layer, variable);
  if (!declareFrame(strict, frame, kind, layer, variable, options)) {
    declareLoop(strict, scope2, kind, layer, variable, options);
  }
};

export const declareScope = (scope, kind, layer, variable, options) =>
  declareLoop(isStrictScope(scope), scope, kind, layer, variable, options);

////////////////
// Initialize //
////////////////

const initializeLoop = (strict, scope1, kind, layer, variable, expression) => {
  const {scope: scope2, frame, escaped} = popScopeFrame(scope1, false);
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
) =>
  initializeLoop(
    isStrictScope(scope),
    scope,
    kind,
    layer,
    variable,
    expression,
  );

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
  } = popScopeFrame(scope1, escaped1);
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
      isStrictScope(scope),
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
