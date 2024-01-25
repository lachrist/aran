import { listRootSaveEffect, makeRootLoadExpression } from "./root/index.mjs";
import {
  listRegularSaveEffect,
  makeRegularLoadExpression,
} from "./variable-regular/index.mjs";
import {
  isClosureFrame,
  listClosureSaveEffect,
  makeClosureLoadExpression,
} from "./closure/index.mjs";
import {
  listPrivateSaveEffect,
  makePrivateLoadExpression,
} from "./private/index.mjs";
import {
  listEvalSaveEffect,
  makeEvalLoadExpression,
} from "./variable-eval/index.mjs";
import { AranTypeError } from "../../error.mjs";
import {
  listFakeSaveEffect,
  makeFakeLookupExpression,
} from "./variable-fake/index.mjs";
import {
  listWithSaveEffect,
  makeWithLoadExpression,
} from "./variable-with/index.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { makeCatchLoadExpression } from "./catch/index.mjs";
import { prependSequence } from "../sequence.mjs";
import { hasNarrowKey, map, reduce, reverse } from "../../util/index.mjs";
import { KEYWORD_RECORD, STRICT_KEYWORD_RECORD } from "../../estree.mjs";
import { makeEarlyErrorPrelude } from "../prelude.mjs";
import {
  listIllegalSaveEffect,
  makeIllegalLoadExpression,
} from "./variable-illegal/index.mjs";

export { setupRootFrame } from "./root/index.mjs";
export {
  setupRegularFrame,
  setupModuleFrame,
} from "./variable-regular/index.mjs";
export { setupClosureFrame } from "./closure/index.mjs";
export { setupEvalFrame } from "./variable-eval/index.mjs";
export { setupFakeFrame } from "./variable-fake/index.mjs";
export { makeIllegalFrame } from "./variable-illegal/index.mjs";
export { setupPrivateFrame } from "./private/index.mjs";

/////////////////////////
// operation predicate //
/////////////////////////

/**
 * @type {(
 *   operation: import(".").LoadOperation,
 * ) => operation is import(".").VariableLoadOperation}
 */
const isVariableLoadOperation = (operation) =>
  operation.type === "read" ||
  operation.type === "typeof" ||
  operation.type === "discard";

/**
 * @type {(
 *   operation: import(".").SaveOperation,
 * ) => operation is import(".").VariableSaveOperation}
 */
const isVariableSaveOperation = (operation) =>
  operation.type === "initialize" ||
  operation.type === "write" ||
  operation.type === "declare";

/**
 * @type {(
 *   operation: import(".").SaveOperation,
 * ) => operation is import(".").ModuleOperation}
 */
const isModuleOperation = (operation) => operation.type === "module";

/**
 * @type {(
 *   operation: import(".").LoadOperation,
 * ) => operation is import(".").ClosureLoadOperation}
 */
const isClosureLoadOperation = (operation) =>
  operation.type === "read-this" ||
  operation.type === "read-new-target" ||
  operation.type === "read-input" ||
  operation.type === "read-error" ||
  operation.type === "get-super" ||
  operation.type === "wrap-result";

/**
 * @type {(
 *   operation: import(".").SaveOperation,
 * ) => operation is import(".").ClosureSaveOperation}
 */
const isClosureSaveOperation = (operation) =>
  operation.type === "set-super" || operation.type === "call-super";

/**
 * @type {(
 *  operation: import(".").LoadOperation,
 * ) => operation is import(".").PrivateLoadOperation}
 */
const isPrivateLoadOperation = (operation) =>
  operation.type === "get-private" || operation.type === "has-private";

/**
 * @type {(
 *   operation: import(".").SaveOperation,
 * ) => operation is import(".").PrivateSaveOperation}
 */
const isPrivateSaveOperation = (operation) =>
  operation.type === "set-private" ||
  operation.type === "define-private" ||
  operation.type === "initialize-private" ||
  operation.type === "register-private-singleton" ||
  operation.type === "register-private-collection";

/**
 * @type {(
 *   operation: import(".").LoadOperation,
 * ) => operation is import(".").CatchLoadOperation}
 */
const isCatchLoadOperation = (operation) => operation.type === "read-error";

////////////
// extend //
////////////

/**
 * @type {(
 *   frame: import("./root").RootFrame,
 * ) => import(".").Scope}
 */
export const makeRootScope = (frame) => ({
  parent: null,
  frame,
});

/**
 * @type {(
 *   scope: import(".").Scope,
 *   frame: import(".").NodeFrame,
 * ) => import(".").Scope}
 */
export const extendScope = (scope, frame) => ({
  parent: scope,
  frame,
});

