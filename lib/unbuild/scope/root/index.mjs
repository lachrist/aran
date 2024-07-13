import { AranError, AranTypeError } from "../../../error.mjs";
import {
  makeApplyExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
} from "../../node.mjs";
import {
  concat_,
  filterNarrow,
  hasOwn,
  isNotNull,
  map,
  reduceEntry,
} from "../../../util/index.mjs";
import {
  flatSequence,
  initSequence,
  liftSequenceX,
  liftSequenceX_,
  mapSequence,
  zeroSequence,
} from "../../../sequence.mjs";
import {
  makeReifyLoadExpression,
  listReifySaveEffect,
  setupReifyEntry,
} from "./reify.mjs";
import {
  makeAlienLoadExpression,
  makeAlienSaveEffect,
  setupAlienEntry,
} from "./alien.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";
import { initErrorExpression } from "../../prelude/index.mjs";

const PRIVATE_MAPPING = {
  "has-private": /** @type {"private.has"} */ ("private.has"),
  "get-private": /** @type {"private.get"} */ ("private.get"),
};

///////////
// setup //
///////////

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   mode: "strict" | "sloppy",
 *   sort: "module" | "script" | "eval.global",
 *   bindings: import("../../query/hoist-public").Binding[],
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").DuplicatePrelude
 *     | import("../../prelude").PrefixPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *   ),
 *   import(".").RootFrame,
 * >}
 */
