"use strict";

const global_Error = global.Error;
const global_Reflect_apply = global.Reflect.apply;
const global_Map_prototype_set = global.Map.prototype.set;
const global_Reflect_defineProperty = global.Reflect.defineProperty;

// type Session = Maybe (State, Serial)
// type State = (Nodes, Serials, Evals, Counter)
// type Serial = Maybe Integer
// type Nodes = [Node]
// type Serials = WeakMap AranNode Serial
// type Evals = Map Serial [normalize.scope.core.Frame]

let session = null;

// type Callback = () => Result
// type Result = *
exports.runSession = (state, cache, callback) => {
  if (session !== null) {
    throw new global_Error("Another script is already being normalized (two scripts cannot be normalized concurrently).");
  }
  session = {serial:null, cache, state, counter:0};
  try {
    return callback();
  } finally {
    session = null;
  }
};

// type Callback = () => Result
// type Result = *
exports.visit = (estree_node, callback, arg0, arg1, arg2) => {
  if (session.state.nodes[session.state.nodes.length - 1] === estree_node) {
    return callback(arg0, arg1, arg2);
  }
  const serial = session.serial;
  session.serial = session.state.nodes.length;
  session.state.nodes[session.state.nodes.length] = estree_node;
  const counter = session.counter;
  const result = callback(arg0, arg1, arg2);
  if (counter === session.counter) {
    session.state.nodes.length--;
  }
  session.serial = serial;
  return result;
};

exports.registerNode = (aran_node) => {
  session.counter++;
  global_Reflect_apply(global_Map_prototype_set, session.state.serials, [aran_node, session.serial]);
  return aran_node;
};

exports.registerEvalNode = (aran_node, source, scope) => {
  session.counter++;
  global_Reflect_apply(global_Map_prototype_set, session.state.serials, [aran_node, session.serial]);
  global_Reflect_defineProperty(session.state.evals, session.serial, {
    __proto__: null,
    value: {source, scope},
    writable: true,
    enumerable: true,
    configurable: true
  });
  return aran_node;
};

exports.getCache = () => session.cache;

// exports.getHoisting = (node) => Parser.getCacheHoisting(session.cache, node);
// 
// exports.hasDirectEvalCall = (node) => Parser.hasCacheDirectEvalCall(session.cache, node);
// 
// exports.hasUseStrictDirective = (node) => Parser.hasCacheUseStrictDirective(session.cache, node);
// exports.increment = () => session.state.counter++;
