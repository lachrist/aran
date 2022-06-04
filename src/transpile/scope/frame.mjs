
import * as BodyBlock from "./frames/body-block.mjs";
import * as BodyClosure from "./frames/body-closure.mjs";
import * as BodyDead from "./frames/body-dead.mjs";
import * as BodyDef from "./frames/body-def.mjs";
import * as BodyObject from "./frames/body-object.mjs";
import * as BodyRecord from "./frames/body-record.mjs";
import * as BodyWith from "./frames/body-with.mjs";
import * as RootDef from "./frames/root-def.mjs";
import * as RootEnclave from "./frames/root-enclave.mjs";
import * as RootGlobal from "./frames/root-global.mjs";
import * as RootMiss from "./frames/root-miss.mjs";

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

const generateCreate = (layer, type) => {
  const {create} = libraries[type];
  return (options) => ({
    type,
    layer,
    ... create(layer, options),
  });
};

export const createBaseBodyBlock = generateCreate(BASE, BODY_BLOCK);

export const createBaseBodyClosure = generateCreate(BASE, BODY_CLOSURE);

export const createBaseBodyDead = generateCreate(BASE, BODY_DEAD);

export const createMetaBodyDef = generateCreate(META, BODY_DEF);

export const createBaseBodyImport = generateCreate(BASE, BODY_IMPORT);

export const createBaseBodyObject = generateCreate(BASE, BODY_OBJECT);

export const createBaseBodyRecord = generateCreate(BASE, BODY_RECORD);

export const createBaseBodyWith = generateCreate(BASE, BODY_WITH);

export const createMetaRootDef = generateCreate(META, ROOT_DEF);

export const createBaseRootEnclave = generateCreate(BASE, ROOT_ENCLAVE);

export const createBaseRootGlobal = generateCreate(BASE, ROOT_GLOBAL);

export const createBaseRootMiss = generateCreate(BASE, ROOT_MISS);

/////////////
// Harvest //
/////////////

const harvest = (frame) => {
  const {harvest} = libraries[frame.type];
  return harvest(frame);
};

/////////////
// Declare //
/////////////

const generateDeclare = (layer) => (strict, frame, kind, variable, iimport, eexports) => {
  if (frame.layer === layer) {
    const {KINDS, makeDeclareStatements} = libraries[frame.type];
    if (includes(KINDS, kind)) {
      return makeDeclareStatements(strict, frame, kind, variable, iimport, eexports);
    } else {
      return null;
    }
  } else {
    return null;
  }
};

const makeMetaDeclareStatements = generateDeclare(META);

const makeBaseDeclareStatements = generateDeclare(BASE);

////////////////
// Initialize //
////////////////

const generateInitialize = (layer) => (strict, frame, kind, variable, expression) => {
  if (frame.layer === layer) {
    const {KINDS, makeInitializeStatements} = libraries[frame.type];
    if (includes(KINDS, kind) {
      return makeInitializeStatements(strict, frame, kind, variable, expression);
    } else {
      return null;
    }
  } else {
    return null;
  }
};

const makeMetaInitializeStatements = generateInitialize(META);

const makeBaseInitializeStatements = generateInitialize(BASE);

////////////
// Lookup //
////////////

const generateLookup = (layer, name) => (next, strict, escaped, frame, variable, right) => {
  if (frame.layer === layer) {
    const makeLookupNode = libraries[frame.type][name];
    return makeLookupNode(next, strict, escaped, frame, variable, right);
  } else {
    return next();
  }
};

const makeMetaLookupExpression = generateLookup(META, "makeLookupExpression");

const makeMetaLookupEffect = generateLookup(META, "makeLookupEffect");

const makeBaseLookupExpression = generateLookup(BASE, "makeLookupExpression");

const makeBaseLookupEffect = generateLookup(BASE, "makeLookupEffect");
