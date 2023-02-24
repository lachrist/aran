import { map } from "array-lite";
import {
  createCounter,
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

export const createInitialContext = () => ({
  visitors: {},
  counter: createCounter(0),
  nodes: [],
  evals: {},
  strict: false,
  scope: ROOT_SCOPE,
});

export const saveContext = (context, serial) => {
  assert(!hasOwn(context.evals), serial, "duplicate eval scope");
  defineProperty(context.evals, serial, {
    __proto__: NULL_DATA_DESCRIPTOR,
    value: {
      strict: context.strict,
      scope: packScope(context.scope),
    },
  });
};

export const loadContext = (context, serial) => {
  assert(hasOwn(context.evals, serial), "missing eval scope");
  const { strict, scope } = context.evals[serial];
  return {
    ...context,
    strict,
    scope: unpackScope(scope),
  };
};

const serializeContextNode = (context, node) => {
  const serial = context.nodes.length;
  context.nodes[serial] = node;
  return serial;
};

export const visit = (key, node, context, site) =>
  annotateNode(
    dispatchObjectNode2(context.visitors[key], node, context, site),
    serializeContextNode(context, node),
  );

export const visitMany = (key, node, context, site) =>
  map(
    dispatchObjectNode2(context.visitors[key], node, context, site),
    partial_x(annotateNode, serializeContextNode(context, node)),
  );
