import { AranTypeError } from "../../error.mjs";
import { hasOwn } from "../../util/index.mjs";
import { splitMeta } from "../mangle.mjs";
import {
  DYNAMIC,
  listDynamicSaveEffect,
  makeDynamicLoadExpresssion,
} from "./dynamic/index.mjs";
import {
  CLOSURE,
  listClosureSaveEffect,
  makeClosureLoadExpression,
} from "./closure/index.mjs";
import { PRIVATE } from "./private/index.mjs";
import {
  ROOT,
  getRootMode,
  listRootSaveEffect,
  makeRootLoadExpression,
} from "./root/index.mjs";
import {
  STATIC,
  listStaticSaveEffect,
  makeStaticLoadExpresssion,
} from "./static/index.mjs";
import { MODE, getModeMode } from "./mode/index.mjs";

/////////////////////
// frame predicate //
/////////////////////

/**
 * @type {(
 *   frame: import(".").Frame,
 * ) => frame is import("./mode").ModeFrame}
 */
const isModeFrame = (frame) => hasOwn(MODE, frame.type);

/**
 * @type {(
 *   frame: import(".").Frame,
 * ) => frame is import("./dynamic").DynamicFrame}
 */
const isDynamicFrame = (frame) => hasOwn(DYNAMIC, frame.type);

/**
 * @type {(
 *   frame: import(".").Frame,
 * ) => frame is import("./closure").ClosureFrame}
 */
const isClosureFrame = (frame) => hasOwn(CLOSURE, frame.type);

/**
 * @type {(
 *   frame: import(".").Frame,
 * ) => frame is import("./private").PrivateFrame}
 */
const isPrivateFrame = (frame) => hasOwn(PRIVATE, frame.type);

/**
 * @type {(
 *   frame: import(".").Frame,
 * ) => frame is import("./root").RootFrame}
 */
const isRootFrame = (frame) => hasOwn(ROOT, frame.type);

/**
 * @type {(
 *   frame: import(".").Frame,
 * ) => frame is import("./static").StaticFrame}
 */
const isStaticFrame = (frame) => hasOwn(STATIC, frame.type);

/////////////////////
// scope predicate //
/////////////////////

/**
 * @type {(
 *   scope: import(".").Scope,
 * ) => scope is import(".").ModeScope}
 */
const isModeScope = (scope) => isModeFrame(scope.frame);

/**
 * @type {(
 *   scope: import(".").Scope,
 * ) => scope is import(".").DynamicScope}
 */
const isDynamicScope = (scope) => isDynamicFrame(scope.frame);

/**
 * @type {(
 *   scope: import(".").Scope,
 * ) => scope is import(".").ParamScope}
 */
const isClosureScope = (scope) => isClosureFrame(scope.frame);

/**
 * @type {(
 *   scope: import(".").Scope,
 * ) => scope is import(".").PrivateScope}
 */
const isPrivateScope = (scope) => isPrivateFrame(scope.frame);

/**
 * @type {(
 *   scope: import(".").Scope,
 * ) => scope is import(".").RootScope}
 */
const isRootScope = (scope) => isRootFrame(scope.frame);

/**
 * @type {(
 *   scope: import(".").Scope,
 * ) => scope is import(".").StaticScope}
 */
const isStaticScope = (scope) => isStaticFrame(scope.frame);

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
    if (isRootScope(scope)) {
      return getRootMode(scope.frame);
    } else if (isModeScope(scope)) {
      return getModeMode(scope.frame);
    } else {
      // eslint-disable-next-line no-param-reassign
      scope = scope.parent;
    }
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
 *     meta: unbuild.Meta,
 *   },
 *   scope: import(".").Scope,
 *   options: import(".").SaveOperation,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listScopeSaveEffect = ({ path, meta }, scope, operation) => {
  if (isRootScope(scope)) {
    return listRootSaveEffect({ path }, scope.frame, operation);
  } else if (isStaticScope(scope)) {
    const nodes = listStaticSaveEffect({ path }, scope.frame, operation);
    if (nodes === null) {
      return listScopeSaveEffect({ path, meta }, scope.parent, operation);
    } else {
      return nodes;
    }
  } else if (isClosureScope(scope)) {
    const nodes = listClosureSaveEffect({ path, meta }, scope.frame, operation);
    if (nodes === null) {
      return listScopeSaveEffect({ path, meta }, scope.parent, operation);
    } else {
      return nodes;
    }
  } else if (isDynamicScope(scope)) {
    const metas = splitMeta(meta, ["here", "next"]);
    return listDynamicSaveEffect(
      { path, meta: metas.here },
      scope.frame,
      operation,
      listScopeSaveEffect({ path, meta: metas.next }, scope.parent, operation),
    );
  } else if (isPrivateScope(scope) || isModeScope(scope)) {
    return listScopeSaveEffect({ path, meta }, scope.parent, operation);
  } else {
    throw new AranTypeError("invalid frame", scope);
  }
};

//////////
// load //
//////////

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   scope: import(".").Scope,
 *   options: import(".").LoadOperation,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeLoadExpression = ({ path, meta }, scope, operation) => {
  if (isRootScope(scope)) {
    return makeRootLoadExpression({ path }, scope.frame, operation);
  } else if (isStaticScope(scope)) {
    const node = makeStaticLoadExpresssion({ path }, scope.frame, operation);
    if (node === null) {
      return makeScopeLoadExpression({ path, meta }, scope.parent, operation);
    } else {
      return node;
    }
  } else if (isClosureScope(scope)) {
    const node = makeClosureLoadExpression({ path }, scope.frame, operation);
    if (node === null) {
      return makeScopeLoadExpression({ path, meta }, scope.parent, operation);
    } else {
      return node;
    }
  } else if (isDynamicScope(scope)) {
    const metas = splitMeta(meta, ["here", "next"]);
    return makeDynamicLoadExpresssion(
      { path, meta: metas.here },
      scope.frame,
      operation,
      makeScopeLoadExpression(
        { path, meta: metas.next },
        scope.parent,
        operation,
      ),
    );
  } else if (isPrivateScope(scope) || isModeScope(scope)) {
    return makeScopeLoadExpression({ path, meta }, scope.parent, operation);
  } else {
    throw new AranTypeError("invalid scope", scope);
  }
};
