
const Visit = require("./visit");

const WeakMap = global.WeakMap;
const Error = global.Error;
const JSON_parse = JSON.parse;
const Reflect_getOwnPropertyDescriptor = Reflect.getOwnPropertyDescriptor;
const Reflect_defineProperty = Reflect.defineProperty;

const HIDDEN = "__ARAN_NODES__";

module.exports = (node, serial, nodes, scopes) => {
  let scope = null;
  if (typeof serial === "number") {
    if (serial in scopes) {
      scope = Scope.$Parse(scopes[serial]);
    } else {
      throw new global_Error("Given serial number does not corresponds to a direct eval call");
    }
  }
  scope = Scope.$
  
  const descriptor = Reflect_getOwnPropertyDescriptor(global, "ARAN")
  if (descriptor && !descriptor.configurable)
    throw new Error("__ARAN_NODES__ must be a configurable property of the global object");
  // if (!serial)
  //   node.AranCounter = 0;
  Reflect_defineProperty(global, "__ARAN_NODES__", {
    __proto__: null,
    configurable: true,
    value: nodes
  });
  //     __proto__: null,
  //     serials: serials,
  //     nodes,
  //     serial: serial,
  //     root: serial ? nodes[nodes[serial].AranRootSerial] : node
  //   }
  // });
  const result = Visit.NODE(node, serial && JSON_parse(nodes[serial].AranScope), false);
  if (descriptor) {
    Reflect_defineProperty(global, "ARAN", descriptor);
  } else {
    delete global.ARAN;
  }
  return result;
};
