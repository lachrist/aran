import {
  expect2,
  inspect1,
  createCounter,
  hasOwn,
  assert,
  NULL_DATA_DESCRIPTOR,
} from "../util/index.mjs";
import { makeEffectStatement } from "../ast/index.mjs";
import { ROOT_SCOPE, packScope, unpackScope } from "./scope/index.mjs";

const {
  Error,
  String,
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

export const resolveVisit = (visitor, node) => {
  const { type } = node;
  if (hasOwn(visitor, type)) {
    return visitor[type];
  } else {
    expect2(
      hasOwn(visitor, "__DEFAULT__"),
      Error,
      "missing %x in %x",
      String,
      type,
      inspect1,
      visitor,
    );
    return visitor.__DEFAULT__;
  }
};

export const visit = (node, context, site) => {
  const { type } = site;
  const { visitors } = context;
  expect2(
    hasOwn(visitors, type),
    Error,
    "missing %x in %x",
    String,
    type,
    inspect1,
    visitors,
  );
  const visitor = visitors[type];
  const annotate = visitor.__ANNOTATE__;
  const inner = resolveVisit(visitor, node);
  return annotate(
    inner(node, context, site),
    serializeContextNode(context, node),
  );
};

export const liftEffect = (kind, effect) =>
  kind === null ? effect : makeEffectStatement(effect);
