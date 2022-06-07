import {flat} from "array-lite";

import {push, assert} from "../../util/index.mjs";

import {
  extend as extendStructure,
  fetch as fetchStructure,
} from "./structure.mjs";

import {isStrict} from "./property.mjs";

import {
  create as createFrame,
  conflict as conflictFrame,
  harvest as harvestFrame,
  makeDeclareStatements as makeFrameDeclareStatements,
  makeInitializeStatements as makeFrameInitializeStatements,
  makeLookupExpression as makeFrameLookupExpression,
  makeLookupEffect as makeFrameLookupEffect,
} from "./frame/index.mjs";

const {undefined} = globalThis;

export const extend = (parent, type, layer, options) =>
  extendStructure(parent, createFrame(type, layer, options));

export const harvest = (types, scope1) => {
  const headers = [];
  const preludes = [];
  for (let index = 0; index < types.length; index += 1) {
    const {scope: scope2, frame, escaped} = fetchStructure(scope1, false);
    assert(!escaped, "escaped scope during harvest");
    const {header, prelude} = harvestFrame(types[index], frame);
    push(headers, header);
    push(preludes, prelude);
    scope1 = scope2;
  }
  return {header: flat(headers), prelude: flat(preludes)};
};

const conflictLoop = (strict, scope1, kind, layer, variable) => {
  const {scope: scope2, frame, escaped} = fetchStructure(scope1, false);
  assert(!escaped, "escaped scope during conflict");
  return conflictFrame(strict, frame, kind, layer, variable)
    ? undefined
    : conflictLoop(strict, scope2, kind, layer, variable);
};

export const conflict = (scope, kind, layer, variable) =>
  conflictLoop(isStrict(scope), scope, kind, layer, variable);

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
  return maybe === null
    ? initializeLoop(strict, scope2, kind, layer, variable, expression)
    : maybe;
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

export const makeLookupExpression = (scope, layer, variable, right) =>
  lookupLoop(
    makeFrameLookupExpression,
    isStrict(scope),
    false,
    scope,
    layer,
    variable,
    right,
  );

export const makeLookupEffect = (scope, layer, variable, right) =>
  lookupLoop(
    makeFrameLookupEffect,
    isStrict(scope),
    false,
    scope,
    layer,
    variable,
    right,
  );
