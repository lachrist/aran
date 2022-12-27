import { concat, reduce, includes, slice, every } from "array-lite";

import {
  assert,
  partialx__,
  partialx____,
  partialx_x____,
} from "../../util/index.mjs";

import {
  makeScriptProgram,
  makeBlock,
  makeEvalExpression,
} from "../../ast/index.mjs";

import { pushScopeFrame, popScopeFrame, hasScopeFrame } from "./core.mjs";

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

const harvest = ({ header, prelude, scope: scope1 }, _frame) => {
  const { scope: scope2, frame, escaped } = popScopeFrame(scope1, false);
  assert(!escaped, "escaped scope during harvest");
  return {
    header: concat(harvestFrameHeader(frame), header),
    prelude: concat(harvestFramePrelude(frame), prelude),
    scope: scope2,
  };
};

const makeScopeNode = (
  makeNode,
  _strict,
  scope,
  frames,
  makeStatementArray,
) => {
  scope = reduce(frames, pushScopeFrame, scope);
  const statements2 = makeStatementArray(scope);
  const { prelude: statements1, header: variables } = reduce(frames, harvest, {
    header: [],
    prelude: [],
    scope,
  });
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

export const makeScopeEvalExpression = (strict, scope, expression) => {
  // We need to assume the worse case regarding deadzone.
  // That is that the eval code will lookup variables from closures.
  lookupAll(strict, true, scope);
  return makeEvalExpression(expression);
};

/////////////
// Declare //
/////////////

export const declareScope = (
  strict,
  scope1,
  kind,
  layer,
  variable,
  options,
) => {
  const { scope: scope2, frame, escaped } = popScopeFrame(scope1, false);
  assert(!escaped, "escaped scope during declaration");
  conflictFrame(strict, frame, kind, layer, variable);
  if (!declareFrame(strict, frame, kind, layer, variable, options)) {
    declareScope(strict, scope2, kind, layer, variable, options);
  }
};

////////////////
// Initialize //
////////////////

export const makeScopeInitializeStatementArray = (
  strict,
  scope1,
  kind,
  layer,
  variable,
  expression,
) => {
  const { scope: scope2, frame, escaped } = popScopeFrame(scope1, false);
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
    return makeScopeInitializeStatementArray(
      strict,
      scope2,
      kind,
      layer,
      variable,
      expression,
    );
  } else {
    return maybe;
  }
};

////////////
// Lookup //
////////////

const lookup = (
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
      lookup(
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

export const makeScopeReadExpression = partialx_x____(
  lookup,
  makeFrameReadExpression,
  false,
);

export const makeScopeTypeofExpression = partialx_x____(
  lookup,
  makeFrameTypeofExpression,
  false,
);

export const makeScopeDiscardExpression = partialx_x____(
  lookup,
  makeFrameDiscardExpression,
  false,
);

export const makeScopeWriteEffect = partialx_x____(
  lookup,
  makeFrameWriteEffect,
  false,
);
