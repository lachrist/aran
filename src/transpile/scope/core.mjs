import {NIL, cons, car, cdr, partialx_} from "../../util/index.mjs";

export {
  convertListArray as pack,
  convertArrayList as unpack,
} from "../../util/index.mjs";

const {Error} = globalThis;

//////////
// ROOT //
//////////

export const ROOT = NIL;

//////////////
// Property //
//////////////

const PROPERTY_TYPE = "property";

export const defineBinding = (scope, key, value) =>
  cons(
    {
      type: PROPERTY_TYPE,
      key,
      value,
    },
    scope,
  );

export const lookupBinding = (scope, key) => {
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

export const appendFrame = (scope, frame) =>
  cons(
    {
      type: FRAME_TYPE,
      frame,
    },
    scope,
  );

export const enclose = partialx_(cons, {type: CLOSURE_TYPE});

export const isRoot = (scope) =>
  scope === NIL
    ? true
    : car(scope).type === FRAME_TYPE
    ? false
    : isRoot(cdr(scope));

export const drawFrame = (scope, escaped) => {
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
      return drawFrame(cdr(scope), escaped);
    }
  }
};