///////////
// check //
///////////

/**
 * @type {(
 *  operation: import(".").VariableOperation,
 * ) => string[]}
 */
const listEarlyErrorMessage = (operation) => {
  if (hasNarrowKey(KEYWORD_RECORD, operation.variable)) {
    return [`Illegal keyword identifier: ${operation.variable}`];
  }
  if (
    operation.mode === "strict" &&
    hasNarrowKey(STRICT_KEYWORD_RECORD, operation.variable)
  ) {
    return [`Illegal strict keyword identifier: ${operation.variable}`];
  }
  if (
    operation.mode === "strict" &&
    operation.type === "write" &&
    (operation.variable === "eval" || operation.variable === "arguments")
  ) {
    return [`Illegal write to '${operation.variable}' in strict mode`];
  }
  if (
    operation.mode === "strict" &&
    operation.type === "initialize" &&
    (operation.variable === "eval" ||
      (operation.variable === "arguments" && !operation.manufactured))
  ) {
    return [`Illegal declaration of '${operation.variable}' in strict mode`];
  }
  return [];
};

//////////
// mode //
//////////

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   scope: import(".").Scope,
 * ) => "strict" | "sloppy"}
 */
export const getMode = (scope) => {
  while (true) {
    if (scope.parent === null) {
      return scope.frame.sort.mode;
    }
    if (scope.frame.type === "mode-use-strict") {
      return "strict";
    }
    // eslint-disable-next-line no-param-reassign
    scope = scope.parent;
  }
};
/* eslint-enable local/no-impure */

//////////
// save //
//////////

/**
 * @type {(
 *   site: import("../site").LeafSite,
 *   scope: import(".").Scope,
 *   options: import(".").SaveOperation,
 * ) => import("../sequence").EffectSequence}
 */
const save = ({ path, meta }, scope, operation) => {
  if (scope.parent === null) {
    return listRootSaveEffect({ path, meta }, scope.frame, operation);
  } else {
    const { frame } = scope;
    if (frame.type === "catch") {
      return save({ path, meta }, scope.parent, operation);
    } else if (frame.type === "regular") {
      if (isVariableSaveOperation(operation) || isModuleOperation(operation)) {
        const node = listRegularSaveEffect({ path }, frame, operation);
        if (node !== null) {
          return node;
        }
      }
      return save({ path, meta }, scope.parent, operation);
    } else if (isClosureFrame(frame)) {
      if (isClosureSaveOperation(operation)) {
        const node = listClosureSaveEffect({ path, meta }, frame, operation);
        if (node !== null) {
          return node;
        }
      }
      return save({ path, meta }, scope.parent, operation);
    } else if (frame.type === "eval") {
      const alternate = save({ path, meta }, scope.parent, operation);
      if (isVariableSaveOperation(operation)) {
        return listEvalSaveEffect({ path }, frame, operation, alternate);
      } else {
        return alternate;
      }
    } else if (frame.type === "fake") {
      if (isVariableSaveOperation(operation)) {
        const node = listFakeSaveEffect({ path }, frame, operation);
        if (node !== null) {
          return node;
        }
      }
      return save({ path, meta }, scope.parent, operation);
    } else if (frame.type === "mode-use-strict") {
      return save({ path, meta }, scope.parent, operation);
    } else if (frame.type === "private") {
      if (isPrivateSaveOperation(operation)) {
        const node = listPrivateSaveEffect({ path }, frame, operation);
        if (node !== null) {
          return node;
        }
      }
      return save({ path, meta }, scope.parent, operation);
    } else if (frame.type === "with") {
      const alternate = save(
        { path, meta: forkMeta((meta = nextMeta(meta))) },
        scope.parent,
        operation,
      );
      if (isVariableSaveOperation(operation)) {
        return listWithSaveEffect(
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          frame,
          operation,
          alternate,
        );
      } else {
        return alternate;
      }
    } else if (frame.type === "illegal") {
      if (isVariableSaveOperation(operation)) {
        const node = listIllegalSaveEffect({ path }, frame, operation);
        if (node !== null) {
          return node;
        }
      }
      return save({ path, meta }, scope.parent, operation);
    } else {
      throw new AranTypeError(frame);
    }
  }
};

/**
 * @type {(
 *   site: import("../site").LeafSite,
 *   scope: import(".").Scope,
 *   options: import(".").SaveOperation,
 * ) => import("../sequence").EffectSequence}
 */