const setupReifyRootFrame = (site, mode, sort, bindings) =>
  mapSequence(
    flatSequence(
      filterNarrow(
        map(bindings, (binding) => setupReifyEntry(site, binding, mode)),
        isNotNull,
      ),
    ),
    (entries) => ({
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
 *   bindings: import("../../query/hoist-public").Binding[],
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").HeaderPrelude
 *     | import("../../prelude").ErrorPrelude
 *     | import("../../prelude").PrefixPrelude
 *     | import("../../prelude").WarningPrelude
 *   ),
 *   import(".").RootFrame,
 * >}
 */
const setupAlienRootFrame = ({ path, meta }, mode, sort, bindings) =>
  mapSequence(
    flatSequence(
      filterNarrow(
        map(bindings, (binding) =>
          setupAlienEntry(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            binding,
            mode,
          ),
        ),
        isNotNull,
      ),
    ),
    (entries) => ({
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
 *     bindings: import("../../query/hoist-public").Binding[],
 *   },
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").HeaderPrelude
 *     | import("../../prelude").DuplicatePrelude
 *     | import("../../prelude").ErrorPrelude
 *     | import("../../prelude").PrefixPrelude
 *     | import("../../prelude").WarningPrelude
 *   ),
 *   import(".").RootFrame,
 * >}
 */
export const setupRootFrame = (
  site,
  { global_declarative_record, mode, sort, bindings },
) => {
  switch (global_declarative_record) {
    case "native": {
      return setupAlienRootFrame(site, mode, sort, bindings);
    }
    case "emulate": {
      if (sort === "eval.local.root") {
        throw new AranError("Cannot emulate external-local-eval frame", {
          sort,
          bindings,
          global_declarative_record,
        });
      } else if (
        sort === "module" ||
        sort === "script" ||
        sort === "eval.global"
      ) {
        return setupReifyRootFrame(site, mode, sort, bindings);
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
 *     | import("../../prelude").ErrorPrelude
 *     | import("../../prelude").PrivatePrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").RebootPrelude
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
        frame.sort,
        hasOwn(frame.record, operation.variable)
          ? frame.record[operation.variable]
          : null,
        operation,
      );
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "read-import-dynamic") {
    return zeroSequence(makeReadExpression("import", path));
  } else if (operation.type === "read-this") {
    if (frame.sort === "module") {
      return zeroSequence(makeIntrinsicExpression("undefined", path));
    } else if (frame.sort === "script" || frame.sort === "eval.global") {
      return zeroSequence(makeIntrinsicExpression("globalThis", path));
    } else if (frame.sort === "eval.local.root") {
      return zeroSequence(makeReadExpression("this", path));
    } else {
      throw new AranTypeError(frame.sort);
    }
  } else if (operation.type === "read-import-meta") {
    if (frame.sort === "module") {
      return zeroSequence(makeReadExpression("import.meta", path));
    } else {
      return initErrorExpression("Illegal 'import.meta'", path);
    }
  } else if (operation.type === "read-new-target") {
    if (frame.sort === "eval.local.root") {
      return zeroSequence(makeReadExpression("new.target", path));
    } else {
      return initErrorExpression("Illegal 'new.target'", path);
    }
  } else if (operation.type === "get-super") {
    if (frame.sort === "eval.local.root") {
      return zeroSequence(
        makeApplyExpression(
          makeReadExpression("super.get", path),
          makeIntrinsicExpression("undefined", path),
          [operation.key],
          path,
        ),
      );
    } else {
      return initErrorExpression("Illegal 'super' get", path);
    }
  } else if (
    operation.type === "get-private" ||
    operation.type === "has-private"
  ) {
    if (frame.sort === "eval.local.root") {
      if (operation.mode === "strict") {
        return initSequence(
          [{ type: "private", data: operation.key }],
          makeApplyExpression(
            makeReadExpression(PRIVATE_MAPPING[operation.type], path),
            makeIntrinsicExpression("undefined", path),
            [operation.target, makePrimitiveExpression(operation.key, path)],
            path,
          ),
        );
      } else if (operation.mode === "sloppy") {
        return initErrorExpression("Illegal sloppy private operation", path);
      } else {
        throw new AranTypeError(operation.mode);
      }
    } else {
      return initErrorExpression("Illegal global private operation", path);
    }
  } else if (operation.type === "wrap-result") {
    return initErrorExpression("Illegal return statement", path);
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
 *     | import("../../prelude").ErrorPrelude
 *     | import("../../prelude").DuplicatePrelude
 *     | import("../../prelude").PrivatePrelude
 *     | import("../../prelude").HeaderPrelude
 *     | import("../../prelude").WarningPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *   ),
 *   import("../../atom").Effect[],
 * >}
 */
export const listRootSaveEffect = ({ path, meta }, frame, operation) => {
  if (
    operation.type === "late-declare" ||
    operation.type === "initialize" ||
    operation.type === "write" ||
    operation.type === "write-sloppy-function"
  ) {
    if (frame.kind === "reify") {
      return listReifySaveEffect(
        { path, meta },
        hasOwn(frame.record, operation.variable)
          ? frame.record[operation.variable]
          : null,
        operation,
      );
    } else if (frame.kind === "alien") {
      return makeAlienSaveEffect(
        { path },
        frame.sort,
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
      return zeroSequence([
        makeExpressionEffect(
          makeApplyExpression(
            makeReadExpression("super.call", path),
            makeIntrinsicExpression("undefined", path),
            [operation.input],
            path,
          ),
          path,
        ),
      ]);
    } else {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          initErrorExpression("Illegal 'super' call", path),
          path,
        ),
      );
    }
  } else if (operation.type === "set-super") {
    if (frame.sort === "eval.local.root") {
      return zeroSequence([
        makeExpressionEffect(
          makeApplyExpression(
            makeReadExpression("super.set", path),
            makeIntrinsicExpression("undefined", path),
            [operation.key, operation.value],
            path,
          ),
          path,
        ),
      ]);
    } else {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          initErrorExpression("Illegal 'super' set", path),
          path,
        ),
      );
    }
  } else if (operation.type === "set-private") {
    if (frame.sort === "eval.local.root") {
      if (operation.mode === "strict") {
        return initSequence(
          [{ type: "private", data: operation.key }],
          [
            makeExpressionEffect(
              makeApplyExpression(
                makeReadExpression("private.set", path),
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
          ],
        );
      } else if (operation.mode === "sloppy") {
        return liftSequenceX(
          concat_,
          liftSequenceX_(
            makeExpressionEffect,
            initErrorExpression("Illegal sloppy private operation", path),
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
          initErrorExpression("Illegal global private operation", path),
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
