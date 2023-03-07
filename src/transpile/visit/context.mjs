import {
  expect2,
  inspect1,
  createCounter,
  hasOwn,
  assert,
  NULL_DATA_DESCRIPTOR,
} from "../../util/index.mjs";
import { makeEffectStatement } from "../../ast/index.mjs";
import { ROOT_SCOPE, packScope, unpackScope } from "../scope/index.mjs";

const {
  undefined,
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

export const CLASS = {
  type: "Class",
  name: undefined,
};

export const CLOSURE = {
  type: "Closure",
  kind: undefined,
  super: null,
  name: undefined,
};

export const UPDATE_EXPRESSION = {
  type: "UpdateExpression",
  operator: undefined,
  prefix: undefined,
};

export const UPDATE_EFFECT = {
  type: "UpdateEffect",
  operator: undefined,
  prefix: undefined,
};

export const ASSIGNMENT_EXPRESSION = {
  type: "AssignmentExpression",
  operator: "=",
  right: undefined,
};

export const ASSIGNMENT_EFFECT = {
  type: "AssignmentEffect",
  operator: "=",
  right: undefined,
};

export const PROGRAM = { type: "Program" };

export const STATEMENT = { type: "Statement" };

export const EFFECT = { type: "Effect" };

export const CALLEE = { type: "Callee" };

export const EXPRESSION_MACRO = {
  type: "ExpressionMacro",
  name: "",
  info: "macro",
};

export const PATTERN = {
  type: "Pattern",
  kind: null,
  right: undefined,
};

export const PATTERN_ELEMENT = {
  type: "PatternElement",
  kind: null,
  iterator: undefined,
};

export const PATTERN_PROPERTY = {
  type: "PatternProperty",
  kind: null,
  keys: null,
  right: undefined,
};

export const KEY_EXPRESSION_MACRO = { ...EXPRESSION_MACRO, info: "key" };

export const EXPRESSION = {
  type: "Expression",
  name: "",
};

export const QUASI = { type: "Quasi" };

export const QUASI_RAW = { type: "QuasiRaw" };

export const DELETE = { type: "Delete" };

export const KEY = { type: "Key" };

export const KEY_MACRO = { type: "KeyMacro" };

export const getKeySite = (computed) => (computed ? EXPRESSION : KEY);

export const getKeyMacroSite = (computed) =>
  computed ? KEY_EXPRESSION_MACRO : KEY_MACRO;
