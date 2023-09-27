import { map, flatMap } from "array-lite";

import { hasOwn, assert } from "../../util/index.mjs";

import {
  makeConditionalEffect,
  makeConditionalExpression,
} from "../../ast/index.mjs";

import {
  initializeBinding,
  listBindingVariable,
  generateBindingDeclareStatement,
  generateBindingInitializeStatement,
  makeBindingLookupNode,
} from "./binding/index.mjs";

import {
  makeWithExistExpression,
  makeWithReadExpression,
  makeWithTypeofExpression,
  makeWithDiscardExpression,
  makeWithWriteEffect,
} from "./with.mjs";

const {
  Error,
  Object: { entries: listEntry, fromEntries: reduceEntry },
} = globalThis;

///////////////
// makeFrame //
///////////////

const isBlockScoped = (kind) =>
  kind === "let" || kind === "const" || kind === "class";

const toExternalKind = (kind) => {
  if (kind === "let" || kind === "class") {
    return "let";
  } else if (kind === "const") {
    return "const";
  } else {
    return "var";
  }
};

const makeBinding = (strict, kind, variable, options) => {
  if (options.kind === "script") {
    if (options.enclave) {
      return {
        type: "external",
        kind: toExternalKind(kind),
      };
    } else {
      if (isBlockScoped(kind)) {
        return {
          type: "hidden",
          initialized: false,
          writable: kind !== "const",
        };
      } else {
        return { type: "global" };
      }
    }
  } else if (options.kind === "eval") {
    if (strict || isBlockScoped(kind)) {
      return {
        type: "regular",
        initialized: false,
        switch: false,
        writable: kind !== "const",
        exports: [],
      };
    } else {
      if (options.enclave) {
        return {
          type: "external",
          kind: "var",
        };
      } else {
        return { type: "global" };
      }
    }
  } else if (options.kind === "module") {
    if (kind === "import") {
      assert(hasOwn(options.import, variable), "missing import variable");
      return {
        type: "import",
        ...options.import[variable],
      };
    } else {
      return {
        type: "regular",
        initialized: false,
        switch: false,
        writable: kind !== "const",
        exports: hasOwn(options.export, variable)
          ? options.export[variable]
          : [],
      };
    }
  } else {
    return {
      type: "regular",
      initialized: false,
      switch: options.kind === "switch",
      writable: kind !== "const",
      exports: [],
    };
  }
};

export const makeFrame = (strict, kinds, options) => ({
  closure: options.kind === "closure",
  root:
    options.type === "script" ||
    options.type === "module" ||
    options.type === "eval"
      ? options.enclave
        ? { type: "external" }
        : { type: "missing", kind: null }
      : null,
  static: reduceEntry(
    map(listEntry(kinds), ({ 0: variable, 1: kind }) => [
      variable,
      makeBinding(strict, kind, variable, options),
    ]),
  ),
  dynamic: options.dynamic,
});

//////////////////////////
// collectFrameVariable //
//////////////////////////

export const listFrameVariable = (strict, { static: bindings }) =>
  flatMap(listEntry(bindings), ({ 0: variable, 1: binding }) =>
    listBindingVariable(strict, variable, binding),
  );

///////////////////////////////
// makeFrameDeclareStatement //
///////////////////////////////

export const generateFrameDeclareStatement = (strict, { static: bindings }) =>
  flatMap(listEntry(bindings), ({ 0: variable, 1: binding }) =>
    generateBindingDeclareStatement(strict, binding, variable),
  );

///////////////////////
// initializeBinding //
///////////////////////

export const initializeFrame = (strict, frame, variable) => ({
  ...frame,
  bindings: {
    ...frame.bindings,
    [variable]: initializeBinding(strict, frame.bindings[variable], variable),
  },
});

///////////////////////////////////////
// makeFrameInitializeStatementArray //
///////////////////////////////////////

export const generateFrameInitializeStatement = (
  strict,
  { static: bindings },
  variable,
  expression,
) =>
  generateBindingInitializeStatement(
    strict,
    bindings[variable],
    variable,
    expression,
  );

/////////////////////////
// makeFrameLookupNode //
/////////////////////////

export const makeFrameLookupNode = (
  strict,
  escaped,
  variable,
  frame,
  next,
  lookup,
) => {
  if (hasOwn(frame.static, variable)) {
    return makeBindingLookupNode(
      strict,
      frame.static[variable],
      variable,
      escaped,
      lookup,
    );
  } else {
    const parent =
      frame.root === null
        ? next(escaped || frame.closure)
        : makeBindingLookupNode(strict, frame.root, variable, escaped, lookup);
    if (frame.with === null || parent === null) {
      return parent;
    } else {
      if (lookup.type === "read") {
        return makeConditionalExpression(
          makeWithExistExpression(frame.pure, variable),
          makeWithReadExpression(strict, frame.pure, variable),
          parent,
        );
      } else if (lookup.type === "typeof") {
        return makeConditionalExpression(
          makeWithExistExpression(frame.pure, variable),
          makeWithTypeofExpression(strict, frame.pure, variable),
          parent,
        );
      } else if (lookup.type === "discard") {
        return makeConditionalExpression(
          makeWithExistExpression(frame.pure, variable),
          makeWithDiscardExpression(strict, frame.pure, variable),
          parent,
        );
      } else if (lookup.type === "write") {
        if (lookup.pure) {
          return makeConditionalEffect(
            makeWithExistExpression(frame.pure, variable),
            makeWithWriteEffect(
              strict,
              frame.pure,
              variable,
              lookup.expression,
            ),
            parent,
          );
        } else {
          return null;
        }
      } else {
        throw new Error("invalid lookup type");
      }
    }
  }
};
