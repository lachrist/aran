import {
  expect1,
  expect2,
  inspect1,
  inspect3,
  createCounter,
  hasOwn,
  assert,
  SyntaxAranError,
  NULL_DATA_DESCRIPTOR,
} from "../util/index.mjs";
import { makeEffectStatement } from "../ast/index.mjs";
import { ROOT_SCOPE, packScope, unpackScope } from "./scope/index.mjs";

const {
  undefined,
  Error,
  String,
  Reflect: { defineProperty },
} = globalThis;

export const serializeLocation = (node, _type) => {
  if (hasOwn(node, "loc")) {
    const { loc } = node;
    if (loc === null || loc === undefined) {
      return null;
    } else {
      expect1(
        hasOwn(loc, "start"),
        SyntaxAranError,
        "missing loc.start in node %x",
        inspect3,
        node,
      );
      const { start } = loc;
      expect1(
        typeof start === "object" && start !== null,
        SyntaxAranError,
        "loc.start should be an object in node %x",
        inspect3,
        node,
      );
      expect1(
        hasOwn(start, "line"),
        SyntaxAranError,
        "missing loc.start.line in node %x",
        inspect3,
        node,
      );
      expect1(
        hasOwn(start, "column"),
        SyntaxAranError,
        "missing loc.start.column in node %x",
        inspect3,
        node,
      );
      const { line, column } = start;
      expect1(
        typeof line === "number",
        SyntaxAranError,
        "loc.start.line should be a number in node %x",
        inspect3,
        node,
      );
      expect1(
        typeof column === "number",
        SyntaxAranError,
        "loc.start.column should be a number in node %x",
        inspect3,
        node,
      );
      if (hasOwn(loc, "filename")) {
        const { filename } = loc;
        if (filename === null || filename === undefined) {
          return `${String(line)}:${String(column)}`;
        } else {
          expect1(
            typeof filename === "string",
            SyntaxAranError,
            "loc.filename should be a string in node %x",
            inspect3,
            node,
          );
          return `${filename}:${String(line)}:${String(column)}`;
        }
      } else {
        return `${String(line)}:${String(column)}`;
      }
    }
  } else {
    return null;
  }
};

export const createInitialContext = () => ({
  visitors: {},
  counter: createCounter(0),
  serialize: serializeLocation,
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
  const { serialize, visitors } = context;
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
  return annotate(inner(node, context, site), serialize(node, type));
};

export const liftEffect = (kind, effect) =>
  kind === null ? effect : makeEffectStatement(effect);
