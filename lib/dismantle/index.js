
const ArrayLite = require("array-lite");
const Visit = require("./visit");

const Error = global.Error;
const Array_isArray = Array.isArray;
const Object_getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const Object_defineProperty = Object.defineProperty;

module.exports = (root, scope, nodes) => {
  const descriptor = Object_getOwnPropertyDescriptor(global, "ARAN")
  if (descriptor && !descriptor.configurable)
    throw new Error("ARAN must be a configurable property of the global object");
  scope = typeof scope === "number" ? JSON.parse(nodes[scope].AranScope) : scope;
  Object_defineProperty(global, "ARAN", {
    configurable: true,
    value: {
      nodes,
      root,
      node: Array_isArray(scope) ? null : scope
    }
  });
  const result = Visit.PROGRAM(root, scope);
  if (descriptor)
    Object_defineProperty(global, "ARAN", descriptor);
  else
    delete global.ARAN;
  return result;
};
