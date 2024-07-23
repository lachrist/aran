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
import {
  initErrorExpression,
  makeUnboundPrivatePrelude,
} from "../../prelude/index.mjs";

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
 *     | import("../../prelude").ReifyExternalPrelude
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
 *     global_declarative_record: "builtin" | "emulate",
 *     mode: "strict" | "sloppy",
 *     sort: "module" | "script" | "eval.global" | "eval.local.root",
 *     bindings: import("../../query/hoist-public").Binding[],
 *   },
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").HeaderPrelude
 *     | import("../../prelude").ReifyExternalPrelude
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
    case "builtin": {
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
 *   import("../../prelude").BodyPrelude,
 *   import("../../atom").Expression,
 * >}
 */
export const makeRootLoadExpression = (site, frame, operation) => {
  if (
    operation.type === "read" ||
    operation.type === "typeof" ||
    operation.type === "discard"
  ) {
    switch (frame.kind) {
      case "reify": {
        return makeReifyLoadExpression(
          site,
          hasOwn(frame.record, operation.variable)
            ? frame.record[operation.variable]
            : null,
          operation,
        );
      }
      case "alien": {
        return makeAlienLoadExpression(
          site,
          frame.sort,
          hasOwn(frame.record, operation.variable)
            ? frame.record[operation.variable]
            : null,
          operation,
        );
      }
      default: {
        throw new AranTypeError(frame);
      }
    }
  } else if (operation.type === "read-ambient-this") {
    const { path } = site;
    // This might not be correct for eval.local.root
    // Because it might be inside a with statement.
    // cf: wrong-this-parameter-in-with-in-eval
    return zeroSequence(makeIntrinsicExpression("undefined", path));
  } else if (operation.type === "read-import") {
    const { path } = site;
    return zeroSequence(makeReadExpression("import", path));
  } else if (
    operation.type === "get-private" ||
    operation.type === "has-private"
  ) {
    const { path } = site;
    if (frame.sort === "eval.local.root") {
      if (operation.mode === "strict") {
        return initSequence(
          [makeUnboundPrivatePrelude(operation.key)],
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
  } else {
    throw new AranError("missing binding frame", { site, frame, operation });
  }
};

//////////
// save //
//////////

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   frame: import(".").RootFrame,
 *   operation: import("../operation").SaveOperation,
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").BodyPrelude,
 *   import("../../atom").Effect[],
 * >}
 */
export const listRootSaveEffect = (site, frame, operation) => {
  if (
    operation.type === "late-declare" ||
    operation.type === "initialize" ||
    operation.type === "write" ||
    operation.type === "write-sloppy-function"
  ) {
    switch (frame.kind) {
      case "reify": {
        return listReifySaveEffect(
          site,
          hasOwn(frame.record, operation.variable)
            ? frame.record[operation.variable]
            : null,
          operation,
        );
      }
      case "alien": {
        return makeAlienSaveEffect(
          site,
          frame.sort,
          hasOwn(frame.record, operation.variable)
            ? frame.record[operation.variable]
            : null,
          operation,
        );
      }
      default: {
        throw new AranTypeError(frame);
      }
    }
  } else if (operation.type === "set-private") {
    const { path } = site;
    if (frame.sort === "eval.local.root") {
      if (operation.mode === "strict") {
        return initSequence(
          [makeUnboundPrivatePrelude(operation.key)],
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
  } else {
    throw new AranError("missing binding frame", { site, frame, operation });
  }
};
