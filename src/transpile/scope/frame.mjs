
import * as BodyBlock from "./frames/body-block.mjs";
import * as BodyClosure from "./frames/body-closure.mjs";
import * as BodyHappy from "./frames/body-happy.mjs";
import * as BodyObject from "./frames/body-object.mjs";
import * as BodyRecord from "./frames/body-record.mjs";
import * as BodyWith from "./frames/body-with.mjs";
import * as RootEnclave from "./frames/root-enclave.mjs";
import * as RootGlobal from "./frames/root-global.mjs";
import * as RootHappy from "./frames/root-happy.mjs";
import * as RootMiss from "./frames/root-miss.mjs";

const BODY_BLOCK = "body-block";
const BODY_CLOSURE = "body-closure";
const BODY_HAPPY = "body-happy";
const BODY_OBJECT = "body-object";
const BODY_RECORD = "body-record";
const BODY_WITH = "body-with";
const ROOT_ENCLAVE = "root-enclave";
const ROOT_GLOBAL = "root-global";
const ROOT_HAPPY = "root-happy";
const ROOT_MISS = "root-miss";

const libraries = {
  __proto__: null,
  [BODY_BLOCK]: BodyBlock,
  [BODY_CLOSURE]: BodyClosure,
  [BODY_HAPPY]: BodyHappy,
  [BODY_OBJECT]: BodyObject,
  [BODY_RECORD]: BodyRecord,
  [BODY_WITH]: BodyWith,
  [ROOT_ENCLAVE]: RootEnclave,
  [ROOT_GLOBAL]: RootGlobal,
  [ROOT_HAPPY]: RootHappy,
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
    content: create(layer, options),
  });
};

export const createMetaRoot = generateCreate(META, ROOT_HAPPY);

export const createMetaBody = generateCreate(META, BODY_HAPPY);

export const createBaseRootMiss = generateCreate(BASE, ROOT_MISS);

export const createBaseRootGlobal = generateCreate(BASE, ROOT_GLOBAL);

export const createBaseRootEnclave = generateCreate(BASE, ROOT_ENCLAVE);

export const createBaseBodyObject = generateCreate(BASE, BODY_OBJECT);

export const createBaseBodyRecord = generateCreate(BASE, BODY_RECORD);

export const createBaseBodyClosure = generateCreate(BASE, BODY_CLOSURE);

export const createBaseBodyBlock = generateCreate(BASE, BODY_BLOCK);

export const createBaseBodyWith = generateCreate(BASE, BODY_WITH);

/////////////
// Harvest //
/////////////

const harvest = ({type, content}) => {
  const {harvest} = libraries[type];
  return harvest(content);
};

/////////////
// Declare //
/////////////

const generateDeclare = (layer1) => (strict, {type, layer:layer2, content}, kind, variable, iimport, eexports) => {
  if (layer1 === layer2) {
    const {conflict, declare, KINDS} = libraries[type];
    if (includes(KINDS, kind)) {
      return declare(strict, content, kind, variable, iimport, eexports);
    } else {
      conflict(strict, content, kind, variable);
      return null;
    }
  } else {
    return null;
  }
};

const declareMeta = generateDeclare(META);

const declareBase = generateDeclare(BASE);

////////////////
// Initialize //
////////////////

const generateInitialize = (layer1) => ({type, layer:layer2, content}, kind, variable, expression) => {
  if (layer1 === layer2) {
    const {initialize} = libraries[type];
    return initialize(content, kind, variable, expression);
  } else {
    return null;
  }
};

const initializeMeta = generateInitialize(META);

const initializeBase = generateInitialize(BASE);

////////////
// Lookup //
////////////

const generateLookup = (layer1) => (next, {type, layer:layer2, content}, escaped, strict, variable, right) => {
  if (layer1 === layer2) {
    const {lookup} = libraries[type];
    return lookup(next, content, escaped, strict, variable, expression);
  } else {
    return next();
  }
};

const lookupMeta = generateLookup(META);

const lookupBase = generateLookup(BASE);
