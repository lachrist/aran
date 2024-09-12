import { listRootSaveEffect, makeRootLoadExpression } from "./root/index.mjs";
import {
  listRegularSaveEffect,
  makeRegularLoadExpression,
} from "./variable-regular/index.mjs";
import {
  listRoutineSaveEffect,
  makeRoutineLoadExpression,
  shouldUpdateCompletion as shouldUpdateCompletionInner,
} from "./routine/index.mjs";
import {
  listPrivateSaveEffect,
  makePrivateLoadExpression,
} from "./private/index.mjs";
import {
  listEvalSaveEffect,
  makeEvalLoadExpression,
} from "./variable-eval/index.mjs";
import { AranExecError, AranTypeError } from "../../report.mjs";
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

//////////////////////
// willUpdateResult //
//////////////////////

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   scope: import(".").Scope | null,
 *   path: import("../../path").Path,
 * ) => boolean}
 */
export const shouldUpdateCompletion = (scope, path) => {
  while (scope !== null) {
    if (scope.here.type === "routine") {
      return shouldUpdateCompletionInner(scope.here, path);
    }
    scope = scope.next;
  }
  throw new AranExecError("missing routine frame", { path, scope });
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
const save = (site, scope, operation) => {
  if (scope.next === null) {
    return listRootSaveEffect(site, scope.here, operation);
  } else {
    switch (scope.here.type) {
      case "mode-use-strict": {
        return save(site, scope.next, operation);
      }
      case "regular": {
        return listRegularSaveEffect(
          site,
          scope.here,
          operation,
          save,
          scope.next,
        );
      }
      case "routine": {
        return listRoutineSaveEffect(
          site,
          scope.here,
          operation,
          save,
          scope.next,
        );
      }
      case "private": {
        return listPrivateSaveEffect(
          site,
          scope.here,
          operation,
          save,
          scope.next,
        );
      }
      case "eval": {
        return listEvalSaveEffect(
          site,
          scope.here,
          operation,
          save,
          scope.next,
        );
      }
      case "with": {
        return listWithSaveEffect(
          site,
          scope.here,
          operation,
          save,
          scope.next,
        );
      }
      case "illegal": {
        return listIllegalSaveEffect(
          site,
          scope.here,
          operation,
          save,
          scope.next,
        );
      }
      case "fake": {
        return listFakeSaveEffect(
          site,
          scope.here,
          operation,
          save,
          scope.next,
        );
      }
      case "catch": {
        return listCatchSaveEffect(
          site,
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
export const listScopeSaveEffect = (site, scope, operation) =>
  prependSequence(
    operation.type === "write"
      ? map(listSyntaxErrorMessage(operation), (message) => ({
          type: "syntax-error",
          data: {
            message,
            origin: site.path,
          },
        }))
      : EMPTY,
    save(site, scope, operation),
  );

//////////
// load //
//////////

/**
 * @type {import("./operation").makeScopeExpression<
 *   import(".").Scope,
 * >}
 */
const load = (site, scope, operation) => {
  if (scope.next === null) {
    return makeRootLoadExpression(site, scope.here, operation);
  } else {
    switch (scope.here.type) {
      case "mode-use-strict": {
        return load(site, scope.next, operation);
      }
      case "regular": {
        return makeRegularLoadExpression(
          site,
          scope.here,
          operation,
          load,
          scope.next,
        );
      }
      case "routine": {
        return makeRoutineLoadExpression(
          site,
          scope.here,
          operation,
          load,
          scope.next,
        );
      }
      case "private": {
        return makePrivateLoadExpression(
          site,
          scope.here,
          operation,
          load,
          scope.next,
        );
      }
      case "eval": {
        return makeEvalLoadExpression(
          site,
          scope.here,
          operation,
          load,
          scope.next,
        );
      }
      case "with": {
        return makeWithLoadExpression(
          site,
          scope.here,
          operation,
          load,
          scope.next,
        );
      }
      case "illegal": {
        return makeIllegalLoadExpression(
          site,
          scope.here,
          operation,
          load,
          scope.next,
        );
      }
      case "fake": {
        return makeFakeLookupExpression(
          site,
          scope.here,
          operation,
          load,
          scope.next,
        );
      }
      case "catch": {
        return makeCatchLoadExpression(
          site,
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
export const makeScopeLoadExpression = ({ path, meta }, scope, operation) =>
  prependSequence(
    operation.type === "read" ||
      operation.type === "typeof" ||
      operation.type === "discard"
      ? map(listSyntaxErrorMessage(operation), (message) =>
          makeSyntaxErrorPrelude({ message, origin: path }),
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
