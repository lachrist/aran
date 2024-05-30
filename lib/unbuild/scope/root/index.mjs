import { AranError, AranTypeError } from "../../../error.mjs";
import {
  makeApplyExpression,
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
  makeOtherParameterExpression,
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
} from "../../../sequence.mjs";
import { makeEarlyErrorPrelude } from "../../prelude.mjs";
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
import { isHoistDuplicable } from "../../query/index.mjs";

const {
  undefined,
  Array: { of: toArray },
} = globalThis;

const PRIVATE_MAPPING = {
  "has-private": /** @type {"private.has"} */ ("private.has"),
  "get-private": /** @type {"private.get"} */ ("private.get"),
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
 *   path: import("../../../path").Path,
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
 *   mode: "strict" | "sloppy",
 *   sort: "module" | "script" | "eval.global",
 *   hoisting: import("../../query/hoist").DeclareHoist[],
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   import(".").RootFrame,
 * >}
 */
const setupReifyRootFrame = ({ path }, mode, sort, hoisting) =>
  bindSequence(
    flatSequence(
      map(removeDuplicate(hoisting), (hoist) =>
        setupReifyEntry({ path }, hoist, mode),
      ),
    ),
    (entries) =>
      initSequence(listDuplicateEarlyError(hoisting, path), {
        type: "root",
        mode,
        kind: "reify",
        sort,
        record: reduceEntry(entries),
      }),
  );

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   mode: "strict" | "sloppy",
 *   sort: "module" | "script" | "eval.global" | "eval.local.root",
 *   hoisting: import("../../query/hoist").DeclareHoist[],
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").HeaderPrelude
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   import(".").RootFrame,
 * >}
 */
const setupAlienRootFrame = ({ path, meta }, mode, sort, hoisting) =>
  bindSequence(
    flatSequence(
      map(removeDuplicate(hoisting), (hoist) =>
        setupAlienEntry(
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          hoist,
          mode,
        ),
      ),
    ),
    (entries) =>
      initSequence(listDuplicateEarlyError(hoisting, path), {
        type: "root",
        kind: "alien",
        mode,
        sort,
        record: reduceEntry(entries),
      }),
  );

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   options: {
 *     global_declarative_record: "native" | "emulate",
 *     mode: "strict" | "sloppy",
 *     sort: "module" | "script" | "eval.global" | "eval.local.root",
 *     hoisting: import("../../query/hoist").DeclareHoist[],
 *   },
 * ) => import("../../../sequence").Sequence<
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
  { global_declarative_record, mode, sort, hoisting },
) => {
  switch (global_declarative_record) {
    case "native": {
      return setupAlienRootFrame(site, mode, sort, hoisting);
    }
    case "emulate": {
      if (sort === "eval.local.root") {
        throw new AranError("Cannot emulate external-local-eval frame", {
          sort,
          hoisting,
          global_declarative_record,
        });
      } else if (
        sort === "module" ||
        sort === "script" ||
        sort === "eval.global"
      ) {
        return setupReifyRootFrame(site, mode, sort, hoisting);
      } else {
        throw new AranTypeError(sort);
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
 * @type {(
 *   site: import("../../site").LeafSite,
 *   frame: import(".").RootFrame,
 *   operation: import("../operation").LoadOperation,
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").ContextPrelude
 *     | import("../../prelude").HeaderPrelude
 *   ),
 *   import("../../atom").Expression,
 * >}
 */
export const makeRootLoadExpression = ({ path, meta }, frame, operation) => {
  if (
    operation.type === "read" ||
    operation.type === "typeof" ||
    operation.type === "discard"
  ) {
    if (frame.kind === "reify") {
      return makeReifyLoadExpression(
        { path, meta },
        hasOwn(frame.record, operation.variable)
          ? frame.record[operation.variable]
          : null,
        operation,
      );
    } else if (frame.kind === "alien") {
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
    return makeOtherParameterExpression(
      operation.mode,
      "import.dynamic",
      null,
      path,
    );
  } else if (operation.type === "read-this") {
    if (frame.sort === "module") {
      return zeroSequence(makeIntrinsicExpression("undefined", path));
    } else if (frame.sort === "script" || frame.sort === "eval.global") {
      return zeroSequence(makeIntrinsicExpression("globalThis", path));
    } else if (frame.sort === "eval.local.root") {
      return makeOtherParameterExpression(operation.mode, "this", null, path);
    } else {
      throw new AranTypeError(frame.sort);
    }
  } else if (operation.type === "read-import-meta") {
    if (frame.sort === "module") {
      return makeOtherParameterExpression(
        operation.mode,
        "import.meta",
        null,
        path,
      );
    } else {
      return makeEarlyErrorExpression(
        makeRegularEarlyError("Illegal 'import.meta'", path),
      );
    }
  } else if (operation.type === "read-new-target") {
    if (frame.sort === "eval.local.root") {
      return makeOtherParameterExpression(
        operation.mode,
        "new.target",
        null,
        path,
      );
    } else {
      return makeEarlyErrorExpression(
        makeRegularEarlyError("Illegal 'new.target'", path),
      );
    }
  } else if (operation.type === "get-super") {
    if (frame.sort === "eval.local.root") {
      return liftSequenceX___(
        makeApplyExpression,
        makeOtherParameterExpression(operation.mode, "super.get", null, path),
        makeIntrinsicExpression("undefined", path),
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
    if (frame.sort === "eval.local.root") {
      if (operation.mode === "strict") {
        return liftSequenceX___(
          makeApplyExpression,
          makePrivateParameterExpression(
            operation.mode,
            PRIVATE_MAPPING[operation.type],
            operation.key,
            path,
          ),
          makeIntrinsicExpression("undefined", path),
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
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").HeaderPrelude
 *     | import("../../prelude").WarningPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *   ),
 *   import("../../atom").Effect[],
 * >}
 */
export const listRootSaveEffect = ({ path, meta }, frame, operation) => {
  if (
    operation.type === "declare" ||
    operation.type === "initialize" ||
    operation.type === "write"
  ) {
    if (frame.kind === "reify") {
      return makeReifySaveEffect(
        { path, meta },
        hasOwn(frame.record, operation.variable)
          ? frame.record[operation.variable]
          : null,
        operation,
      );
    } else if (frame.kind === "alien") {
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
    if (frame.sort === "eval.local.root") {
      return liftSequenceX(
        toArray,
        liftSequenceX_(
          makeExpressionEffect,
          liftSequenceX___(
            makeApplyExpression,
            makeOtherParameterExpression(
              operation.mode,
              "super.call",
              null,
              path,
            ),
            makeIntrinsicExpression("undefined", path),
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
    if (frame.sort === "eval.local.root") {
      return liftSequenceX(
        toArray,
        liftSequenceX_(
          makeExpressionEffect,
          liftSequenceX___(
            makeApplyExpression,
            makeOtherParameterExpression(
              operation.mode,
              "super.set",
              null,
              path,
            ),
            makeIntrinsicExpression("undefined", path),
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
    if (frame.sort === "eval.local.root") {
      if (operation.mode === "strict") {
        return liftSequenceX(
          toArray,
          liftSequenceX_(
            makeExpressionEffect,
            liftSequenceX___(
              makeApplyExpression,
              makePrivateParameterExpression(
                operation.mode,
                "private.set",
                operation.key,
                path,
              ),
              makeIntrinsicExpression("undefined", path),
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
