
import {extend, lookup} from "./core1.mjs";

export {ROOT, set, get, enclose} from "./core2.mjs";

const lookupKindAll = (scope, kind) => {
  const pages = [];
  let stop = false;
  while (!stop) {
    const result = lookup(scope, false);
    assert(!result.escaped, "escaped scope on page lookup");
    push(pages, extract(result.frame));
    scope = result.scope;
    stop = contains(result.frame, kind)
  }
  return pages;
};

const lookupKind = (scope1, kind) => {
  const {
    scope: scope2,
    frame,
    escaped,
  } = lookup(scope1, false);
  assert(!escaped, "escaped scope on page lookup");
  return contains(frame, kind)
    ? extract(frame)
    : lookupKind(scope2, kind1);
};

const check = (scope, kind, variable, note) => flatMap(
  lookupKindAll(scope, kind),
  partial_xxx(checkPage, kind, variable, note),
);

const declare = (scope, kind, variable, note) => declarePage(
  lookupPage(scope, kind),
  kind,
  variable,
  note,
);

export const initialize = (scope, kind, variable, expression) => initializePage(
  lookupKind(scope, kind),
  kind,
  variable,
  expression,
);

const lookup = (scope1, escaped1, variable, right) => {
  const {
    scope: scope2,
    frame: {page},
    escaped: escaped2,
  } = lookup(scope1, escaped2);
  return lookupPage(
    () => lookup(scope2, escaped2, variable, right),
    page,
    escaped2,
    variable,
    right,
  );
};

export const lookup = partial_x__(lookup, false);
