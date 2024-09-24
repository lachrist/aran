import { listRootSaveEffect, makeRootLoadExpression } from "./root/index.mjs";
import {
  listRegularSaveEffect,
  makeRegularLoadExpression,
} from "./variable-regular/index.mjs";
import {
  listRoutineSaveEffect,
  makeRoutineLoadExpression,
} from "./routine/index.mjs";
import {
  listPrivateSaveEffect,
  makePrivateLoadExpression,
} from "./private/index.mjs";
import {
  listEvalSaveEffect,
  makeEvalLoadExpression,
} from "./variable-eval/index.mjs";
import { AranTypeError } from "../../report.mjs";
import {
  listWithSaveEffect,
  makeWithLoadExpression,
} from "./variable-with/index.mjs";
import {
  listCatchSaveEffect,
  makeCatchLoadExpression,
} from "./catch/index.mjs";
import { prependSequence } from "../../sequence.mjs";
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
import { makeSyntaxErrorPrelude } from "../prelude/index.mjs";
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
  here: frame,
  next: null,
});

/**
 * @type {(
 *   scope: import(".").Scope,
 *   frame: import(".").NodeFrame,
 * ) => import(".").Scope}
 */
export const extendScope = (scope, frame) => ({
  here: frame,
  next: scope,
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
const listSyntaxErrorMessage = (operation) => {
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
    if (scope.next === null) {
      return scope.here.mode;
    }
    if (scope.here.type === "mode-use-strict") {
      return "strict";
    }
    scope = scope.next;
  }
};
/* eslint-enable local/no-impure */

//////////
// save //
//////////

/**
 * @type {import("./operation").ListScopeEffect<
 *   import(".").Scope,
 * >}
 */
const save = (hash, meta, scope, operation) => {
  if (scope.next === null) {
    return listRootSaveEffect(hash, meta, scope.here, operation);
  } else {
    switch (scope.here.type) {
      case "mode-use-strict": {
        return save(hash, meta, scope.next, operation);
      }
      case "regular": {
        return listRegularSaveEffect(
          hash,
          meta,
          scope.here,
          operation,
          save,
          scope.next,
        );
      }
      case "routine": {
        return listRoutineSaveEffect(
          hash,
          meta,
          scope.here,
          operation,
          save,
          scope.next,
        );
      }
      case "private": {
        return listPrivateSaveEffect(
          hash,
          meta,
          scope.here,
          operation,
          save,
          scope.next,
        );
      }
      case "eval": {
        return listEvalSaveEffect(
          hash,
          meta,
          scope.here,
          operation,
          save,
          scope.next,
        );
      }
      case "with": {
        return listWithSaveEffect(
          hash,
          meta,
          scope.here,
          operation,
          save,
          scope.next,
        );
      }
      case "illegal": {
        return listIllegalSaveEffect(
          hash,
          meta,
          scope.here,
          operation,
          save,
          scope.next,
        );
      }
      case "fake": {
        return listFakeSaveEffect(
          hash,
          meta,
          scope.here,
          operation,
          save,
          scope.next,
        );
      }
      case "catch": {
        return listCatchSaveEffect(
          hash,
          meta,
          scope.here,
          operation,
          save,
          scope.next,
        );
      }
      default: {
        throw new AranTypeError(scope.here);
      }
    }
  }
};

/**
 * @type {import("./operation").ListScopeEffect<
 *   import(".").Scope,
 * >}
 */
export const listScopeSaveEffect = (hash, meta, scope, operation) =>
  prependSequence(
    operation.type === "write"
      ? map(listSyntaxErrorMessage(operation), (message) => ({
          type: "syntax-error",
          data: {
            message,
            origin: hash,
          },
        }))
      : EMPTY,
    save(hash, meta, scope, operation),
  );

//////////
// load //
//////////

/**
 * @type {import("./operation").makeScopeExpression<
 *   import(".").Scope,
 * >}
 */
const load = (hash, meta, scope, operation) => {
  if (scope.next === null) {
    return makeRootLoadExpression(hash, meta, scope.here, operation);
  } else {
    switch (scope.here.type) {
      case "mode-use-strict": {
        return load(hash, meta, scope.next, operation);
      }
      case "regular": {
        return makeRegularLoadExpression(
          hash,
          meta,
          scope.here,
          operation,
          load,
          scope.next,
        );
      }
      case "routine": {
        return makeRoutineLoadExpression(
          hash,
          meta,
          scope.here,
          operation,
          load,
          scope.next,
        );
      }
      case "private": {
        return makePrivateLoadExpression(
          hash,
          meta,
          scope.here,
          operation,
          load,
          scope.next,
        );
      }
      case "eval": {
        return makeEvalLoadExpression(
          hash,
          meta,
          scope.here,
          operation,
          load,
          scope.next,
        );
      }
      case "with": {
        return makeWithLoadExpression(
          hash,
          meta,
          scope.here,
          operation,
          load,
          scope.next,
        );
      }
      case "illegal": {
        return makeIllegalLoadExpression(
          hash,
          meta,
          scope.here,
          operation,
          load,
          scope.next,
        );
      }
      case "fake": {
        return makeFakeLookupExpression(
          hash,
          meta,
          scope.here,
          operation,
          load,
          scope.next,
        );
      }
      case "catch": {
        return makeCatchLoadExpression(
          hash,
          meta,
          scope.here,
          operation,
          load,
          scope.next,
        );
      }
      default: {
        throw new AranTypeError(scope.here);
      }
    }
  }
};

/**
 * @type {import("./operation").makeScopeExpression<
 *   import(".").Scope,
 * >}
 */
export const makeScopeLoadExpression = (hash, meta, scope, operation) =>
  prependSequence(
    operation.type === "read" ||
      operation.type === "typeof" ||
      operation.type === "discard"
      ? map(listSyntaxErrorMessage(operation), (message) =>
          makeSyntaxErrorPrelude({ message, origin: hash }),
        )
      : [],
    load(hash, meta, scope, operation),
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
    if (scope.next === null) {
      return [scope.here, ...reverse(nodes)];
    } else {
      nodes[nodes.length] = scope.here;
      scope = scope.next;
    }
  }
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   scope: import(".").PackScope,
 * ) => import(".").Scope}
 */
export const unpackScope = ([root, ...nodes]) =>
  reduce(nodes, extendScope, {
    next: null,
    here: root,
  });
