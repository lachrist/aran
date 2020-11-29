"use strict";

const global_Error = global.Error;

const ArrayLite = require("array-lite");
const Query = require("../../query");
const Completion = require("../../completion.js");
let Statement = null;

exports._resolve_circular_dependencies = (statement_module) => (
  Statement = statement_module,
  void 0);

const extend_completion = (completion, nodes, offset) => {
  if (offset >= nodes.length || offset < 0) {
    throw new global_Error("Out-of-range offset");
  }
  for (let index = offset + 1; index < nodes.length; index++) {
    const valuation = Query._get_valuation(nodes[index]);
    if (valuation === true) {
      return Completion._set_last(completion, false);
    }
    if (valuation !== false) {
      // console.assert(valuation === null || typeof valuation === "string");
      return Completion._set_last(completion, ArrayLite.has(completion.labels, valuation));
    }
  }
  return completion;
};

exports.Body = (scope, nodes, completion) => Tree.Bundle(
  [
    Tree.Bundle(
      ArrayLite.map(
        nodes,
        (node) => Statement.Visit(scope, node, Statement._hoisted_context))),
    Tree.Bundle(
      ArrayLite.map(
          nodes,
          (node, index) => Statement.Visit(
            scope,
            node,
            {
              __proto__: Statement._default_context,
              completion: extend_completion(completion, nodes, index)})))]);

exports.Switch = (scope, nodes, completion, callback, _nodes, _offset) => (
  _nodes = ArrayLite.flatMap(nodes, get_consequent),
  _offset = 0,
  Tree.Bundle(
    [
      Tree.Bundle(
        ArrayLite.map(
          _nodes,
          (node) => Statement.Visit(scope, node, Statement._hoisted_context))),
      Tree.Bundle(
        ArrayLite.map(
          nodes,
          (node) => callback(
            scope,
            node,
            (scope) => Tree.Bundle(
              ArrayLite.map(
                node.consequent,
                (node) => Statement.Visit(
                  scope,
                  node,
                  {
                    __proto__: Statement._default_context,
                    completion: extend_completion(completion, _nodes, _offset++)}))))))]));
