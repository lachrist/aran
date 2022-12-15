import {
  bind_,
  partialx_,
  NIL,
  cons,
  car,
  cdr,
  convertListArray,
  convertArrayList,
} from "../../util/index.mjs";

const {
  Error,
  JSON: { parse: parseJSON, stringify: stringifyJSON },
} = globalThis;

const CLOSURE_FRAME = null;

export const ROOT_SCOPE = NIL;

export const encloseScope = partialx_(cons, CLOSURE_FRAME);

export const pushScopeFrame = (scope, frame) => cons(frame, scope);

export const hasScopeFrame = (scope) => {
  if (scope === ROOT_SCOPE) {
    return false;
  } else if (car(scope) === CLOSURE_FRAME) {
    return hasScopeFrame(cdr(scope));
  } else {
    return true;
  }
};

export const popScopeFrame = (scope, escaped) => {
  if (scope === ROOT_SCOPE) {
    throw new Error("cannot pop frame from the root scope");
  } else {
    const frame = car(scope);
    if (frame === CLOSURE_FRAME) {
      return popScopeFrame(cdr(scope), true);
    } else {
      return {
        scope: cdr(scope),
        frame,
        escaped,
      };
    }
  }
};

const deepClone = bind_(parseJSON, stringifyJSON);

export const packScope = bind_(deepClone, convertListArray);

export const unpackScope = bind_(deepClone, convertArrayList);
