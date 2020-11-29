"use strict";

// type Completion = Either ClosureCompletion ProgramCompletion
// type ClosureCompletion = ClosureKind
// type ProgramCompletion = Maybe (IsLast, Box, [Label])
// type IsLast = Boolean

const ArrayLite = require("array-lite");

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

exports._anticipate = (completion, valuation, _is_last) => (
  (
    completion.is_empty ||
    valuation === false) ?
  completion :
  (
    _is_last = (
      valuation === true ?
      false :
      ArrayLite.includes(completion.labels, valuation)),
    (
      completion.is_last === _is_last ?
      completion :
      {
        __proto__: null,
        is_empty: false,
        is_last: _is_last,
        labels: completion.labels})));

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
