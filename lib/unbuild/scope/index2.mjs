import { AranError, AranTypeError } from "../../error.mjs";
import { hasOwn } from "../../util/index.mjs";
import { splitMeta } from "../mangle.mjs";
import {
  DYNAMIC,
  listDynamicSaveEffect,
  makeDynamicLoadExpresssion,
} from "./dynamic/index.mjs";
import { CLOSURE } from "./closure/index.mjs";
import { PRIVATE } from "./private/index.mjs";
import {
  ROOT,
  listRootSaveEffect,
  makeRootLoadExpression,
} from "./root/index.mjs";
import {
  STATIC,
  listStaticSaveEffect,
  makeStaticLoadExpresssion,
} from "./static/index.mjs";

/////////////////////
// frame predicate //
/////////////////////

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
// save //
//////////

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     scope: import(".").Scope,
 *     operation: "write" | "initialize",
 *     variable: estree.Variable,
 *     right: import("../cache").Cache | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listScopeSaveEffect = (
  { path, meta },
  context,
  { scope, operation, variable, right },
) => {
  if (isRootScope(scope)) {
    if (operation === "initialize") {
      throw new AranError("unbound initialization", { variable, path });
    } else {
      return listRootSaveEffect({ path }, context, {
        frame: scope.frame,
        operation,
        variable,
        right,
      });
    }
  } else if (isStaticScope(scope)) {
    const nodes = listStaticSaveEffect({ path }, context, {
      frame: scope.frame,
      operation,
      variable,
      right,
    });
    if (nodes === null) {
      return listScopeSaveEffect({ path, meta }, context, {
        scope: scope.parent,
        operation,
        variable,
        right,
      });
    } else {
      return nodes;
    }
  } else if (isDynamicScope(scope)) {
    if (operation === "initialize") {
      return listScopeSaveEffect({ path, meta }, context, {
        scope: scope.parent,
        operation,
        variable,
        right,
      });
    } else {
      const metas = splitMeta(meta, ["here", "next"]);
      return listDynamicSaveEffect({ path, meta: metas.here }, context, {
        frame: scope.frame,
        operation,
        variable,
        right,
        alternate: listScopeSaveEffect({ path, meta: metas.next }, context, {
          scope: scope.parent,
          operation,
          variable,
          right,
        }),
      });
    }
  } else if (isClosureScope(scope) || isPrivateScope(scope)) {
    return listScopeSaveEffect({ path, meta }, context, {
      scope: scope.parent,
      operation,
      variable,
      right,
    });
  } else {
    throw new AranTypeError("invalid frame", scope);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     scope: import(".").Scope,
 *     operation: "read" | "typeof" | "discard",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeLoadExpression = (
  { path, meta },
  context,
  { scope, operation, variable },
) => {
  if (isRootScope(scope)) {
    return makeRootLoadExpression({ path }, context, {
      frame: scope.frame,
      operation,
      variable,
    });
  } else if (isStaticScope(scope)) {
    const node = makeStaticLoadExpresssion({ path }, context, {
      frame: scope.frame,
      operation,
      variable,
    });
    if (node === null) {
      return makeScopeLoadExpression({ path, meta }, context, {
        scope: scope.parent,
        operation,
        variable,
      });
    } else {
      return node;
    }
  } else if (isDynamicScope(scope)) {
    const metas = splitMeta(meta, ["here", "next"]);
    return makeDynamicLoadExpresssion({ path, meta: metas.here }, context, {
      frame: scope.frame,
      operation,
      variable,
      alternate: makeScopeLoadExpression({ path, meta: metas.next }, context, {
        scope: scope.parent,
        operation,
        variable,
      }),
    });
  } else if (isClosureScope(scope) || isPrivateScope(scope)) {
    return makeScopeLoadExpression({ path, meta }, context, {
      scope: scope.parent,
      operation,
      variable,
    });
  } else {
    throw new AranTypeError("invalid scope", scope);
  }
};
