"use strict";

// type Completion = Either ClosureCompletion ProgramCompletion
// type ClosureCompletion = ClosureKind
// type ProgramCompletion = Maybe (IsLast, Box, [Label])
// type IsLast = Boolean

const Query = require("./query");
const ArrayLite = require("array-lite");

const global_Error = global.Error;

exports._make_empty = () => ({
  __proto__: null,
  is_empty: true});

exports._make_full = () => ({
  __proto__: null,
  is_emty: false,
  is_last: true,
  labels: []});

exports._is_last = (completion) => (
  !completion.is_empty &&
  completion.is_last);

const set_last = (non_empty_completion, is_last) => (
  (non_empty_completion.is_last === is_last) ?
  non_empty_completion :
  {
    __proto__: null,
    is_empty: false,
    is_last: is_last,
    labels: non_empty_completion.labels});

exports._extend = (completion, nodes, offset) => {
  if (offset >= nodes.length || offset < 0) {
    throw new global_Error("Out-of-range offset");
  }
  if (completion.is_empty) {
    return completion;
  }
  for (let index = offset + 1; index < nodes.length; index++) {
    const valuation = Query._get_valuation(nodes[index]);
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

// Ugly but necessary for finally block...
exports._set_not_last = (completion) => (
  completion.is_empty ?
  completion :
  set_last(completion, false));

exports._register_label = (completion, label) => (
  completion.is_empty ?
  completion :
  {
    __proto__: null,
    is_empty: false,
    is_last: completion.is_last,
    labels: (
      completion.is_last ?
      ArrayLite.add(completion.labels, label) :
      ArrayLite.delete(completion.labels, label))});
