import { AranError, AranTypeError } from "../../../error.mjs";
import { makeReadCacheExpression } from "../../cache.mjs";
import {
  makeApplyExpression,
  makeEvalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
import {
  listEarlyErrorEffect,
  makeEarlyErrorExpression,
} from "../../early-error.mjs";
import {
  makePrivateParameterExpression,
  makeStraightParameterExpression,
} from "./parameter.mjs";
import {
  createRecord,
  hasOwn,
  listKey,
  listValue,
  map,
  reduceEntry,
} from "../../../util/index.mjs";
import {
  bindSequence,
  flatSequence,
  initSequence,
  prependSequence,
} from "../../sequence.mjs";
import { makeEarlyErrorPrelude, makeHeaderPrelude } from "../../prelude.mjs";
import {
  makeReifyLoadExpression,
  makeReifySaveEffect,
  setupReifyEntry,
} from "./reify.mjs";
import {
  makeAlienLoadExpression,
  makeAlienSaveEffect,
  setupAlienEntry,
} from "./alien.mjs";
import { reportDuplicate } from "../error.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";
import {
  isExternalLocalEvalSort,
  isGlobalEvalSort,
  isModuleSort,
  isScriptSort,
} from "../../../sort.mjs";
import { isHoistDuplicable } from "../../query/index.mjs";

const { undefined } = globalThis;

const PRIVATE_MAPPING = {
  "has-private": /** @type {"has"} */ ("has"),
  "get-private": /** @type {"get"} */ ("get"),
};

///////////
// setup //
///////////

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   hoisting: import("../../query/hoist").DeclareHoist[],
 * ) => estree.Variable[]}
 */
const listDuplicate = (hoisting) => {
  /** @type {Record<estree.Variable, boolean | undefined>}} */
  const record = createRecord();
  /** @type {Record<estree.Variable, null>} */
  const duplicate = createRecord();
  for (const hoist of hoisting) {
    const duplicable1 = record[hoist.variable];
    const duplicable2 = isHoistDuplicable(hoist);
    if (duplicable1 === undefined) {
      record[hoist.variable] = duplicable2;
    } else if (!duplicable1 || !duplicable2) {
      duplicate[hoist.variable] = null;
    }
  }
  return listKey(duplicate);
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   hoisting: import("../../query/hoist").DeclareHoist[],
 *   path: unbuild.Path,
 * ) => import("../../prelude").EarlyErrorPrelude[]}
 */
const listDuplicateEarlyError = (hoisting, path) =>
  map(listDuplicate(hoisting), (variable) =>
    makeEarlyErrorPrelude({
      guard: null,
      message: reportDuplicate(variable),
      path,
    }),
  );

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   hoisting: import("../../query/hoist").DeclareHoist[],
 * ) => import("../../query/hoist").DeclareHoist[]}
 */
const removeDuplicate = (hoisting) => {
  /**
   * @type {Record<estree.Variable, import("../../query/hoist").DeclareHoist>}
   */
  const record = createRecord();
  for (const hoist of hoisting) {
    record[hoist.variable] = hoist;
  }
  return listValue(record);
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   sort: import("../../../sort").GlobalSort,
 *   hoisting: import("../../query/hoist").DeclareHoist[],
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").NodePrelude,
 *   import(".").RootFrame,
 * >}
 */
const setupReifyRootFrame = ({ path }, sort, hoisting) =>
  bindSequence(
    flatSequence(
      map(removeDuplicate(hoisting), (hoist) =>
        setupReifyEntry({ path }, hoist, sort.mode),
      ),
    ),
    (entries) =>
      initSequence(listDuplicateEarlyError(hoisting, path), {
        type: "root-reify",
        sort,
        record: reduceEntry(entries),
      }),
  );

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   sort: import("../../../sort").RootSort,
 *   hoisting: import("../../query/hoist").DeclareHoist[],
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").NodePrelude,
 *   import(".").RootFrame,
 * >}
 */
