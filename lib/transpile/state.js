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
exports.runSession = (state, callback) => {
  if (session !== null) {
    throw new global_Error("Another script is already being normalized (two scripts cannot be normalized concurrently).");
  }
  session = {serial:null, state, counter:0};
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

exports.registerEval = (any) => {
  session.counter++;
  global_Reflect_defineProperty(session.state.evals, session.serial, {
    __proto__: null,
    value: any,
    writable: true,
    enumerable: true,
    configurable: true
  });
};

exports.increment = () => session.state.counter++;
