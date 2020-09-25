"use strict";

// type Completion = Either ClosureCompletion ProgramCompletion
// type ClosureCompletion = ClosureKind
// type ProgramCompletion = Maybe (IsLast, Box, [Label])
// type IsLast = Boolean

const Query = require("./query/index.js");
const ArrayLite = require("array-lite");

const global_Error = global.Error;

const EMPTY_PROGRAM_COMPLETION = 0;
const FUNCTION_COMPLETION = 1;
const CONSTRUCTOR_COMPLETION = 2;
const DERIVED_CONSTRUCTOR_COMPLETION = 3;
const METHOD_COMPLETION = 4;
const ARROW_COMPLETION = 5;
const ACCESSOR_COMPLETION = 6;

exports._function = FUNCTION_COMPLETION;
exports._constructor = CONSTRUCTOR_COMPLETION;
exports._derived_constructor = DERIVED_CONSTRUCTOR_COMPLETION;
exports._arrow = ARROW_COMPLETION;
exports._method = METHOD_COMPLETION;
exports._accessor = ACCESSOR_COMPLETION;

exports._make_program = (nullable_box) => (
  nullable_box === null ?
  EMPTY_PROGRAM_COMPLETION :
  {
    __proto__: null,
    is_last: true,
    box: nullable_box,
    labels: []});

exports._is_last = (completion) => (
  typeof completion !== "number" &&
  completion.is_last);

exports._get_box = (completion) => {
  if (typeof completion === "number") {
    throw new global_Error("Cannot get the box of a non full program completion");
  }
  return completion.box;
};

const set_last = (completion, is_last) => (
  (completion.is_last === is_last) ?
  completion :
  {
    __proto__: null,
    is_last,
    box: completion.box,
    labels: completion.labels});

exports._extend = (completion, statements, offset) => {
  if (offset >= statements.length || offset < 0) {
    throw new global_Error("Out-of-range offset");
  }
  if (typeof completion === "number") {
    return completion;
  }
  if (Query._get_valuation(statements[offset]) !== true) {
    return EMPTY_PROGRAM_COMPLETION;
  }
  for (let index = offset + 1; index < statements.length; index++) {
    const valuation = Query._get_valuation(statements[index]);
    if (valuation === true) {
      return set_last(completion, false);
    }
    if (valuation !== false) {
      // console.assert(valuation === null || typeof valuation === "string");
      return set_last(completion, ArrayLite.has(completion.labels, valuation));
    }
  }
  return completion;
};

exports._register_label = (completion, label) => (
  (typeof completion === "number") ?
  completion :
  {
    __proto__: null,
    is_last: completion.is_last,
    box: completion.box,
    labels: (
      completion.is_last ?
      ArrayLite.add(completion.labels, label) :
      ArrayLite.delete(completion.labels, label))});
