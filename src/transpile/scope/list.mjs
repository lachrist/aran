import {NIL, cons, car, cdr} from "../../util.mjs";

export {fromListArray as pack, fromArrayList as unpack} from "../../util.mjs";

//////////
// ROOT //
//////////

export const ROOT = NIL;

//////////////
// Property //
//////////////

const PROPERTY_TYPE = "property";

export const set = (scope, key, value) =>
  cons(
    {
      type: PROPERTY_TYPE,
      key,
      value,
    },
    scope,
  );

export const get = (scope, key) => {
  while (scope !== NIL) {
    const point = car(scope);
    if (point.type === PROPERTY_TYPE && point.key === key) {
      return point.value;
    }
    scope = cdr(scope);
  }
  throw new Error("missing scope property");
};

///////////
// Frame //
///////////

const FRAME_TYPE = "frame";

const CLOSURE_TYPE = "closure";

export const extend = (scope, frame) =>
  cons(
    {
      type: FRAME_TYPE,
      frame,
    },
    scope,
  );

export const enclose = partialx_(cons, {type: CLOSURE_TYPE});

export const fetch = (scope, escaped) => {
  if (scope === NIL) {
    throw new Error("unbound scope");
  } else {
    const point = car(scope);
    if (point.type === FRAME_TYPE) {
      return {
        scope: cdr(scope),
        frame: point.frame,
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
