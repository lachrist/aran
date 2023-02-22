import {
  hasOwnProperty,
  assert,
  NULL_DATA_DESCRIPTOR,
} from "../../util/index.mjs";

import { ROOT_SCOPE, packScope, unpackScope } from "../scope/index.mjs";

const {
  Reflect: { defineProperty },
} = globalThis;

export const createContext = (root) => ({
  root,
  strict: false,
  scope: ROOT_SCOPE,
  specific: null,
});

export const loadContext = (root, serial) => {
  const { evals } = root;
  assert(hasOwn(evals, serial), "missing eval scope");
  const { strict, scope } = evals[serial];
  return {
    root,
    strict,
    scope: unpackScope(scope),
    specific: null,
  };
};

export const saveContext = ({ root: { storage }, strict, scope }, serial) => {
  assert(!hasOwnProperty(storage), serial, "duplicate eval scope");
  defineProperty(storage, serial, {
    __proto__: NULL_DATA_DESCRIPTOR,
    value: {
      strict,
      scope: packScope(scope),
    },
  });
};

export const setContextScope = (context, scope) => ({ ...context, scope });

export const getContextScoping = ({ scope, strict, root: { counter } }) => ({
  scope,
  strict,
  counter,
});

export const strictifyContext = (context) => ({ ...context, strict: true });

export const isContextStrict = ({ strict }) => strict;

export const serializeContextNode = ({ root: { nodes } }, node) => {
  const serial = nodes.length;
  nodes[serial] = node;
  return serial;
};
