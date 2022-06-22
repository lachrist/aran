import {includes} from "array-lite";

import * as BlockDynamic from "./block-dynamic.mjs";
import * as BlockStaticDead from "./block-static-dead.mjs";
import * as BlockStatic from "./block-static.mjs";
import * as ClosureDynamic from "./closure-dynamic.mjs";
import * as ClosureStatic from "./closure-static.mjs";
import * as DefineDynamic from "./define-dynamic.mjs";
import * as DefineStatic from "./define-static.mjs";
import * as EmptyDynamicWith from "./empty-dynamic-with.mjs";
import * as EmptyVoid from "./empty-void.mjs";
import * as Enclave from "./enclave.mjs";
import * as Illegal from "./illegal.mjs";
import * as ImportStatic from "./import-static.mjs";
import * as Macro from "./macro.mjs";

export const BLOCK_DYNAMIC = "block-dynamic";
export const BLOCK_STATIC_DEAD = "block-static-dead";
export const BLOCK_STATIC = "block-static";
export const CLOSURE_DYNAMIC = "closure-dynamic";
export const CLOSURE_STATIC = "closure-static";
export const DEFINE_DYNAMIC = "define-dynamic";
export const DEFINE_STATIC = "define-static";
export const EMPTY_DYNAMIC_WITH = "empty-dynamic-with";
export const EMPTY_VOID = "empty-void";
export const ENCLAVE = "enclave";
export const ILLEGAL = "illegal";
export const IMPORT_STATIC = "import-static";
export const MACRO = "macro";

const libraries = {
  __proto__: null,
  [BLOCK_DYNAMIC]: BlockDynamic,
  [BLOCK_STATIC_DEAD]: BlockStaticDead,
  [BLOCK_STATIC]: BlockStatic,
  [CLOSURE_DYNAMIC]: ClosureDynamic,
  [CLOSURE_STATIC]: ClosureStatic,
  [DEFINE_DYNAMIC]: DefineDynamic,
  [DEFINE_STATIC]: DefineStatic,
  [EMPTY_DYNAMIC_WITH]: EmptyDynamicWith,
  [EMPTY_VOID]: EmptyVoid,
  [ENCLAVE]: Enclave,
  [ILLEGAL]: Illegal,
  [IMPORT_STATIC]: ImportStatic,
  [MACRO]: Macro,
};

////////////
// Create //
////////////

export const createFrame = (type, layer, options) => {
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

const generateHarvest = (name) => (frame) => {
  const method = libraries[frame.type][name];
  return method(frame);
};

export const harvestFrameHeader = generateHarvest("harvestHeader");

export const harvestFramePrelude = generateHarvest("harvestPrelude");

//////////////
// Conflict //
//////////////

export const conflictFrame = (strict, frame, kind, layer, variable) => {
  const {KINDS, conflict: method} = libraries[frame.type];
  if (frame.layer === layer) {
    method(strict, frame, kind, variable);
    return includes(KINDS, kind);
  } else {
    return false;
  }
};

/////////////
// Declare //
/////////////

export const declareFrame = (strict, frame, kind, layer, variable, options) => {
  const {KINDS, declare: method} = libraries[frame.type];
  if (frame.layer === layer && includes(KINDS, kind)) {
    method(strict, frame, kind, variable, options);
    return true;
  } else {
    return false;
  }
};

////////////////
// Initialize //
////////////////

export const makeFrameInitializeStatementArray = (
  strict,
  frame,
  kind,
  layer,
  variable,
  expression,
) => {
  const {KINDS, makeInitializeStatementArray: method} = libraries[frame.type];
  if (frame.layer === layer && includes(KINDS, kind)) {
    return method(strict, frame, kind, variable, expression);
  } else {
    return null;
  }
};

///////////////
// LookupAll //
///////////////

export const lookupFrameAll = (strict, escaped, frame) => {
  const {lookupAll: method} = libraries[frame.type];
  method(strict, escaped, frame);
};

////////////
// Lookup //
////////////

const generateLookup =
  (name) => (next, strict, escaped, frame, layer, variable, options) => {
    if (frame.layer === layer) {
      const makeLookupNode = libraries[frame.type][name];
      return makeLookupNode(next, strict, escaped, frame, variable, options);
    } else {
      return next();
    }
  };

export const makeFrameReadExpression = generateLookup("makeReadExpression");

export const makeFrameTypeofExpression = generateLookup("makeTypeofExpression");

export const makeFrameDiscardExpression = generateLookup(
  "makeDiscardExpression",
);

export const makeFrameWriteEffect = generateLookup("makeWriteEffect");
