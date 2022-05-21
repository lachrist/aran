
import {
  cons,
  car,
  cdr,
} from "../../util.mjs";

export {
  fromListArray as pack,
  fromArrayList as unpack,
} from "../../util.mjs";

export const ROOT = null;

//////////////
// Property //
//////////////

const PROPERTY_TYPE = "property";

export const set = (scope, key, value) => cons(
  {
    type: PROPERTY_TYPE,
    key,
    value,
  },
  scope,
);

export const get = (scope, key) => {
  while (scope !== null) {
    const point = car(scope);
    if (point.type === PROPERTY_TYPE && point.key === key) {
      return point.value;
    }
    scope = cdr(scope);
  }
  throw new Error("missing scope property");
};

//////////
// Page //
//////////

const PAGE_TYPE = "page";

const CLOSURE_TYPE = "closure";

export const extend = (scope, page) => cons(
  {
    type: PAGE_TYPE,
    page,
  },
  scope,
);

export const enclose = partialx_(cons, {type:CLOSURE_TYPE});

export const lookup = (scope, escaped) => {
  if (scope === null) {
    throw new Error("unbound scope");
  } else {
    const point = car(scope);
    if (point.type === PAGE_TYPE) {
      return {
        page: point.page,
        scope: cdr(scope),
        escaped,
      };
    } else {
      if (point.type === CLOSURE_TYPE) {
        escaped = true;
      }
      return lookup(cdr(scope), escaped);
    }
  }
};
