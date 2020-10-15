"use strict";

// type Completion = Either ClosureCompletion ProgramCompletion
// type ClosureCompletion = ClosureKind
// type ProgramCompletion = Maybe (IsLast, Box, [Label])
// type IsLast = Boolean

const Query = require("./query/index.js");
const ArrayLite = require("array-lite");

const global_Error = global.Error;

exports._make = () => ({
  __proto__: null,
  is_last: true,
  labels: []});

exports._is_last = (nullable_completion) => (
  nullable_completion !== null &&
  nullable_completion.is_last);

const set_last = (completion, is_last) => (
  (completion.is_last === is_last) ?
  completion :
  {
    __proto__: null,
    is_last,
    labels: completion.labels});

exports._extend = (nullable_completion, nodes, offset) => {
  if (offset >= nodes.length || offset < 0) {
    throw new global_Error("Out-of-range offset");
  }
  if (nullable_completion === null) {
    return null;
  }
  for (let index = offset + 1; index < nodes.length; index++) {
    const valuation = Query._get_valuation(nodes[index]);
    if (valuation === true) {
      return set_last(nullable_completion, false);
    }
    if (valuation !== false) {
      // console.assert(valuation === null || typeof valuation === "string");
      return set_last(nullable_completion, ArrayLite.has(nullable_completion.labels, valuation));
    }
  }
  return nullable_completion;
};

// Ugly but necessary for finally block...
exports._set_not_last = (nullable_completion) => (
  nullable_completion === null ?
  null :
  set_last(nullable_completion, false));

exports._register_label = (nullable_completion, label) => (
  (nullable_completion === null) ?
  null :
  {
    __proto__: null,
    is_last: nullable_completion.is_last,
    labels: (
      nullable_completion.is_last ?
      ArrayLite.add(nullable_completion.labels, label) :
      ArrayLite.delete(nullable_completion.labels, label))});
