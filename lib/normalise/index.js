
const Visit = require("./visit");

const Error = global.Error;
const JSON_parse = JSON.parse;
const Reflect_getOwnPropertyDescriptor = Reflect.getOwnPropertyDescriptor;
const Reflect_defineProperty = Reflect.defineProperty;

module.exports = (node, serial, nodes) => {
  const descriptor = Reflect_getOwnPropertyDescriptor(global, "ARAN")
  if (descriptor && !descriptor.configurable)
    throw new Error("ARAN must be a configurable property of the global object");
  if (!serial)
    node.AranCounter = 0;
  Reflect_defineProperty(global, "ARAN", {
    configurable: true,
    value: {
      nodes,
      root: serial ? nodes[nodes[serial].AranRootSerial] : node
    }
  });
  const result = Visit.NODE(node, serial && JSON_parse(nodes[serial].AranScope), false);
  if (descriptor)
    Reflect_defineProperty(global, "ARAN", descriptor);
  else
    delete global.ARAN;
  return result;
};
