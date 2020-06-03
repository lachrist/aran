"use strict";

// type Lexic = Either (IsLast, Completion, Labels) Tag
// type IsLast = Boolean
// type Completion = Container
// type Labels = [Label]
// type Tag = String

const Query = require("./query/index.js");
const ArrayLite = require("array-lite");

const global_Error = global.Error;

const ARROW_TYPE = 1;
const FUNCTION_TYPE = 2;
const FULL_PROGRAM_TYPE = 3;
const EMPTY_PROGRAM_TYPE = 4;

const ARROW_COMPLETION = {
  type: ARROW_TYPE
};

const FUNCTION_COMPLETION = {
  type: FUNCTION_TYPE
};

const EMPTY_PROGRAM_COMPLETION = {
  type: EMPTY_PROGRAM_TYPE
};

exports._make_arrow = () => ARROW_COMPLETION

exports._make_function = () => FUNCTION_COMPLETION

exports._make_program = (nullable_box) => (
  nullable_box === null ?
  EMPTY_PROGRAM_COMPLETION :
  {
    type: FULL_PROGRAM_TYPE,
    is_last: true,
    box: nullable_box,
    labels: []});

exports._is_last = (completion) => (
  completion.type === FULL_PROGRAM_TYPE &&
  completion.is_last);

exports._is_arrow = (completion) => completion.type === ARROW_TYPE;

exports._is_function = (completion) => completion.type === FUNCTION_TYPE;

exports._get_box = (completion) => {
  if (completion.type !== FULL_PROGRAM_TYPE) {
    throw new global_Error("Cannot get the box of a non full program completion");
  }
  return completion.box;
};

const set_last = (completion, is_last) => (
  completion.is_last === is_last ?
  completion :
  {
    type: FULL_PROGRAM_TYPE,
    is_last,
    box: completion.box,
    labels: completion.labels});

exports._extend = (completion, statements, offset) => {
  if (offset >= statements.length || offset < 0) {
    throw new global_Error("Out-of-range offset");
  }
  if (completion.type !== FULL_PROGRAM_TYPE) {
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
  completion.type !== FULL_PROGRAM_TYPE ?
  completion :
  {
    type: FULL_PROGRAM_TYPE,
    is_last: completion.is_last,
    box: completion.box,
    labels: (
      completion.is_last ?
      ArrayLite.add(completion.labels, label) :
      ArrayLite.delete(completion.labels, label))});
