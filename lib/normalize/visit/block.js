"use strict";

const global_Error = global.Error;

const ArrayLite = require("array-lite");
const Query = require("../../query");
const Tree = require("../../tree.js");
const Visit = require("./visit.js");

const get_consequent = (node) => node.consequent;

const extend_completion = (completion, nodes, offset) => {
  for (let index = offset + 1; index < nodes.length; index++) {
    const valuation = Query._get_valuation(nodes[index]);
    if (valuation !== false) {
      // console.assert(valuation === null || valuation === true || typeof valuation === "string");
      return Completion._anticipate(completion, valuation);
    }
  }
  return completion;
};

const body = (scope, nodes, completion) => 123;

const normal = (scope, nodes, context) => Scope.BLOCK(
  node.type in visitors ?


  Tree.Bundle(
    ArrayLite.map(
      _bindings,
      (binding) => Tree.Lift(
        Scope.write(
          scope,
          binding.identifier,
          Scope.get(scope, binding.box))))),


exports.BLOCK = (scope, node, context) => (
  node.type in visitors ?
  visitors[node.type](scope, node, context) :
  (
    assert(
      context.type === "block",
      `yo`),
    Scope.BLOCK(
      scope,
      context.with,



  normal(scope, nodes, context));


const hoist = (node) => (
  (
    node.type === "FunctionDeclaration" ||
    node.type === "ImportDeclaration") ?
  [node] :
  (
    node.type === "LabeledStatement" ?
    hoist(node.body) :
    (
      (
        (
          node.type === "ExportDefaultDeclaration" ||
          node.type === "ExportNamedDeclaration") &&
        node.declaration !== null &&
        node.declaration.type === "FunctionDeclaration" &&
        node.declaration.id !== null) ?
      [node.declaration] :
      [])));

visitors.Program = (scope, node, context) => 123;

visitors.BlockStatement = (scope, node, context) => ();

visitors.SwitchCase = (scope, node, context) => Scope.CASE(
  scope,
  (scope) => Tree.Bundle(
    ArrayLite.map(
      node.consequent,
      (node, index) => Visit.Statement(
        scope,
        node,
        {
          __proto__: Visit._statement_context,
          visited: false,
          completion: extend_completion(context.completion, context.switch.nodes, context.switch.offset + index)}))));

visitors.SwitchStatement = (scope, node, context, _nodes, _offset) => (
  _nodes = ArrayLite.flatMap(node.cases, get_consequent),
  _offset = 0,
  Scope.BLOCK(
    scope,
    null,
    Query._get_block_hoisting(_nodes),
    (scope) => Tree.Bundle(
      [
        Tree.Bundle(
          ArrayLite.map(
            ArrayLite.flatMap(_nodes, hoist),
            (node) => Visit.Hoisted(scope, node, null))),
        ArrayLite.map(
          node.cases,
          (node) => (
            node.test === null ?
            Tree.Lone(
              [],
              Scope.CASE(
                scope,
                (scope) => Tree.Bundle(
                  ArrayLite.map(
                    node.consequent,
                    (node) => Visit.Statement(
                      scope,
                      node,
                      {
                        __proto__: Visit._statement_context,
                        visited: false,
                        completion: extend_completion(completion, _nodes, _offset++)}))))) :
            Tree.If(
              [],
              123,
              456,
              Scope.CASE(
                scope,
                (scope) => Tree.Bundle([])))))])));



                 Tree.Bundle(
                  ArrayLite.map(
                    node1.cases,
                    (node2) => Visit.Case(
                      scope,
                      node2,
                      {
                        switch: context.switch,
                        callback: (scope) => Tree.Bundle(
                          ArrayLite.map(
                            node2.consequent,
                            (node3) => Visit.Statement(
                              scope,
                              node3,
                              {
                                __proto__: Visit._statement_context,
                                visited: false,
                                completion: extend_completion(completion, _nodes, _offset++)})))})))




visit.BLOCK = (scope, node, context) => context.callback(
  scope,
  node,
  (scope) => (
    context = global_Object_assign(
      {
        completion: Completion._make_empty(),
        case: null},
      context),
    _nodes = (
      (
        node.type === "BlockStatement" ||
        node.type === "Program") ?
      node.body :
      (
        node.type === "SwitchStatement" ?
        ArrayLite.flatMap(node1.cases, get_consequent) :
        [node])),
    Tree.Bundle(
      [
        Tree.Bundle(
          ArrayLite.map(
            ArrayLite.flatMap(_nodes, hoist),
            (node) => Visit.Hoisted(scope, node, null))),
        (
          node.type === "SwitchStatement" ?
          (
            _offset = 0,
            Tree.Bundle(
              ArrayLite.map(
                node.cases,
                (node) => context.case(
                  scope,
                  node,
                  (scope) => Tree.Bundle(
                    ArrayLite.map(
                      node.consequent,
                      (node) => Visit.Statement(
                        scope,
                        node,
                        {
                          completion: extend_completion(completion, _nodes, _offset++)}))))))) :
            Tree.Bundle(
              ArrayLite.map(
                _nodes,
                (node, index) => Statement.Visit(
                  scope,
                  node,
                  {
                    completion: extend_completion(completion, _nodes, index)}))))]));

visit.BLOCK = (scope, node, context, _nodes, _offset) => (
  context = global_Object_assign(
    {
      type: "BLOCK",
      value: {
        with: null}
      completion},
    context),
  (
    context.type === "CLOSURE_BODY" ?
    (
      assert(
        node.type === "BlockStatement",
        `Invalid node for closure body`)
      Scope.CLOSURE_BODY(
        scope,
        (
          !Scope._is_strict(scope) &&
          Query._has_direct_eval_call(node.body)),
        Query._get_closure_hoisting(node.body),
        (scope) => body(
          scope,
          node.body,
          Completion._make_empty())) :
      (
        context.type === "BLOCK" ?
        Scope.BLOCK(
          scope,
          context.with,
          Query._get_block_hoisting(_nodes),
          (scope) => body(
            scope,
            _nodes,
            context.completion)) :
        Scope[context.type](
          scope,
        context.



        ()
        _nodes = (
          (
            node.type === "BlockStatement" ||
            node.type === "Program") ?
          node.body :
          (
            node.type === "SwitchStatement" ?
            ArrayLite.flatMap(node.cases, get_consequent) :
            [node])),

  Scope.BLOCK(
    scope,
    context.with,
    (
      node.closure ?
      Query._get_closure_hoisting(_nodes) :
      Query._get_block_hoisting(_nodes))


  Scope.BLOCK(
  scope,
  (
    context.closure ?
    Query._get_
    node.type === "SwitchStatement" ?
    Query._get_block_hoisting(
      ArrayLite.flatMap(node.cases, get_consequent)) :
    context.closure ?
    (

Visit.Body = (scope, node, context, _nodes, _offset) => (
  context = global_Object_assign(
    {
      completion: Completion._make_empty(),
      case: null},
    context),
  _nodes = (
    (
      node.type === "BlockStatement" ||
      node.type === "Program") ?
    node.body :
    (
      node.type === "SwitchStatement" ?
      ArrayLite.flatMap(node1.cases, get_consequent) :
      [node])),
  Tree.Bundle(
    [
      Tree.Bundle(
        ArrayLite.map(
          ArrayLite.flatMap(_nodes, hoist),
          (node) => Visit.Hoisted(scope, node, null))),
      (
        node1.type === "SwitchStatement" ?
        (
          _offset = 0,
          Tree.Bundle(
            ArrayLite.map(
              node.cases,
              (node) => context.case(
                scope,
                node,
                (scope) => Tree.Bundle(
                  ArrayLite.map(
                    node.consequent,
                    (node) => Visit.Statement(
                      scope,
                      node,
                      {
                        completion: extend_completion(completion, _nodes, _offset++)}))))))) :
          Tree.Bundle(
            ArrayLite.map(
              _nodes,
              (node, index) => Statement.Visit(
                scope,
                node,
                {
                  completion: extend_completion(completion, _nodes, index)}))))]));


Visit.BLOCK = (scope, node1, context, _nodes, _offset) => (
  context = global_Object_assign(
    {
      callback: null,
      with: null,
      closure: null,
      switch: null,
      case: false},
    context),
  _nodes = (
    (
      node1.type === "BlockStatement" ||
      node1.type === "Program") ?
    node.body :
    (
      node1.type === "SwitchStatement" ?
      ArrayLite.flatMap(node1.cases, get_consequent) :
      [node1])),
  context.callback(
    scope,
    _nodes,
    (scope) =>
  Tree.Bundle(
    [
      Tree.Bundle(
        ArrayLite.map(
          ArrayLite.flatMap(_nodes, hoist),
          (node2) => Visit.Hoisted(scope, node2, null))),
      (
        node1.type === "SwitchStatement" ?
        (
          _offset = 0,
          Tree.Bundle(
            ArrayLite.map(
              node1.cases,
              (node2) => Visit.Case(
                scope,
                node2,
                {
                  switch: context.switch,
                  callback: (scope) => Tree.Bundle(
                    ArrayLite.map(
                      node2.consequent,
                      (node3) => Visit.Statement(
                        scope,
                        node3,
                        {
                          __proto__: Visit._statement_context,
                          visited: false,
                          completion: extend_completion(completion, _nodes, _offset++)})))})))) :
          Tree.Bundle(
            ArrayLite.map(
              _nodes,
              (node2, index) => Statement.Visit(
                scope,
                node2,
                {
                  __proto__: Statement._default_context,
                  visited: node2 !== node2,
                  completion: extend_completion(completion, _nodes, index)}))))]));




Visit._register(
  "BLOCK",
  {
    __proto__: Visit._context,
    switch: null,
    completion: Completion._make_empty()},
  (scope, node, context, _nodes) => (
    context.switch === null ?
    (
      _visited = (
        node.type !== "BlockStatement" &&
        node.type !== "ProgramStatement")
      _nodes = _visited ? [node] : node.body,
      Tree.Bundle(
        [
          Tree.Bundle(
            ArrayLite.map(
              _nodes,
              (node) => Statement.Visit(
                scope,
                node,
                {
                  __proto__: Statement._hoisted_context,
                  visited: _visited}))),
          Tree.Bundle(
            ArrayLite.map(
                _nodes,
                (node, index) => Statement.Visit(
                  scope,
                  node,
                  {
                    __proto__: Statement._default_context,
                    visited: _visited,
                    completion: extend_completion(completion, _nodes, index)})))])) :


exports._block_context = {
  __proto__: Visit._context,
  switch: null,
  completion: Completion._make_empty()};



exports.Block = (scope, node, context) =>




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
