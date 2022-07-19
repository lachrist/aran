import {
  hasOwnProperty,
  assert,
  NULL_DATA_DESCRIPTOR,
} from "../../util/index.mjs";

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

export const createRootContext = (scope, root) => ({
  type: TYPE,
  root,
  strict: false,
  scope,
});

export const setContextEvalScope = ({root: {evals}}, serial, scope) => {
  assert(!hasOwnProperty(evals), serial, "duplicate eval scope");
  defineProperty(evals, serial, {
    __proto__: NULL_DATA_DESCRIPTOR,
    value: scope,
  });
};

export const getContextCounter = ({root: {counter}}) => counter;

export const setContextScope = (context, scope) => ({...context, scope});

export const getContextScope = ({scope}) => scope;

export const strictifyContext = (context) => ({...context, strict: true});

export const isContextStrict = ({strict}) => strict;

export const getContextSubfield = (context, type, key) => {
  assert(context.type === type, "unexpected context type");
  return context[key];
};