const setupAlienRootFrame = ({ path, meta }, sort, hoisting) =>
  bindSequence(
    flatSequence(
      map(removeDuplicate(hoisting), (hoist) =>
        setupAlienEntry(
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          hoist,
          sort.mode,
        ),
      ),
    ),
    (entries) =>
      initSequence(listDuplicateEarlyError(hoisting, path), {
        type: "root-alien",
        sort,
        record: reduceEntry(entries),
      }),
  );

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   options: {
 *     scoping: "reify" | "alien",
 *     sort: import("../../../sort").RootSort,
 *     hoisting: import("../../query/hoist").DeclareHoist[],
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").NodePrelude,
 *   import(".").RootFrame,
 * >}
 */
export const setupRootFrame = (site, { sort, hoisting, scoping }) => {
  if (scoping === "reify") {
    if (isExternalLocalEvalSort(sort)) {
      throw new AranError("Cannot reify external-local-eval frame", {
        sort,
        hoisting,
        scoping,
      });
    } else {
      return setupReifyRootFrame(site, sort, hoisting);
    }
  } else if (scoping === "alien") {
    return setupAlienRootFrame(site, sort, hoisting);
  } else {
    throw new AranTypeError(scoping);
  }
};

//////////
// load //
//////////

/**
 * @type {Record<
 *   import("../../../header").HeaderParameter,
 *   import("../../../header").Header
 * >}
 */
const HEADER = {
  "this": {
    type: "this",
    mode: null,
  },
  "new.target": {
    type: "new.target",
    mode: null,
  },
  "import.meta": {
    type: "import.meta",
    mode: null,
  },
  "import.dynamic": {
    type: "import.dynamic",
    mode: null,
  },
  "super.get": {
    type: "super.get",
    mode: null,
  },
  "super.set": {
    type: "super.set",
    mode: null,
  },
  "super.call": {
    type: "super.call",
    mode: null,
  },
  "private.has": {
    type: "private.has",
    mode: "strict",
    key: null,
  },
  "private.get": {
    type: "private.get",
    mode: "strict",
    key: null,
  },
  "private.set": {
    type: "private.set",
    mode: "strict",
    key: null,
  },
  "read.strict": {
    type: "read",
    mode: "strict",
    variable: null,
  },
  "read.sloppy": {
    type: "read",
    mode: "sloppy",
    variable: null,
  },
  "write.strict": {
    type: "write",
    mode: "strict",
    variable: null,
  },
  "write.sloppy": {
    type: "write",
    mode: "sloppy",
    variable: null,
  },
  "typeof.strict": {
    type: "typeof",
    mode: "strict",
    variable: null,
  },
  "typeof.sloppy": {
    type: "typeof",
    mode: "sloppy",
    variable: null,
  },
  "discard.sloppy": {
    type: "discard",
    mode: "sloppy",
    variable: null,
  },
};

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   frame: import(".").RootFrame,
 * ) => import("../../../header").Header[]}
 */
