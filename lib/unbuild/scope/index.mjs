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
  updateEvalFrame,
} from "./variable-eval/index.mjs";
import { AranError, AranTypeError } from "../../error.mjs";
import {
  listExternalSaveEffect,
  makeExternalLoadExpression,
  updateExternalFrame,
} from "./variable-external/index.mjs";
import {
  listFakeSaveEffect,
  makeFakeLookupExpression,
} from "./variable-fake/index.mjs";
import {
  listGlobalObjectSaveEffect,
  makeGlobalObjectLoadExpression,
  updateGlobalObjectFrame,
} from "./variable-global-object/index.mjs";
import {
  listGlobalRecordSaveEffect,
  makeGlobalRecordLoadExpression,
} from "./variable-global-record/index.mjs";
import {
  listTemplateSaveEffect,
  makeTemplateLoadExpression,
} from "./template/index.mjs";
import {
  listWithSaveEffect,
  makeWithLoadExpression,
} from "./variable-with/index.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { makeCatchLoadExpression } from "./catch/index.mjs";
import { mapSequence, prependSequence } from "../sequence.mjs";
import { hasOwn, map, reverse } from "../../util/index.mjs";
import { KEYWORD_RECORD, STRICT_KEYWORD_RECORD } from "../../estree.mjs";
import { makeEarlyErrorPrelude } from "../prelude.mjs";

export { setupRegularFrame } from "./variable-regular/index.mjs";
export { setupClosureFrame } from "./closure/index.mjs";
export { setupEvalFrame } from "./variable-eval/index.mjs";
export { setupFakeFrame } from "./variable-fake/index.mjs";
export { setupGlobalObjectFrame } from "./variable-global-object/index.mjs";
export { setupGlobalRecordFrame } from "./variable-global-record/index.mjs";
export { setupExternalFrame } from "./variable-external/index.mjs";
export { setupPrivateFrame } from "./private/index.mjs";
export { setupTemplateFrame } from "./template/index.mjs";

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
  operation.type === "initialize" || operation.type === "write";

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
 * ) => operation is import(".").TemplateLoadOperation}
 */
const isTemplateLoadOperation = (operation) =>
  operation.type === "has-template" || operation.type === "get-template";

/**
 * @type {(
 *   operation: import(".").SaveOperation,
 * ) => operation is import(".").TemplateSaveOperation}
 */
