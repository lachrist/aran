"use strict";

const ArrayLite = require("array-lite");

exports.Empty = () => ({
  __proto__: null,
  type: "Empty"});

exports.Full = () => ({
  __proto__: null,
  type: "Full",
  last: true,
  labels: []});

exports.isLast = (completion) => (
  completion.type === "Full" &&
  completion.last);

// type Valuation = String | Boolean
exports.anticipateValuation = (completion, valuation, _last) => (
  (
    completion.type === "Empty" ||
    valuation === false) ?
  completion :
  (
    _last = (
      valuation === true ?
      false :
      ArrayLite.includes(completion.labels, valuation)),
    (
      completion.last === _last ?
      completion :
      {
        __proto__: null,
        type: "Full",
        last: _last,
        labels: completion.labels})));

exports.registerLabel = (completion, label) => (
  completion.type === "Empty" ?
  completion :
  {
    __proto__: null,
    type: "Full",
    last: completion.last,
    labels: (
      completion.last ?
      ArrayLite.add(completion.labels, label) :
      ArrayLite.delete(completion.labels, label))});