export const listScopeSaveEffect = ({ path, meta }, scope, operation) =>
  prependSequence(
    operation.type === "write" || operation.type === "initialize"
      ? map(listEarlyErrorMessage(operation), (message) =>
          makeEarlyErrorPrelude({
            guard: null,
            message,
            path,
          }),
        )
      : [],
    save({ path, meta }, scope, operation),
  );

//////////
// load //
//////////

/**
 * @type {(
 *   site: import("../site").LeafSite,
 *   scope: import(".").Scope,
 *   options: import(".").LoadOperation,
 * ) => import("../sequence").ExpressionSequence}
 */
const load = ({ path, meta }, scope, operation) => {
  if (scope.parent === null) {
    return makeRootLoadExpression({ path, meta }, scope.frame, operation);
  } else {
    const { frame } = scope;
    if (frame.type === "catch") {
      if (isCatchLoadOperation(operation)) {
        return makeCatchLoadExpression({ path }, frame, operation);
      } else {
        return load({ path, meta }, scope.parent, operation);
      }
    } else if (frame.type === "regular") {
      if (isVariableLoadOperation(operation)) {
        const node = makeRegularLoadExpression({ path }, frame, operation);
        if (node !== null) {
          return node;
        }
      }
      return load({ path, meta }, scope.parent, operation);
    } else if (isClosureFrame(frame)) {
      if (
        isClosureLoadOperation(operation) ||
        operation.type === "read-import-meta"
      ) {
        const node = makeClosureLoadExpression({ path }, frame, operation);
        if (node !== null) {
          return node;
        }
      }
      return load({ path, meta }, scope.parent, operation);
    } else if (frame.type === "eval") {
      const alternate = load({ path, meta }, scope.parent, operation);
      if (isVariableLoadOperation(operation)) {
        return makeEvalLoadExpression({ path }, frame, operation, alternate);
      } else {
        return alternate;
      }
    } else if (frame.type === "fake") {
      if (isVariableLoadOperation(operation)) {
        const node = makeFakeLookupExpression({ path }, frame, operation);
        if (node !== null) {
          return node;
        }
      }
      return load({ path, meta }, scope.parent, operation);
    } else if (frame.type === "mode-use-strict") {
      return load({ path, meta }, scope.parent, operation);
    } else if (frame.type === "private") {
      if (isPrivateLoadOperation(operation)) {
        const node = makePrivateLoadExpression({ path }, frame, operation);
        if (node !== null) {
          return node;
        }
      }
      return load({ path, meta }, scope.parent, operation);
    } else if (frame.type === "with") {
      const alternate = load(
        { path, meta: forkMeta((meta = nextMeta(meta))) },
        scope.parent,
        operation,
      );
      if (isVariableLoadOperation(operation)) {
        return makeWithLoadExpression(
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          frame,
          operation,
          alternate,
        );
      } else {
        return alternate;
      }
    } else if (frame.type === "illegal") {
      if (isVariableLoadOperation(operation)) {
        const node = makeIllegalLoadExpression({ path }, frame, operation);
        if (node !== null) {
          return node;
        }
      }
      return load({ path, meta }, scope.parent, operation);
    } else {
      throw new AranTypeError(frame);
    }
  }
};

/**
 * @type {(
 *   site: import("../site").LeafSite,
 *   scope: import(".").Scope,
 *   options: import(".").LoadOperation,
 * ) => import("../sequence").ExpressionSequence}
 */
export const makeScopeLoadExpression = ({ path, meta }, scope, operation) =>
  prependSequence(
    operation.type === "read" ||
      operation.type === "typeof" ||
      operation.type === "discard"
      ? map(listEarlyErrorMessage(operation), (message) =>
          makeEarlyErrorPrelude({
            guard: null,
            message,
            path,
          }),
        )
      : [],
    load({ path, meta }, scope, operation),
  );

///////////
// setup //
///////////

/**
 * @type {(
 *   scope: import(".").Scope,
 * ) => import(".").Scope}
 */
export const useStrict = (scope) =>
  extendScope(scope, {
    type: "mode-use-strict",
  });

///////////////
// serialize //
///////////////

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   scope: import(".").Scope,
 * ) => import(".").PackScope}
 */
export const packScope = (scope) => {
  const nodes = [];
  while (true) {
    if (scope.parent === null) {
      return [scope.frame, ...reverse(nodes)];
    } else {
      nodes[nodes.length] = scope.frame;
      scope = scope.parent;
    }
  }
};
/* eslint-disable local/no-impure */

/**
 * @type {(
 *   scope: import(".").PackScope,
 * ) => import(".").Scope}
 */
export const unpackScope = ([root, ...nodes]) =>
  reduce(nodes, extendScope, {
    parent: null,
    frame: root,
  });