const listDynamicHeader = (mode, frame) => {
  if (
    isModuleSort(frame.sort) ||
    isScriptSort(frame.sort) ||
    isGlobalEvalSort(frame.sort)
  ) {
    return [
      HEADER.this,
      HEADER["import.dynamic"],
      ...(isModuleSort(frame.sort) ? [HEADER["import.meta"]] : []),
      ...(frame.type === "root-alien"
        ? [
            HEADER["read.strict"],
            HEADER["write.strict"],
            HEADER["typeof.strict"],
          ]
        : []),
      ...(frame.type === "root-alien" && mode === "sloppy"
        ? [
            HEADER["read.sloppy"],
            HEADER["write.sloppy"],
            HEADER["typeof.sloppy"],
            HEADER["discard.sloppy"],
          ]
        : []),
    ];
  } else if (isExternalLocalEvalSort(frame.sort)) {
    return [
      HEADER.this,
      HEADER["import.dynamic"],
      ...(frame.sort.ancestry.program === "module"
        ? [HEADER["import.meta"]]
        : []),
      ...(frame.sort.ancestry.closure !== "none" ? [HEADER["new.target"]] : []),
      ...(frame.sort.ancestry.closure !== "none" &&
      frame.sort.ancestry.closure !== "function"
        ? [HEADER["super.get"], HEADER["super.set"]]
        : []),
      ...(frame.sort.ancestry.closure === "derived-constructor"
        ? [HEADER["super.call"]]
        : []),
      ...(mode === "strict"
        ? [HEADER["private.has"], HEADER["private.get"], HEADER["private.set"]]
        : []),
      HEADER["read.strict"],
      HEADER["write.strict"],
      HEADER["typeof.strict"],
      ...(mode === "sloppy"
        ? [
            HEADER["read.sloppy"],
            HEADER["write.sloppy"],
            HEADER["typeof.sloppy"],
            HEADER["discard.sloppy"],
          ]
        : []),
    ];
  } else {
    throw new AranTypeError(frame.sort);
  }
};

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   frame: import(".").RootFrame,
 *   operation: import("..").LoadOperation,
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeRootLoadExpression = ({ path, meta }, frame, operation) => {
  if (
    operation.type === "read" ||
    operation.type === "typeof" ||
    operation.type === "discard"
  ) {
    if (frame.type === "root-reify") {
      return makeReifyLoadExpression(
        { path, meta },
        hasOwn(frame.record, operation.variable)
          ? frame.record[operation.variable]
          : null,
        operation,
      );
    } else if (frame.type === "root-alien") {
      return makeAlienLoadExpression(
        { path },
        hasOwn(frame.record, operation.variable)
          ? frame.record[operation.variable]
          : null,
        operation,
      );
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "read-import-dynamic") {
    return makeStraightParameterExpression(
      operation.mode,
      "import.dynamic",
      path,
    );
  } else if (operation.type === "read-this") {
    if (isModuleSort(frame.sort)) {
      return makePrimitiveExpression({ undefined: null }, path);
    } else if (isScriptSort(frame.sort) || isGlobalEvalSort(frame.sort)) {
      return makeIntrinsicExpression("globalThis", path);
    } else if (isExternalLocalEvalSort(frame.sort)) {
      return makeStraightParameterExpression(operation.mode, "this", path);
    } else {
      throw new AranTypeError(frame.sort);
    }
  } else if (operation.type === "read-import-meta") {
    if (
      isModuleSort(frame.sort) ||
      (isExternalLocalEvalSort(frame.sort) &&
        frame.sort.ancestry.program === "module")
    ) {
      return makeStraightParameterExpression(
        operation.mode,
        "import.meta",
        path,
      );
    } else {
      return makeEarlyErrorExpression("Illegal 'import.meta'", path);
    }
  } else if (operation.type === "read-new-target") {
    if (
      isExternalLocalEvalSort(frame.sort) &&
      frame.sort.ancestry.closure !== "none"
    ) {
      return makeStraightParameterExpression(
        operation.mode,
        "new.target",
        path,
      );
    } else {
      return makeEarlyErrorExpression("Illegal 'new.target'", path);
    }
  } else if (operation.type === "get-super") {
    if (
      isExternalLocalEvalSort(frame.sort) &&
      frame.sort.ancestry.closure !== "none" &&
      frame.sort.ancestry.closure !== "function"
    ) {
      return makeApplyExpression(
        makeStraightParameterExpression(operation.mode, "super.get", path),
        makePrimitiveExpression({ undefined: null }, path),
        [makeReadCacheExpression(operation.key, path)],
        path,
      );
    } else {
      return makeEarlyErrorExpression("Illegal 'super' get", path);
    }
  } else if (
    operation.type === "get-private" ||
    operation.type === "has-private"
  ) {
    if (isExternalLocalEvalSort(frame.sort)) {
      if (operation.mode === "strict") {
        return makeApplyExpression(
          makePrivateParameterExpression(
            operation.mode,
            PRIVATE_MAPPING[operation.type],
            operation.key,
            path,
          ),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeReadCacheExpression(operation.target, path),
            makePrimitiveExpression(operation.key, path),
          ],
          path,
        );
      } else if (operation.mode === "sloppy") {
        return makeEarlyErrorExpression(
          "Illegal sloppy private operation",
          path,
        );
      } else {
        throw new AranTypeError(operation.mode);
      }
    } else {
      return makeEarlyErrorExpression("Illegal global private operation", path);
    }
  } else if (operation.type === "eval") {
    return prependSequence(
      map(listDynamicHeader(operation.mode, frame), makeHeaderPrelude),
      makeEvalExpression(makeReadCacheExpression(operation.code, path), path),
    );
  } else if (operation.type === "wrap-result") {
    return makeEarlyErrorExpression("Illegal return statement", path);
  } else if (operation.type === "read-error") {
    throw new AranError("Missing catch frame", operation);
  } else if (operation.type === "read-input") {
    throw new AranError("Missing closure frame", operation);
  } else {
    throw new AranTypeError(operation);
  }
};

