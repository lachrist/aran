"use strict";

const global_Error = global.Error;
const global_Reflect_apply = global.Reflect.apply;
const global_Map_prototype_set = global.Map.prototype.set;

// type Session = Maybe (State, Serial)
// type State = (Nodes, Serials, Evals)
// type Serial = Maybe Integer
// type Nodes = [Node]
// type Serials = WeakMap AranNode Serial
// type Evals = Map Serial [normalize.scope.core.Frame]

let session = null;

// type Callback = () => Result
// type Result = *
exports._run_session = (state, callback) => {
  if (session !== null) {
    throw new global_Error("Another script is already being normalized (two scripts cannot be normalized concurrently).");
  }
  session = {serial:null, state};
  const result = callback();
  session = null;
  return result;
};

// type Callback = () => Result
// type Result = *
exports._visit = (estree_node, callback, arg0, arg1, arg2) => {
  if (session.state.nodes[session.state.nodes.length - 1] === estree_node) {
    return callback(arg0, arg1, arg2);
  }
  const serial = session.serial;
  session.serial = session.state.nodes.length;
  session.state.nodes[session.state.nodes.length] = estree_node;
  const result = callback(arg0, arg1, arg2);
  session.serial = serial;
  return result;
};

exports._register_node = (aran_node) => {
  global_Reflect_apply(global_Map_prototype_set, session.state.serials, [aran_node, session.serial]);
  return aran_node;
};

exports._register_scope = (any) => {
  session.state.scopes[session.serial] = any;
};
