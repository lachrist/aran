
import {extend} from "./list.mjs";

import {
  useStrict,
  isStrict,
  incrementGlobalCounter,
  restoreGlobalCounter,
  createRoot,
} from "./property.mjs";

import {
  createMetaRoot,
  createMetaBody,
  createBaseRootMiss,
  createBaseRootGlobal,
  createBaseRootEnclave,
  createBaseBodyObject,
  createBaseBodyRecord,
  createBaseBodyClosure,
  createBaseBodyBlock,
  createBaseBodyWith,
} from "./frame.mjs"

import {
  harvest,
  declare,
  initialize,
  lookup,
} from "./fetch.mjs";


generateMakeBlock = (size) => (scope, labels, statements) => {
  const {header, prelude} = harvest(scope, size);
  return makeBlock(labels, header, concat(prelude, statements));
};

const extendAll = () => {

};

/////////////
// Reified //
/////////////

export const createReifiedGlobal = () => reduce(
  [
    createBaseRootMiss(makeGlobalObjectExpression()),
    createBodyObject(makeGlobalObjectExpression()),
    createBodyRecord(makeGlobalRecordExpression()),
    createMetaRoot(makeGlobalCacheExpression()),
  ],
  extend,
  createRoot(),
);

export const

///////////
// Block //
///////////

export const extendBlockScope = (scope, duplicable) => reduce(
  [createBaseBodyBlock(null), createMetaBody(null)],
  extend,
  scope,
);

export const makeBlock = generateMakeBlock(2);

//////////
// With //
//////////

export const extendWithScope = (scope, duplicable) => reduce(
  [
    createBaseBodyWith(duplicable),
    createBaseBodyBlock(null),
    createMetaBody(null),
  ],
  extend,
  scope,
);

export const makeWithBlock = generateMakeBlock(3);
