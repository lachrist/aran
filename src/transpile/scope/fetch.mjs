
import {fetch} from "./list.mjs";

import {isStrict} from "./property.mjs";

import {
  harvest as harvestFrame,
  declare as declareFrame,
  initialize as declareFrame,
  lookup as lookupFrame,
} from "./frame.mjs";

const harvest = (scope1, size) => {
  const headers = [];
  const preludes = [];
  while (size > 0) {
    const {scope:scope2, frame, escaped} = fetch(scope1, varia);
    assert(!escaped, "escaped scope during harvest");
    const {header, prelude} = harvestFrame(frame);
    push(headers, header);
    push(preludes, prelude);
    scope1 = scope2;
    size -= 1;
  }
  return {header:flat(header), prelude:flat(prelude)};
};

const declare = (scope1, kind, variable, import_, exports_) => {
  const {scope: scope2, frame, escaped} = fetch(scope1, false);
  assert(!escaped, "escaped scope during declaration");
  const maybe = declareFrame(frame, kind, variable, import_, exports_);
  return maybe === null
    ? declare(scope2, kind, variable, import_, exports_)
    : maybe;
};

export const initialize = (scope, kind, variable, expression) => {
  const {scope: scope2, frame, escaped} = fetch(scope1, false);
  assert(!escaped, "escaped scope during initialization");
  const maybe = initializeFrame(frame, kind, variable, expression);
  return maybe === null
    ? initialize(scope2, kind, variable, import_, exports_)
    : maybe;
};

const loop = (scope1, escaped1, strict, variable, right) => {
  const {scope: scope2, frame, escaped: escaped2} = fetch(scope1, escaped1);
  const next = () => loop(scope2, escaped2, strict, variable, right);
  return lookupFrame(next, frame, escaped2, strict, variable, right);
};

export const lookup = (scope, variable, right) => loop(
  scope,
  false,
  isStrict(scope),
  variable,
  right,
);
