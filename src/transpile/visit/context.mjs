import { map } from "array-lite";
import {
  hasOwn,
  assert,
  partial_x,
  NULL_DATA_DESCRIPTOR,
} from "../../util/index.mjs";
import { dispatchObjectNode2 } from "../../node.mjs";
import { annotateNode } from "../../ast/index.mjs";
import { ROOT_SCOPE, packScope, unpackScope } from "../scope/index.mjs";

const {
  Reflect: { defineProperty },
} = globalThis;

export const createContext = (visitors, root) => ({
  visitors,
  root,
  strict: false,
  scope: ROOT_SCOPE,
});

export const loadContext = (serial, root, visitors) => {
  const { evals } = root;
  assert(hasOwn(evals, serial), "missing eval scope");
  const { strict, scope } = evals[serial];
  return {
    root,
    strict,
    scope: unpackScope(scope),
    visitors,
  };
};

export const saveContext = ({ root: { evals }, strict, scope }, serial) => {
  assert(!hasOwn(evals), serial, "duplicate eval scope");
  defineProperty(evals, serial, {
    __proto__: NULL_DATA_DESCRIPTOR,
    value: {
      strict,
      scope: packScope(scope),
    },
  });
};

export const setContextScope = (context, scope) => ({ ...context, scope });

export const getContextScope = ({ scope }) => scope;

export const strictifyContext = (context) => ({ ...context, strict: true });

export const isContextStrict = ({ strict }) => strict;

const serializeContextNode = ({ root: { nodes } }, node) => {
  const serial = nodes.length;
  nodes[serial] = node;
  return serial;
};

// For testing only //
export const visit = (key, node, context, site) =>
  annotateNode(
    dispatchObjectNode2(context.visitors[key], node, context, site),
    serializeContextNode(context, node),
  );

// For testing only //
export const visitMultiple = (key, node, context, site) =>
  map(
    dispatchObjectNode2(context.visitors[key], node, context, site),
    partial_x(annotateNode, serializeContextNode(context, node)),
  );
