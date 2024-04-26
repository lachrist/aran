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
  makeEarlyErrorExpression,
  makeRegularEarlyError,
} from "../../early-error.mjs";
import {
  makePrivateParameterExpression,
  makeStraightParameterExpression,
} from "./parameter.mjs";
import {
  concat_,
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
  liftSequenceX,
  liftSequenceX_,
  liftSequenceX___,
  zeroSequence,
} from "../../sequence.mjs";
import {
  makeContextPrelude,
  makeEarlyErrorPrelude,
  makeHeaderPrelude,
} from "../../prelude.mjs";
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

const {
  undefined,
  Array: { of: toArray },
} = globalThis;

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
    makeEarlyErrorPrelude(
      makeRegularEarlyError(reportDuplicate(variable), path),
    ),
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
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
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
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").HeaderPrelude
 *     | import("../../prelude").EarlyErrorPrelude
 *   ),
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
 *     global_declarative_record: "native" | "emulate",
 *     sort: import("../../../sort").RootSort,
 *     hoisting: import("../../query/hoist").DeclareHoist[],
 *   },
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").HeaderPrelude
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   import(".").RootFrame,
 * >}
 */
export const setupRootFrame = (
  site,
  { sort, hoisting, global_declarative_record },
) => {
  switch (global_declarative_record) {
    case "native": {
      return setupAlienRootFrame(site, sort, hoisting);
    }
    case "emulate": {
      if (isExternalLocalEvalSort(sort)) {
        throw new AranError("Cannot emulate external-local-eval frame", {
          sort,
          hoisting,
          global_declarative_record,
        });
      } else {
        return setupReifyRootFrame(site, sort, hoisting);
      }
    }
    default: {
      throw new AranTypeError(global_declarative_record);
    }
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
      ...(frame.sort.situ !== "program" ? [HEADER["new.target"]] : []),
      ...(frame.sort.situ !== "program" && frame.sort.situ !== "function"
        ? [HEADER["super.get"], HEADER["super.set"]]
        : []),
      ...(frame.sort.situ === "derived-constructor"
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
 *   operation: import("../operation").LoadOperation,
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").ContextPrelude
 *     | import("../../prelude").HeaderPrelude
 *   ),
 *   aran.Expression<unbuild.Atom>,
 * >}
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
      return zeroSequence(makePrimitiveExpression({ undefined: null }, path));
    } else if (isScriptSort(frame.sort) || isGlobalEvalSort(frame.sort)) {
      return zeroSequence(makeIntrinsicExpression("globalThis", path));
    } else if (isExternalLocalEvalSort(frame.sort)) {
      return makeStraightParameterExpression(operation.mode, "this", path);
    } else {
      throw new AranTypeError(frame.sort);
    }
  } else if (operation.type === "read-import-meta") {
    if (isModuleSort(frame.sort)) {
      return makeStraightParameterExpression(
        operation.mode,
        "import.meta",
        path,
      );
    } else {
      return makeEarlyErrorExpression(
        makeRegularEarlyError("Illegal 'import.meta'", path),
      );
    }
  } else if (operation.type === "read-new-target") {
    if (isExternalLocalEvalSort(frame.sort) && frame.sort.situ !== "program") {
      return makeStraightParameterExpression(
        operation.mode,
        "new.target",
        path,
      );
    } else {
      return makeEarlyErrorExpression(
        makeRegularEarlyError("Illegal 'new.target'", path),
      );
    }
  } else if (operation.type === "get-super") {
    if (
      isExternalLocalEvalSort(frame.sort) &&
      frame.sort.situ !== "program" &&
      frame.sort.situ !== "function"
    ) {
      return liftSequenceX___(
        makeApplyExpression,
        makeStraightParameterExpression(operation.mode, "super.get", path),
        makePrimitiveExpression({ undefined: null }, path),
        [operation.key],
        path,
      );
    } else {
      return makeEarlyErrorExpression(
        makeRegularEarlyError("Illegal 'super' get", path),
      );
    }
  } else if (
    operation.type === "get-private" ||
    operation.type === "has-private"
  ) {
    if (isExternalLocalEvalSort(frame.sort)) {
      if (operation.mode === "strict") {
        return liftSequenceX___(
          makeApplyExpression,
          makePrivateParameterExpression(
            operation.mode,
            PRIVATE_MAPPING[operation.type],
            operation.key,
            path,
          ),
          makePrimitiveExpression({ undefined: null }, path),
          [operation.target, makePrimitiveExpression(operation.key, path)],
          path,
        );
      } else if (operation.mode === "sloppy") {
        return makeEarlyErrorExpression(
          makeRegularEarlyError("Illegal sloppy private operation", path),
        );
      } else {
        throw new AranTypeError(operation.mode);
      }
    } else {
      return makeEarlyErrorExpression(
        makeRegularEarlyError("Illegal global private operation", path),
      );
    }
  } else if (operation.type === "eval") {
    return initSequence(
      [
        ...map(listDynamicHeader(operation.mode, frame), makeHeaderPrelude),
        makeContextPrelude([path, operation.context]),
      ],
      makeEvalExpression(makeReadCacheExpression(operation.code, path), path),
    );
  } else if (operation.type === "wrap-result") {
    return makeEarlyErrorExpression(
      makeRegularEarlyError("Illegal return statement", path),
    );
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
 *   operation: import("../operation").SaveOperation,
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").HeaderPrelude
 *     | import("../../prelude").WarningPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *   ),
 *   aran.Effect<unbuild.Atom>[],
 * >}
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
      frame.sort.situ === "derived-constructor"
    ) {
      return liftSequenceX(
        toArray,
        liftSequenceX_(
          makeExpressionEffect,
          liftSequenceX___(
            makeApplyExpression,
            makeStraightParameterExpression(operation.mode, "super.call", path),
            makePrimitiveExpression({ undefined: null }, path),
            [operation.input],
            path,
          ),
          path,
        ),
      );
    } else {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          makeEarlyErrorExpression(
            makeRegularEarlyError("Illegal 'super' call", path),
          ),
          path,
        ),
      );
    }
  } else if (operation.type === "set-super") {
    if (
      isExternalLocalEvalSort(frame.sort) &&
      frame.sort.situ !== "program" &&
      frame.sort.situ !== "function"
    ) {
      return liftSequenceX(
        toArray,
        liftSequenceX_(
          makeExpressionEffect,
          liftSequenceX___(
            makeApplyExpression,
            makeStraightParameterExpression(operation.mode, "super.set", path),
            makePrimitiveExpression({ undefined: null }, path),
            [operation.key, operation.value],
            path,
          ),
          path,
        ),
      );
    } else {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          makeEarlyErrorExpression(
            makeRegularEarlyError("Illegal 'super' set", path),
          ),
          path,
        ),
      );
    }
  } else if (operation.type === "set-private") {
    if (isExternalLocalEvalSort(frame.sort)) {
      if (operation.mode === "strict") {
        return liftSequenceX(
          toArray,
          liftSequenceX_(
            makeExpressionEffect,
            liftSequenceX___(
              makeApplyExpression,
              makePrivateParameterExpression(
                operation.mode,
                "set",
                operation.key,
                path,
              ),
              makePrimitiveExpression({ undefined: null }, path),
              [
                operation.target,
                makePrimitiveExpression(operation.key, path),
                operation.value,
              ],
              path,
            ),
            path,
          ),
        );
      } else if (operation.mode === "sloppy") {
        return liftSequenceX(
          concat_,
          liftSequenceX_(
            makeExpressionEffect,
            makeEarlyErrorExpression(
              makeRegularEarlyError("Illegal sloppy private operation", path),
            ),
            path,
          ),
        );
      } else {
        throw new AranTypeError(operation.mode);
      }
    } else {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          makeEarlyErrorExpression(
            makeRegularEarlyError("Illegal global private operation", path),
          ),
          path,
        ),
      );
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
