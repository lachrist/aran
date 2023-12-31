import { AranTypeError } from "../../error.mjs";
import { hasOwn } from "../../util/index.mjs";
import {
  listClosureSaveEffect,
  makeClosureLoadExpression,
} from "./closure/index.mjs";
import {
  getRootMode,
  listRootSaveEffect,
  makeRootLoadExpression,
} from "./root/index.mjs";
import { getModeMode } from "./mode/index.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { listBlockSaveEffect } from "./block/index.mjs";

export { setupBlockFrame } from "./block/index.mjs";
export { setupClosureFrame } from "./closure/index.mjs";
export { setupEvalFrame } from "./eval/index.mjs";
export { setupFakeFrame } from "./fake/index.mjs";
export { setupGlobalObjectFrame } from "./global-object/index.mjs";
export { setupGlobalRecordFrame } from "./global-record/index.mjs";
export { setupPrivateFrame } from "./private/index.mjs";
export { setupTemplateFrame } from "./template/index.mjs";

/////////////////////
// frame predicate //
/////////////////////

// /**
//  * @type {(
//  *   frame: import(".").NodeFrame,
//  * ) => frame is import("./mode").ModeFrame}
//  */
// const isModeFrame = (frame) => hasOwn(MODE, frame.type);

// /**
//  * @type {(
//  *   frame: import(".").NodeFrame,
//  * ) => frame is import("./global-record").DynamicFrame}
//  */
// const isDynamicFrame = (frame) => hasOwn(DYNAMIC, frame.type);

// /**
//  * @type {(
//  *   frame: import(".").NodeFrame,
//  * ) => frame is import("./closure").ClosureFrame}
//  */
// const isClosureFrame = (frame) => hasOwn(CLOSURE, frame.type);

// /**
//  * @type {(
//  *   frame: import(".").NodeFrame,
//  * ) => frame is import("./private").PrivateFrame}
//  */
// const isPrivateFrame = (frame) => hasOwn(PRIVATE, frame.type);

// /**
//  * @type {(
//  *   frame: import(".").NodeFrame,
//  * ) => frame is import("./block").StaticFrame}
//  */
// const isStaticFrame = (frame) => hasOwn(STATIC, frame.type);

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
      const nodes =
        operation.type === "write" || operation.type === "initialize"
          ? listBlockSaveEffect({ path }, frame, operation)
          : null;
      if (nodes === null) {
        return listScopeSaveEffect({ path, meta }, scope.parent, operation);
      } else {
        return nodes;
      }
    } else if (
      frame.type === "closure-arrow" ||
      frame.type === "closure-function" ||
      frame.type === "closure-block" ||
      frame.type === "closure-method" ||
      frame.type === "closure-constructor"
    ) {
      const nodes = listClosureSaveEffect({ path, meta }, frame, operation);
      if (nodes === null) {
        return listScopeSaveEffect({ path, meta }, scope.parent, operation);
      } else {
        return nodes;
      }
    } else if (frame) {
      return listDynamicSaveEffect(
        { path, meta: forkMeta((meta = nextMeta(meta))) },
        scope.frame,
        operation,
        listScopeSaveEffect(
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          scope.parent,
          operation,
        ),
      );
    } else if (isPrivateFrame(scope.frame) || isModeFrame(scope.frame)) {
      return listScopeSaveEffect({ path, meta }, scope.parent, operation);
    } else {
      throw new AranTypeError("invalid scope.frame", scope.frame);
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
    if (isStaticFrame(scope.frame)) {
      const node = makeStaticLoadExpresssion({ path }, scope.frame, operation);
      if (node === null) {
        return makeScopeLoadExpression({ path, meta }, scope.parent, operation);
      } else {
        return node;
      }
    } else if (isClosureFrame(scope.frame)) {
      const node = makeClosureLoadExpression({ path }, scope.frame, operation);
      if (node === null) {
        return makeScopeLoadExpression({ path, meta }, scope.parent, operation);
      } else {
        return node;
      }
    } else if (isDynamicFrame(scope.frame)) {
      return makeDynamicLoadExpresssion(
        { path, meta: forkMeta((meta = nextMeta(meta))) },
        scope.frame,
        operation,
        makeScopeLoadExpression(
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          scope.parent,
          operation,
        ),
      );
    } else if (isPrivateFrame(scope.frame) || isModeFrame(scope.frame)) {
      return makeScopeLoadExpression({ path, meta }, scope.parent, operation);
    } else {
      throw new AranTypeError("invalid scope.frame", scope.frame);
    }
  }
};
