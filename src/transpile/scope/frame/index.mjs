import {includes} from "array-lite";

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

const BODY_BLOCK = "body-block";
const BODY_CLOSURE = "body-closure";
const BODY_DEAD = "body-dead";
const BODY_DEF = "body-def";
const BODY_IMPORT = "body-import";
const BODY_OBJECT = "body-object";
const BODY_RECORD = "body-record";
const BODY_WITH = "body-with";
const ROOT_DEF = "root-def";
const ROOT_ENCLAVE = "root-enclave";
const ROOT_GLOBAL = "root-global";
const ROOT_MISS = "root-miss";

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

const generateCreate = (type) => {
  const {create} = libraries[type];
  return (layer, options) => ({
    type,
    layer,
    ...create(layer, options),
  });
};

export const createBodyBlock = generateCreate(BODY_BLOCK);

export const createBodyClosure = generateCreate(BODY_CLOSURE);

export const createBodyDead = generateCreate(BODY_DEAD);

export const createBodyDef = generateCreate(BODY_DEF);

export const createBodyImport = generateCreate(BODY_IMPORT);

export const createBodyObject = generateCreate(BODY_OBJECT);

export const createBodyRecord = generateCreate(BODY_RECORD);

export const createBodyWith = generateCreate(BODY_WITH);

export const createRootDef = generateCreate(ROOT_DEF);

export const createRootEnclave = generateCreate(ROOT_ENCLAVE);

export const createRootGlobal = generateCreate(ROOT_GLOBAL);

export const createRootMiss = generateCreate(ROOT_MISS);

/////////////
// Harvest //
/////////////

export const harvest = (frame) => {
  const {harvest: method} = libraries[frame.type];
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
