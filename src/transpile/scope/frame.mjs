import { getVariableLayer } from "./variable.mjs";

import * as BlockDynamic from "./frames/block-dynamic.mjs";
import * as BlockStaticDead from "./frames/block-static-dead.mjs";
import * as BlockStatic from "./frames/block-static.mjs";
import * as ClosureDynamic from "./frames/closure-dynamic.mjs";
import * as ClosureStatic from "./frames/closure-static.mjs";
import * as DefineDynamic from "./frames/define-dynamic.mjs";
import * as DefineStatic from "./frames/define-static.mjs";
import * as EmptyDynamicWith from "./frames/empty-dynamic-with.mjs";
import * as EmptyVoid from "./frames/empty-void.mjs";
import * as Enclave from "./frames/enclave.mjs";
import * as Escape from "./frames/escape.mjs";
import * as Illegal from "./frames/illegal.mjs";
import * as ImportStatic from "./frames/import-static.mjs";
import * as Macro from "./frames/macro.mjs";
import * as Observable from "./frames/observable.mjs";

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
export const ESCAPE = "escape";
export const ILLEGAL = "illegal";
export const IMPORT_STATIC = "import-static";
export const MACRO = "macro";
export const OBSERVABLE = "observable";

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
  [ESCAPE]: Escape,
  [ILLEGAL]: Illegal,
  [IMPORT_STATIC]: ImportStatic,
  [MACRO]: Macro,
  [OBSERVABLE]: Observable,
};

////////////
// Create //
////////////

export const createFrame = (type, layer, options) => {
  const { createFrame: createFrameInner } = libraries[type];
  return {
    type,
    layer,
    inner: createFrameInner(options),
  };
};

/////////////
// Harvest //
/////////////

const generateHarvest = (name) => (frame) => {
  const { [name]: harvestFrameInner } = libraries[frame.type];
  return harvestFrameInner(frame.inner);
};

export const harvestFrameHeader = generateHarvest("harvestFrameHeader");

export const harvestFramePrelude = generateHarvest("harvestFramePrelude");

/////////////
// Declare //
/////////////

export const declareFrame = (strict, frame, kind, variable, options) => {
  const { declareFrame: declareFrameInner } = libraries[frame.type];
  if (frame.layer === getVariableLayer(variable)) {
    return declareFrameInner(strict, frame.inner, kind, variable, options);
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
  variable,
  expression,
) => {
  const {
    makeFrameInitializeStatementArray: makeFrameInnerInitializeStatementArray,
  } = libraries[frame.type];
  if (frame.layer === getVariableLayer(variable)) {
    return makeFrameInnerInitializeStatementArray(
      strict,
      frame.inner,
      kind,
      variable,
      expression,
    );
  } else {
    return null;
  }
};

///////////////
// LookupAll //
///////////////

export const lookupFrameAll = (strict, escaped, frame) => {
  const { lookupFrameAll: lookupFrameInnerAll } = libraries[frame.type];
  lookupFrameInnerAll(strict, escaped, frame.inner);
};

////////////
// Lookup //
////////////

const generateLookup =
  (name) => (next, strict, frame, scope, escaped, variable, options) => {
    if (frame.layer === getVariableLayer(variable)) {
      const { [name]: makeFrameInnerLookupNode } = libraries[frame.type];
      return makeFrameInnerLookupNode(
        next,
        strict,
        frame.inner,
        scope,
        escaped,
        variable,
        options,
      );
    } else {
      return next(strict, scope, escaped, variable, options);
    }
  };

export const makeFrameReadExpression = generateLookup(
  "makeFrameReadExpression",
);

export const makeFrameTypeofExpression = generateLookup(
  "makeFrameTypeofExpression",
);

export const makeFrameDiscardExpression = generateLookup(
  "makeFrameDiscardExpression",
);

export const makeFrameWriteEffect = generateLookup("makeFrameWriteEffect");
