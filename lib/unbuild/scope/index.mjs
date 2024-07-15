import { listRootSaveEffect, makeRootLoadExpression } from "./root/index.mjs";
import {
  listRegularSaveEffect,
  listRegularWriteSloppyFunctionEffect,
  makeRegularLoadExpression,
} from "./variable-regular/index.mjs";
import {
  isRoutineFrame,
  listRoutineSaveEffect,
  makeRoutineLoadExpression,
  willUpdateResult,
} from "./routine/index.mjs";
import {
  listPrivateSaveEffect,
  makePrivateLoadExpression,
} from "./private/index.mjs";
import {
  listEvalSaveEffect,
  makeEvalLoadExpression,
} from "./variable-eval/index.mjs";
import { AranError, AranTypeError } from "../../error.mjs";
import {
  listWithSaveEffect,
  makeWithLoadExpression,
} from "./variable-with/index.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { makeCatchLoadExpression } from "./catch/index.mjs";
import { bindSequence, prependSequence } from "../../sequence.mjs";
import {
  EMPTY,
  hasNarrowKey,
  map,
  reduce,
  reverse,
} from "../../util/index.mjs";
import { KEYWORD_RECORD, STRICT_KEYWORD_RECORD } from "../../estree.mjs";
import {
  listIllegalSaveEffect,
  makeIllegalLoadExpression,
} from "./variable-illegal/index.mjs";
import {
  isVariableSaveOperation,
  isRoutineSaveOperation,
  isPrivateSaveOperation,
  isCatchLoadOperation,
  isVariableLoadOperation,
  isRoutineLoadOperation,
  isPrivateLoadOperation,
  duplicateVariableOperation,
} from "./operation.mjs";
import {
  incorporateEffect,
  incorporateExpression,
  makeErrorPrelude,
} from "../prelude/index.mjs";
import {
  listFakeSaveEffect,
  makeFakeLookupExpression,
} from "./variable-fake/index.mjs";

export { setupRootFrame } from "./root/index.mjs";
export { setupFakeFrame } from "./variable-fake/index.mjs";
export {
  setupRegularFrame,
  setupProgramFrame,
} from "./variable-regular/index.mjs";
export { setupRoutineFrame } from "./routine/index.mjs";
export { setupEvalFrame } from "./variable-eval/index.mjs";
export { makeIllegalFrame } from "./variable-illegal/index.mjs";
export { setupPrivateFrame } from "./private/index.mjs";
export {
  makeCallSuperOperation,
  makeInitializePrivateOperation,
  makeDefinePrivateOperation,
  makeRegisterPrivateCollectionOperation,
  makeHasPrivateOperation,
  makeUpdateResultOperation,
  makeFinalizeResultOperation,
  makeInitializeOperation,
} from "./operation.mjs";
export { CATCH_FRAME } from "./catch/index.mjs";

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
 *  operation: (
 *    | import("./operation").ReadOperation
 *    | import("./operation").WriteOperation
 *    | import("./operation").TypeofOperation
 *    | import("./operation").DiscardOperation
 *  ),
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
  return [];
};

//////////////////////
// willUpdateResult //
//////////////////////

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   site: import("../site").VoidSite,
 *   scope: import(".").Scope,
 * ) => boolean}
 */
export const willScopeUpdateResult = (site, scope) => {
  let current = scope;
  while (current.parent !== null) {
    if (isRoutineFrame(current.frame)) {
      return willUpdateResult(site, current.frame);
    } else {
      current = current.parent;
    }
  }
  throw new AranError("missing routine frame", { site, scope });
};
/* eslint-enable local/no-impure */

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
      return scope.frame.mode;
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
 *   options: import("./operation").SaveOperation,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