const isTemplateSaveOperation = (operation) =>
  operation.type === "set-template";

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
  if (hasOwn(KEYWORD_RECORD, operation.variable)) {
    return [`Illegal keyword identifier: ${operation.variable}`];
  }
  if (
    operation.mode === "strict" &&
    hasOwn(STRICT_KEYWORD_RECORD, operation.variable)
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
      (operation.variable === "arguments" && operation.kind !== "arguments"))
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
      return scope.frame.context.mode;
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
    return listRootSaveEffect({ path }, scope.frame, operation);
  } else {
    const { frame } = scope;
    if (frame.type === "catch") {
      return save({ path, meta }, scope.parent, operation);
    } else if (frame.type === "regular") {
      if (isVariableSaveOperation(operation)) {
        const nodes = listRegularSaveEffect({ path }, frame, operation);
        if (nodes !== null) {
          return nodes;
        }
      }
      return save({ path, meta }, scope.parent, operation);
    } else if (isClosureFrame(frame)) {
      if (isClosureSaveOperation(operation)) {
        const nodes = listClosureSaveEffect({ path, meta }, frame, operation);
        if (nodes !== null) {
          return nodes;
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
    } else if (frame.type === "external") {
      if (isVariableSaveOperation(operation)) {
        const nodes = listExternalSaveEffect({ path }, frame, operation);
        if (nodes !== null) {
          return nodes;
        }
      }
      return save({ path, meta }, scope.parent, operation);
    } else if (frame.type === "fake") {
      if (isVariableSaveOperation(operation)) {
        const nodes = listFakeSaveEffect({ path }, frame, operation);
        if (nodes !== null) {
          return nodes;
        }
      }
      return save({ path, meta }, scope.parent, operation);
    } else if (frame.type === "global-object") {
      const alternate = save({ path, meta }, scope.parent, operation);
      if (isVariableSaveOperation(operation)) {
        return listGlobalObjectSaveEffect(
          { path },
          frame,
          operation,
          alternate,
        );
      } else {
        return alternate;
      }
    } else if (frame.type === "global-record") {
      const alternate = save({ path, meta }, scope.parent, operation);
      if (isVariableSaveOperation(operation)) {
        return listGlobalRecordSaveEffect(
          { path },
          frame,
          operation,
          alternate,
        );
      } else {
        return alternate;
      }
    } else if (frame.type === "mode-use-strict") {
      return save({ path, meta }, scope.parent, operation);
    } else if (frame.type === "private") {
      if (isPrivateSaveOperation(operation)) {
        const nodes = listPrivateSaveEffect({ path }, frame, operation);
        if (nodes !== null) {
          return nodes;
        }
      }
      return save({ path, meta }, scope.parent, operation);
    } else if (frame.type === "template") {
      if (isTemplateSaveOperation(operation)) {
        return listTemplateSaveEffect({ path }, frame, operation);
      } else {
        return save({ path, meta }, scope.parent, operation);
      }
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
    return makeRootLoadExpression({ path }, scope.frame, operation);
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
      if (isClosureLoadOperation(operation)) {
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
    } else if (frame.type === "external") {
      if (isVariableLoadOperation(operation)) {
        const node = makeExternalLoadExpression({ path }, frame, operation);
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
    } else if (frame.type === "global-object") {
      const alternate = load({ path, meta }, scope.parent, operation);
      if (isVariableLoadOperation(operation)) {
        return makeGlobalObjectLoadExpression(
          { path },
          frame,
          operation,
          alternate,
        );
      } else {
        return alternate;
      }
    } else if (frame.type === "global-record") {
      const alternate = load({ path, meta }, scope.parent, operation);
      if (isVariableLoadOperation(operation)) {
        return makeGlobalRecordLoadExpression(
          { path },
          frame,
          operation,
          alternate,
        );
      } else {
        return alternate;
      }
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
    } else if (frame.type === "template") {
      if (isTemplateLoadOperation(operation)) {
        return makeTemplateLoadExpression({ path }, frame, operation);
      } else {
        return load({ path, meta }, scope.parent, operation);
      }
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

////////////
// update //
////////////

/**
 * @type {(
 *   site: import("../site").VoidSite,
 *   scope: import(".").Scope,
 *   hoisting: import("../query/hoist").LifespanHoist[],
 *   options: { mode: "sloppy" },
 * ) => import("../sequence").Sequence<
 *   import("../prelude").NodePrelude,
 *   import(".").Scope,
 * >}
 */
export const updateScope = (site, scope, hoisting, options) => {
  if (scope.parent === null) {
    throw new AranError("Cannot update root scope");
  } else {
    const { frame } = scope;
    if (frame.type === "eval") {
      return mapSequence(updateEvalFrame(site, frame, hoisting), (frame) => ({
        frame,
        parent: scope.parent,
      }));
    } else if (frame.type === "global-object") {
      return mapSequence(
        updateGlobalObjectFrame(site, frame, hoisting),
        (frame) => ({
          frame,
          parent: scope.parent,
        }),
      );
    } else if (frame.type === "external") {
      return mapSequence(
        updateExternalFrame(site, frame, hoisting, options),
        (frame) => ({
          frame,
          parent: scope.parent,
        }),
      );
    } else {
      return mapSequence(
        updateScope(site, scope.parent, hoisting, options),
        (scope) => ({
          frame,
          parent: scope,
        }),
      );
    }
  }
};

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
  const frames = [];
  while (true) {
    if (scope.parent === null) {
      return {
        context: scope.frame.context,
        frames: reverse(frames),
      };
    } else {
      frames[frames.length] = scope.frame;
      scope = scope.parent;
    }
  }
};
/* eslint-disable local/no-impure */

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   scope: import(".").PackScope,
 * ) => import(".").Scope}
 */
export const unpackScope = ({ context, frames }) => {
  let scope = makeRootScope({
    type: "root",
    context,
  });
  for (const frame of frames) {
    scope = extendScope(scope, frame);
  }
  return scope;
};
/* eslint-disable local/no-impure */
