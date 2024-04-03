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
import { bindSequence, prependSequence } from "../sequence.mjs";
import { hasNarrowKey, map, reduce, reverse } from "../../util/index.mjs";
import { KEYWORD_RECORD, STRICT_KEYWORD_RECORD } from "../../estree.mjs";
import { makeEarlyErrorPrelude } from "../prelude.mjs";
import {
  listIllegalSaveEffect,
  makeIllegalLoadExpression,
} from "./variable-illegal/index.mjs";
import {
  isVariableSaveOperation,
  isModuleOperation,
  isClosureSaveOperation,
  isPrivateSaveOperation,
  isCatchLoadOperation,
  isVariableLoadOperation,
  isClosureLoadOperation,
  isPrivateLoadOperation,
  duplicateVariableOperation,
} from "./operation.mjs";
import {
  incorporatePrefixEffect,
  incorporatePrefixExpression,
} from "../prefix.mjs";
import { makeRegularEarlyError } from "../early-error.mjs";

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
export {
  makeCallSuperOperation,
  makeInitializePrivateOperation,
  makeDefinePrivateOperation,
  makeRegisterPrivateCollectionOperation,
  makeHasPrivateOperation,
  makeWrapResultOperation,
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
 *  operation: import("./operation").VariableOperation,
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
 *   options: import("./operation").SaveOperation,
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.Effect<unbuild.Atom>[],
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
      if (isVariableSaveOperation(operation) || isModuleOperation(operation)) {
        const node = listRegularSaveEffect({ path, meta }, frame, operation);
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
    } else if (frame.type === "fake") {
      if (isVariableSaveOperation(operation)) {
        const node = listFakeSaveEffect({ path }, frame, operation);
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
      if (isVariableSaveOperation(operation)) {
        const node = listIllegalSaveEffect({ path }, frame, operation);
        if (node !== null) {
          return node;
        }
      }
      return save({ path, meta }, scope.parent, operation);
    } /* dynamic */ else if (frame.type === "with") {
      if (isVariableSaveOperation(operation)) {
        return incorporatePrefixEffect(
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
        return incorporatePrefixEffect(
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
                  listEvalSaveEffect({ path }, frame, operation1, alternate),
              ),
          ),
          path,
        );
      } else {
        return save({ path, meta }, scope.parent, operation);
      }
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
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
export const listScopeSaveEffect = ({ path, meta }, scope, operation) =>
  prependSequence(
    operation.type === "write" || operation.type === "initialize"
      ? map(listEarlyErrorMessage(operation), (message) =>
          makeEarlyErrorPrelude(makeRegularEarlyError(message, path)),
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
 *   options: import("./operation").LoadOperation,
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.Expression<unbuild.Atom>,
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
    } else if (isClosureFrame(frame)) {
      if (
        isClosureLoadOperation(operation) ||
        operation.type === "read-import-meta"
      ) {
        const node = makeClosureLoadExpression(
          { path, meta },
          frame,
          operation,
        );
        if (node !== null) {
          return node;
        }
      }
      return load({ path, meta }, scope.parent, operation);
    } else if (frame.type === "fake") {
      if (isVariableLoadOperation(operation)) {
        const node = makeFakeLookupExpression({ path }, frame, operation);
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
        return incorporatePrefixExpression(
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
        return incorporatePrefixExpression(
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
    } /* invalid */ else {
      throw new AranTypeError(frame);
    }
  }
};

/**
 * @type {(
 *   site: import("../site").LeafSite,
 *   scope: import(".").Scope,
 *   options: import("./operation").LoadOperation,
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const makeScopeLoadExpression = ({ path, meta }, scope, operation) =>
  prependSequence(
    operation.type === "read" ||
      operation.type === "typeof" ||
      operation.type === "discard"
      ? map(listEarlyErrorMessage(operation), (message) =>
          makeEarlyErrorPrelude(makeRegularEarlyError(message, path)),
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
