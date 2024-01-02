import {
  getRootMode,
  listRootSaveEffect,
  makeRootLoadExpression,
} from "./root/index.mjs";
import { getModeMode } from "./mode/index.mjs";
import {
  listBlockSaveEffect,
  makeBlockLoadExpression,
} from "./block/index.mjs";
import {
  isClosureFrame,
  listClosureSaveEffect,
  makeClosureLoadExpression,
} from "./closure/index.mjs";
import {
  listPrivateSaveEffect,
  makePrivateLoadExpression,
} from "./private/index.mjs";
import { listEvalSaveEffect, makeEvalLoadExpression } from "./eval/index.mjs";
import { AranTypeError } from "../../error.mjs";
import {
  listExternalSaveEffect,
  makeExternalLoadExpression,
} from "./external/index.mjs";
import { listFakeSaveEffect, makeFakeLookupExpression } from "./fake/index.mjs";
import {
  listGlobalObjectSaveEffect,
  makeGlobalObjectLoadExpression,
} from "./global-object/index.mjs";
import {
  listGlobalRecordSaveEffect,
  makeGlobalRecordLoadExpression,
} from "./global-record/index.mjs";
import {
  listTemplateSaveEffect,
  makeTemplateLoadExpression,
} from "./template/index.mjs";
import { listWithSaveEffect, makeWithLoadExpression } from "./with/index.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";

export { setupBlockFrame } from "./block/index.mjs";
export { setupClosureFrame } from "./closure/index.mjs";
export { setupEvalFrame } from "./eval/index.mjs";
export { setupFakeFrame } from "./fake/index.mjs";
export { setupGlobalObjectFrame } from "./global-object/index.mjs";
export { setupGlobalRecordFrame } from "./global-record/index.mjs";
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
      return getRootMode(scope.frame);
    }
    if (scope.frame.type === "mode-use-strict") {
      return getModeMode(scope.frame);
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
 *   site: {
 *     path: unbuild.Path,
 *     meta: import("../meta").Meta,
 *   },
 *   scope: import(".").Scope,
 *   options: import(".").SaveOperation,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listScopeSaveEffect = ({ path, meta }, scope, operation) => {
  if (scope.parent === null) {
    return listRootSaveEffect({ path }, scope.frame, operation);
  } else {
    const { frame } = scope;
    if (frame.type === "block") {
      if (isVariableSaveOperation(operation)) {
        const nodes = listBlockSaveEffect({ path }, frame, operation);
        if (nodes !== null) {
          return nodes;
        }
      }
      return listScopeSaveEffect({ path, meta }, scope.parent, operation);
    } else if (isClosureFrame(frame)) {
      if (isClosureSaveOperation(operation)) {
        const nodes = listClosureSaveEffect({ path, meta }, frame, operation);
        if (nodes !== null) {
          return nodes;
        }
      }
      return listScopeSaveEffect({ path, meta }, scope.parent, operation);
    } else if (frame.type === "eval") {
      const alternate = listScopeSaveEffect(
        { path, meta },
        scope.parent,
        operation,
      );
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
      return listScopeSaveEffect({ path, meta }, scope.parent, operation);
    } else if (frame.type === "fake") {
      if (isVariableSaveOperation(operation)) {
        const nodes = listFakeSaveEffect({ path }, frame, operation);
        if (nodes !== null) {
          return nodes;
        }
      }
      return listScopeSaveEffect({ path, meta }, scope.parent, operation);
    } else if (frame.type === "global-object") {
      const alternate = listScopeSaveEffect(
        { path, meta },
        scope.parent,
        operation,
      );
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
      const alternate = listScopeSaveEffect(
        { path, meta },
        scope.parent,
        operation,
      );
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
      return listScopeSaveEffect({ path, meta }, scope.parent, operation);
    } else if (frame.type === "private") {
      if (isPrivateSaveOperation(operation)) {
        const nodes = listPrivateSaveEffect({ path }, frame, operation);
        if (nodes !== null) {
          return nodes;
        }
      }
      return listScopeSaveEffect({ path, meta }, scope.parent, operation);
    } else if (frame.type === "template") {
      if (isTemplateSaveOperation(operation)) {
        return listTemplateSaveEffect({ path }, frame, operation);
      } else {
        return listScopeSaveEffect({ path, meta }, scope.parent, operation);
      }
    } else if (frame.type === "with") {
      const alternate = listScopeSaveEffect(
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
      throw new AranTypeError("invalid frame", frame);
    }
  }
};

//////////
// load //
//////////

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: import("../meta").Meta,
 *   },
 *   scope: import(".").Scope,
 *   options: import(".").LoadOperation,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeLoadExpression = ({ path, meta }, scope, operation) => {
  if (scope.parent === null) {
    return makeRootLoadExpression({ path }, scope.frame, operation);
  } else {
    const { frame } = scope;
    if (frame.type === "block") {
      if (isVariableLoadOperation(operation)) {
        const node = makeBlockLoadExpression({ path }, frame, operation);
        if (node !== null) {
          return node;
        }
      }
      return makeScopeLoadExpression({ path, meta }, scope.parent, operation);
    } else if (isClosureFrame(frame)) {
      if (isClosureLoadOperation(operation)) {
        const node = makeClosureLoadExpression({ path }, frame, operation);
        if (node !== null) {
          return node;
        }
      }
      return makeScopeLoadExpression({ path, meta }, scope.parent, operation);
    } else if (frame.type === "eval") {
      const alternate = makeScopeLoadExpression(
        { path, meta },
        scope.parent,
        operation,
      );
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
      return makeScopeLoadExpression({ path, meta }, scope.parent, operation);
    } else if (frame.type === "fake") {
      if (isVariableLoadOperation(operation)) {
        const node = makeFakeLookupExpression({ path }, frame, operation);
        if (node !== null) {
          return node;
        }
      }
      return makeScopeLoadExpression({ path, meta }, scope.parent, operation);
    } else if (frame.type === "global-object") {
      const alternate = makeScopeLoadExpression(
        { path, meta },
        scope.parent,
        operation,
      );
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
      const alternate = makeScopeLoadExpression(
        { path, meta },
        scope.parent,
        operation,
      );
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
      return makeScopeLoadExpression({ path, meta }, scope.parent, operation);
    } else if (frame.type === "private") {
      if (isPrivateLoadOperation(operation)) {
        const node = makePrivateLoadExpression({ path }, frame, operation);
        if (node !== null) {
          return node;
        }
      }
      return makeScopeLoadExpression({ path, meta }, scope.parent, operation);
    } else if (frame.type === "template") {
      if (isTemplateLoadOperation(operation)) {
        return makeTemplateLoadExpression({ path }, frame, operation);
      } else {
        return makeScopeLoadExpression({ path, meta }, scope.parent, operation);
      }
    } else if (frame.type === "with") {
      const alternate = makeScopeLoadExpression(
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
      throw new AranTypeError("invalid frame", frame);
    }
  }
};
