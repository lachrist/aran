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

export const createContext = (root, visitors) => ({
  root,
  strict: false,
  scope: ROOT_SCOPE,
  specific: null,
  visitors,
});

export const loadContext = (serial, root, visitors) => {
  const { evals } = root;
  assert(hasOwn(evals, serial), "missing eval scope");
  const { strict, scope } = evals[serial];
  return {
    root,
    strict,
    scope: unpackScope(scope),
    specific: null,
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

export const getContextScoping = ({ scope, strict, root: { counter } }) => ({
  scope,
  strict,
  counter,
});

export const strictifyContext = (context) => ({ ...context, strict: true });

export const isContextStrict = ({ strict }) => strict;

const serializeContextNode = ({ root: { nodes } }, node) => {
  const serial = nodes.length;
  nodes[serial] = node;
  return serial;
};

const compileVisitSingle = (key) => (node, context, specific) =>
  annotateNode(
    dispatchObjectNode2(context.visitors[key], node, context, specific),
    serializeContextNode(context, node),
  );

const compileVisitMultiple = (key) => (node, context, specific) =>
  map(
    dispatchObjectNode2(context.visitors[key], node, context, specific),
    partial_x(annotateNode, serializeContextNode(context, node)),
  );

export const visitBlock = compileVisitSingle("Block");

export const visitExpression = compileVisitSingle("Expression");

export const visitStatement = compileVisitMultiple("Statement");
