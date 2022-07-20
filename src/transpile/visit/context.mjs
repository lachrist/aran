import {
  hasOwnProperty,
  assert,
  NULL_DATA_DESCRIPTOR,
} from "../../util/index.mjs";

import {ROOT_SCOPE, packScope, unpackScope} from "../scope/index.mjs";

const {
  Reflect: {defineProperty},
} = globalThis;

const TYPE = null;

export const applyVisitor = (visitors, node, serial, context) => {
  assert(hasOwnProperty(visitors, node.type), `missing ${node.type} visitor`);
  const visitSerial = visitors[node.type];
  return visitSerial(node, serial, context);
};

const serialize = (nodes, node) => {
  const serial = nodes.length;
  nodes[serial] = node;
  return serial;
};

export const visit0 = (visitSerial, node, {root, strict, scope}) =>
  visitSerial(node, serialize(root.nodes, node), {
    type: TYPE,
    root,
    strict,
    scope,
  });

export const visit1 = (
  visitSerial,
  node,
  {root, strict, scope},
  type,
  key1,
  value1,
) =>
  visitSerial(node, serialize(root.nodes, node), {
    type,
    root,
    strict,
    scope,
    [key1]: value1,
  });

export const visit2 = (
  visitSerial,
  node,
  {root, strict, scope},
  type,
  key1,
  value1,
  key2,
  value2,
) =>
  visitSerial(node, serialize(root.nodes, node), {
    type,
    root,
    strict,
    scope,
    [key1]: value1,
    [key2]: value2,
  });

export const createContext = (root) => ({
  type: TYPE,
  root,
  strict: false,
  scope: ROOT_SCOPE,
});

export const loadContext = (root, serial) => {
  const {storage} = root;
  assert(hasOwnProperty(storage, serial), "missing eval scope");
  const {strict, scope} = storage[serial];
  return {
    type: TYPE,
    root,
    strict,
    scope: unpackScope(scope),
  };
};

export const saveContext = ({root: {storage}, strict, scope}, serial) => {
  assert(!hasOwnProperty(storage), serial, "duplicate eval scope");
  defineProperty(storage, serial, {
    __proto__: NULL_DATA_DESCRIPTOR,
    value: {
      strict,
      scope: packScope(scope),
    },
  });
};

export const setContextScope = (context, scope) => ({...context, scope});

export const getContextScoping = ({scope, strict, root: {counter}}) => ({
  scope,
  strict,
  counter,
});

export const strictifyContext = (context) => ({...context, strict: true});

export const isContextStrict = ({strict}) => strict;

export const getContextSubfield = (context, type, key) => {
  assert(context.type === type, "unexpected context type");
  return context[key];
};
