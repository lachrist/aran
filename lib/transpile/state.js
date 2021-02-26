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

const non_enumerable_descriptor = {
  __proto__: null,
  enumerable: false
};

exports.makeVisitor = (type, transpiler) => (scope, node, keys, context) => {
  const serial = session.serial;
  session.serial = session.state.locations.length;
  for (let index = 0; index < keys.length; index++) {
    node = node[keys[index]];
  }
  const annotation = global_Reflect_apply(global_Map_prototype_get, session.annotations, [node]);
  const info = {
    hoisting: annotation.hoisting,
    hasDirectEvalCall: annotation.hasDirectEvalCall,
    hasUseStrictDirective: 
  }
  const location = {
    type: type,
    parent: serial,
    keys: keys,
    node: node,
    eval: annotation.source === null ? null : {
      source: annotation.source,
      scope: scope
    },
    info: info
  };
  global_Reflect_defineProperty(location, "node", non_enumerable_descriptor);
  sessions.state.locations[session.serial] = location;
  const result = transpiler(scope, node, annotation, context);
  session.serial = serial;
  return result;
};

exports.registerNode = (node) => {
  global_Reflect_apply(global_Map_prototype_set, session.state.serials, [node, session.serial]);
  return node;
};


// exports.visit = (node, keys, callback, arg1, arg2) => {
//   const serial = session.serial;
//   session.serial = session.state.locations.length;
//   for (let index = 0; index < keys.length; index++) {
//     node = node[keys[index]];
//   }
//   const annotation = global_Reflect_apply(global_Map_prototype_get, session.annotations, [node]);
//   const location = {
//     type: type,
//     parent: serial,
//     keys: keys,
//     node: node,
//     annotation: annotation
//   };
//   global_Reflect_defineProperty(location, "node", {
//     __proto__: null,
//     enumerable: false
//   });
//   sessions.state.locations[session.serial] = location;
//   const result = callback(node, annotation, arg1, arg2);
//   session.serial = serial;
//   return result;
// };

exports.post = (node, type, callbacks) => {
  
}


exports.visit = (type, estree_node, keys, callback, arg0, arg1, arg2) => {
  // if (session.state.nodes[session.state.nodes.length - 1] === estree_node) {
  //   return callback(arg0, arg1, arg2);
  // }
  const serial = session.serial;
  session.serial = session.state.nodes.length;
  // session.state.nodes[session.state.nodes.length] = estree_node;
  for (let index = 0; index < keys.length; index++) {
    estree_node = estree_node[keys[index]];
  }
  if (type === "Expression") {
    if (estree_node.type === "CallExpression") {
      if (estree_node.callee.type === "Identifier") {
        if (estree_node.callee.name === "eval") {
          
        }
      }
    }
    
  }
  
  const location = {
    type: type,
    parent: serial,
    keys: keys,
    node: estree_node,
    annotation: null
  };
  //   block: null,
  //   closure: {
  //     strict: boolean,
  //     eval: boolean
  //   },
  //   eval: null
  // };
  global_Reflect_defineProperty(location, "node", {
    __proto__: null,
    enumerable: false
  });
  session.state.locations[session.state.locations.length] = location;
  const result = callback(arg0, arg1, arg2);
  session.serial = serial;
  return result;
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
