import {flat} from "array-lite";

import {push, assert} from "../../util/index.mjs";

import {
  extend as extendStructure,
  fetch as fetchStructure,
} from "./structure.mjs";

import {isStrict} from "./property.mjs";

import {
  create as createFrame,
  harvest as harvestFrame,
  makeDeclareStatements as makeFrameDeclareStatements,
  makeInitializeStatements as makeFrameInitializeStatements,
  makeLookupExpression as makeFrameLookupExpression,
  makeLookupEffect as makeFrameLookupEffect,
} from "./frame/index.mjs";

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

export const declare = (
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
    ? declare(strict, scope2, kind, layer, variable, iimport, eexports)
    : maybe;
};

export const makeDeclareStatements = (
  scope,
  kind,
  layer,
  variable,
  iimport,
  eexports,
) => declare(isStrict(scope), scope, kind, layer, variable, iimport, eexports);

export const initialize = (
  strict,
  scope1,
  kind,
  layer,
  variable,
  expression,
) => {
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
    ? initialize(strict, scope2, kind, layer, variable, expression)
    : maybe;
};

export const makeInitializeStatements = (
  scope,
  kind,
  layer,
  variable,
  expression,
) => initialize(isStrict(scope), scope, kind, layer, variable, expression);

const lookup = (
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
      lookup(
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
  lookup(
    makeFrameLookupExpression,
    isStrict(scope),
    false,
    scope,
    layer,
    variable,
    right,
  );

export const makeLookupEffect = (scope, layer, variable, right) =>
  lookup(
    makeFrameLookupEffect,
    isStrict(scope),
    false,
    scope,
    layer,
    variable,
    right,
  );