//////////
// save //
//////////

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   frame: import("./index").RootFrame,
 *   operation: import("..").SaveOperation,
 * ) => import("../../sequence").EffectSequence}
 */
export const listRootSaveEffect = ({ path, meta }, frame, operation) => {
  if (
    operation.type === "declare" ||
    operation.type === "initialize" ||
    operation.type === "write"
  ) {
    if (frame.type === "root-reify") {
      return makeReifySaveEffect(
        { path, meta },
        hasOwn(frame.record, operation.variable)
          ? frame.record[operation.variable]
          : null,
        operation,
      );
    } else if (frame.type === "root-alien") {
      return makeAlienSaveEffect(
        { path },
        hasOwn(frame.record, operation.variable)
          ? frame.record[operation.variable]
          : null,
        operation,
      );
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "call-super") {
    if (
      isExternalLocalEvalSort(frame.sort) &&
      frame.sort.ancestry.closure === "derived-constructor"
    ) {
      return makeExpressionEffect(
        makeApplyExpression(
          makeStraightParameterExpression(operation.mode, "super.call", path),
          makePrimitiveExpression({ undefined: null }, path),
          [makeReadCacheExpression(operation.input, path)],
          path,
        ),
        path,
      );
    } else {
      return listEarlyErrorEffect("Illegal 'super' call", path);
    }
  } else if (operation.type === "set-super") {
    if (
      isExternalLocalEvalSort(frame.sort) &&
      frame.sort.ancestry.closure !== "none" &&
      frame.sort.ancestry.closure !== "function"
    ) {
      return makeExpressionEffect(
        makeApplyExpression(
          makeStraightParameterExpression(operation.mode, "super.set", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeReadCacheExpression(operation.key, path),
            makeReadCacheExpression(operation.value, path),
          ],
          path,
        ),
        path,
      );
    } else {
      return listEarlyErrorEffect("Illegal 'super' set", path);
    }
  } else if (operation.type === "set-private") {
    if (isExternalLocalEvalSort(frame.sort)) {
      if (operation.mode === "strict") {
        return makeExpressionEffect(
          makeApplyExpression(
            makePrivateParameterExpression(
              operation.mode,
              "set",
              operation.key,
              path,
            ),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeReadCacheExpression(operation.target, path),
              makePrimitiveExpression(operation.key, path),
              makeReadCacheExpression(operation.value, path),
            ],
            path,
          ),
          path,
        );
      } else if (operation.mode === "sloppy") {
        return listEarlyErrorEffect("Illegal sloppy private operation", path);
      } else {
        throw new AranTypeError(operation.mode);
      }
    } else {
      return listEarlyErrorEffect("Illegal global private operation", path);
    }
  } else if (
    operation.type === "define-private" ||
    operation.type === "register-private-singleton" ||
    operation.type === "register-private-collection" ||
    operation.type === "initialize-private"
  ) {
    throw new AranError("Missing private frame", operation);
  } else {
    throw new AranTypeError(operation);
  }
};
