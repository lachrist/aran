import {NIL, cons, car, cdr, partialx_} from "../../util/index.mjs";

export {
  convertListArray as packScope,
  convertArrayList as unpackScope,
} from "../../util/index.mjs";

const {Error} = globalThis;

const BINDING_TYPE = "property";

const FRAME_TYPE = "frame";

const CLOSURE_TYPE = "closure";

//////////
// ROOT //
//////////

export const ROOT_SCOPE = NIL;

/////////////
// Binding //
/////////////

export const defineScopeBinding = (scope, key, value) =>
  cons(
    {
      type: BINDING_TYPE,
      key,
      value,
    },
    scope,
  );

export const lookupScopeBinding = (scope, key) => {
  while (scope !== NIL) {
    const point = car(scope);
    if (point.type === BINDING_TYPE && point.key === key) {
      return point.value;
    }
    scope = cdr(scope);
  }
  throw new Error("missing scope property");
};

///////////
// Frame //
///////////

export const encloseScope = partialx_(cons, {type: CLOSURE_TYPE});

export const pushScopeFrame = (scope, frame) =>
  cons(
    {
      type: FRAME_TYPE,
      frame,
    },
    scope,
  );

export const hasScopeFrame = (scope) =>
  scope === NIL
    ? false
    : car(scope).type === FRAME_TYPE
    ? true
    : hasScopeFrame(cdr(scope));

export const popScopeFrame = (scope, escaped) => {
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
      return popScopeFrame(cdr(scope), escaped);
    }
  }
};
