import {includes} from "array-lite";

import {assert} from "../../../util/index.mjs";

import * as BodyBlock from "./body-block.mjs";
import * as BodyClosure from "./body-closure.mjs";
import * as BodyDead from "./body-dead.mjs";
import * as BodyDef from "./body-def.mjs";
import * as BodyImport from "./body-import.mjs";
import * as BodyObject from "./body-object.mjs";
import * as BodyRecord from "./body-record.mjs";
import * as BodyWith from "./body-with.mjs";
import * as RootDef from "./root-def.mjs";
import * as RootEnclave from "./root-enclave.mjs";
import * as RootGlobal from "./root-global.mjs";
import * as RootMiss from "./root-miss.mjs";

export const BODY_BLOCK = "body-block";
export const BODY_CLOSURE = "body-closure";
export const BODY_DEAD = "body-dead";
export const BODY_DEF = "body-def";
export const BODY_IMPORT = "body-import";
export const BODY_OBJECT = "body-object";
export const BODY_RECORD = "body-record";
export const BODY_WITH = "body-with";
export const ROOT_DEF = "root-def";
export const ROOT_ENCLAVE = "root-enclave";
export const ROOT_GLOBAL = "root-global";
export const ROOT_MISS = "root-miss";

const libraries = {
  __proto__: null,
  [BODY_BLOCK]: BodyBlock,
  [BODY_CLOSURE]: BodyClosure,
  [BODY_DEAD]: BodyDead,
  [BODY_DEF]: BodyDef,
  [BODY_IMPORT]: BodyImport,
  [BODY_OBJECT]: BodyObject,
  [BODY_RECORD]: BodyRecord,
  [BODY_WITH]: BodyWith,
  [ROOT_DEF]: RootDef,
  [ROOT_ENCLAVE]: RootEnclave,
  [ROOT_GLOBAL]: RootGlobal,
  [ROOT_MISS]: RootMiss,
};

////////////
// Create //
////////////

export const create = (type, layer, options) => {
  const {create: method} = libraries[type];
  return {
    type,
    layer,
    ...method(layer, options),
  };
};

/////////////
// Harvest //
/////////////

export const harvest = (type, frame) => {
  assert(frame.type === type, "frame type mismatch");
  const {harvest: method} = libraries[type];
  return method(frame);
};

/////////////
// Declare //
/////////////

export const makeDeclareStatements = (
  strict,
  frame,
  kind,
  layer,
  variable,
  iimport,
  eexports,
) => {
  const {KINDS, makeDeclareStatements: method} = libraries[frame.type];
  if (frame.layer === layer && includes(KINDS, kind)) {
    return method(strict, frame, kind, variable, iimport, eexports);
  } else {
    return null;
  }
};

////////////////
// Initialize //
////////////////

export const makeInitializeStatements = (
  strict,
  frame,
  kind,
  layer,
  variable,
  expression,
) => {
  const {KINDS, makeInitializeStatements: method} = libraries[frame.type];
  if (frame.layer === layer && includes(KINDS, kind)) {
    return method(strict, frame, kind, variable, expression);
  } else {
    return null;
  }
};

////////////
// Lookup //
////////////

const generateLookup =
  (name) => (next, strict, escaped, frame, layer, variable, right) => {
    if (frame.layer === layer) {
      const makeLookupNode = libraries[frame.type][name];
      return makeLookupNode(next, strict, escaped, frame, variable, right);
    } else {
      return next();
    }
  };

export const makeLookupExpression = generateLookup("makeLookupExpression");

export const makeLookupEffect = generateLookup("makeLookupEffect");