const save = ({ path, meta }, scope, operation) => {
  if (scope.parent === null) {
    return listRootSaveEffect({ path, meta }, scope.frame, operation);
  } else {
    const { frame } = scope;
    /* straight */ if (frame.type === "catch") {
      return save({ path, meta }, scope.parent, operation);
    } else if (frame.type === "mode-use-strict") {
      return save({ path, meta }, scope.parent, operation);
    } /* static */ else if (frame.type === "regular") {
      if (
        operation.type === "late-declare" ||
        operation.type === "initialize" ||
        operation.type === "write"
      ) {
        const node = listRegularSaveEffect({ path, meta }, frame, operation);
        if (node !== null) {
          return node;
        }
      }
      if (operation.type === "write-sloppy-function") {
        return listRegularWriteSloppyFunctionEffect(
          { path },
          frame,
          operation,
          (operation) => save({ path, meta }, scope.parent, operation),
        );
      }
      return save({ path, meta }, scope.parent, operation);
    } else if (isRoutineFrame(frame)) {
      if (isRoutineSaveOperation(operation)) {
        const node = listRoutineSaveEffect({ path, meta }, frame, operation);
        if (node !== null) {
          return node;
        }
      }
      return save({ path, meta }, scope.parent, operation);
    } else if (frame.type === "private") {
      if (isPrivateSaveOperation(operation)) {
        const node = listPrivateSaveEffect({ path, meta }, frame, operation);
        if (node !== null) {
          return node;
        }
      }
      return save({ path, meta }, scope.parent, operation);
    } else if (frame.type === "illegal") {
      if (
        isVariableSaveOperation(operation) &&
        operation.type !== "write-sloppy-function"
      ) {
        const node = listIllegalSaveEffect({ path }, frame, operation);
        if (node !== null) {
          return node;
        }
      }
      return save({ path, meta }, scope.parent, operation);
    } /* dynamic */ else if (frame.type === "with") {
      if (
        operation.type === "late-declare" ||
        operation.type === "initialize" ||
        operation.type === "write"
      ) {
        return incorporateEffect(
          bindSequence(
            duplicateVariableOperation(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              operation,
            ),
            ([operation1, operation2]) =>
              bindSequence(
                save(
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  scope.parent,
                  operation2,
                ),
                (alternate) =>
                  listWithSaveEffect(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    frame,
                    operation1,
                    alternate,
                  ),
              ),
          ),
          path,
        );
      } else {
        return save(
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          scope.parent,
          operation,
        );
      }
    } else if (frame.type === "eval") {
      if (isVariableSaveOperation(operation)) {
        return listEvalSaveEffect(
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          frame,
          operation,
          (operation) => save({ path, meta }, scope.parent, operation),
        );
      } else {
        return save({ path, meta }, scope.parent, operation);
      }
    } else if (frame.type === "fake") {
      if (
        isVariableSaveOperation(operation) &&
        operation.type !== "write-sloppy-function"
      ) {
        const node = listFakeSaveEffect(
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          frame,
          operation,
        );
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
 *   options: import("./operation").SaveOperation,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
export const listScopeSaveEffect = ({ path, meta }, scope, operation) =>
  prependSequence(
    operation.type === "write"
      ? map(listEarlyErrorMessage(operation), (message) => ({
          type: "error",
          data: {
            message,
            origin: path,
          },
        }))
      : EMPTY,
    save({ path, meta }, scope, operation),
  );

//////////
// load //
//////////

/**
 * @type {(
 *   site: import("../site").LeafSite,
 *   scope: import(".").Scope,
 *   options: import("./operation").LoadOperation,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
const load = ({ path, meta }, scope, operation) => {
  if (scope.parent === null) {
    return makeRootLoadExpression({ path, meta }, scope.frame, operation);
  } else {
    const { frame } = scope;
    /* straight */ if (frame.type === "catch") {
      if (isCatchLoadOperation(operation)) {
        return makeCatchLoadExpression({ path }, frame, operation);
      } else {
        return load({ path, meta }, scope.parent, operation);
      }
    } else if (frame.type === "mode-use-strict") {
      return load({ path, meta }, scope.parent, operation);
    } /* static */ else if (frame.type === "regular") {
      if (isVariableLoadOperation(operation)) {
        const node = makeRegularLoadExpression({ path }, frame, operation);
        if (node !== null) {
          return node;
        }
      }
      return load({ path, meta }, scope.parent, operation);
    } else if (frame.type === "illegal") {
      if (isVariableLoadOperation(operation)) {
        const node = makeIllegalLoadExpression({ path }, frame, operation);
        if (node !== null) {
          return node;
        }
      }
      return load({ path, meta }, scope.parent, operation);
    } else if (isRoutineFrame(frame)) {
      if (
        isRoutineLoadOperation(operation) ||
        operation.type === "read-import-meta"
      ) {
        const node = makeRoutineLoadExpression(
          { path, meta },
          frame,
          operation,
        );
        if (node !== null) {
          return node;
        }
      }
      return load({ path, meta }, scope.parent, operation);
    } else if (frame.type === "private") {
      if (isPrivateLoadOperation(operation)) {
        const node = makePrivateLoadExpression(
          { path, meta },
          frame,
          operation,
        );
        if (node !== null) {
          return node;
        }
      }
      return load({ path, meta }, scope.parent, operation);
    } /* dynamic */ else if (frame.type === "with") {
      if (isVariableLoadOperation(operation)) {
        return incorporateExpression(
          bindSequence(
            duplicateVariableOperation(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              operation,
            ),
            ([operation1, operation2]) =>
              bindSequence(
                load(
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  scope.parent,
                  operation2,
                ),
                (alternate) =>
                  makeWithLoadExpression(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    frame,
                    operation1,
                    alternate,
                  ),
              ),
          ),
          path,
        );
      } else {
        return load(
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          scope.parent,
          operation,
        );
      }
    } else if (frame.type === "eval") {
      if (isVariableLoadOperation(operation)) {
        return incorporateExpression(
          bindSequence(
            duplicateVariableOperation(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              operation,
            ),
            ([operation1, operation2]) =>
              bindSequence(
                load({ path, meta }, scope.parent, operation2),
                (alternate) =>
                  makeEvalLoadExpression(
                    { path },
                    frame,
                    operation1,
                    alternate,
                  ),
              ),
          ),
          path,
        );
      } else {
        return load({ path, meta }, scope.parent, operation);
      }
    } else if (frame.type === "fake") {
      if (isVariableLoadOperation(operation)) {
        const node = makeFakeLookupExpression({ path }, frame, operation);
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
 *   options: import("./operation").LoadOperation,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
export const makeScopeLoadExpression = ({ path, meta }, scope, operation) =>
  prependSequence(
    operation.type === "read" ||
      operation.type === "typeof" ||
      operation.type === "discard"
      ? map(listEarlyErrorMessage(operation), (message) =>
          makeErrorPrelude({ message, origin: path }),
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
