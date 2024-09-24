import { AranExecError, AranTypeError } from "../../../report.mjs";
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
  initSyntaxErrorExpression,
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
 *   hash: import("../../../hash").Hash,
 *   mode: "strict" | "sloppy",
 *   sort: "module" | "script" | "eval.global",
 *   bindings: import("../../annotation/hoisting-public").Binding[],
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").ReifyExternalPrelude
 *     | import("../../prelude").PrefixPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *   ),
 *   import(".").RootFrame,
 * >}
 */
const setupReifyRootFrame = (hash, mode, sort, bindings) =>
  mapSequence(
    flatSequence(
      filterNarrow(
        map(bindings, (binding) => setupReifyEntry(hash, binding, mode)),
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
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   mode: "strict" | "sloppy",
 *   sort: "module" | "script" | "eval.global" | "eval.local.root",
 *   bindings: import("../../annotation/hoisting-public").Binding[],
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").HeaderPrelude
 *     | import("../../prelude").SyntaxErrorPrelude
 *     | import("../../prelude").PrefixPrelude
 *     | import("../../prelude").WarningPrelude
 *   ),
 *   import(".").RootFrame,
 * >}
 */
const setupAlienRootFrame = (hash, meta, mode, sort, bindings) =>
  mapSequence(
    flatSequence(
      filterNarrow(
        map(bindings, (binding) =>
          setupAlienEntry(
            hash,
            forkMeta((meta = nextMeta(meta))),
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
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   options: {
 *     global_declarative_record: "builtin" | "emulate",
 *     mode: "strict" | "sloppy",
 *     sort: "module" | "script" | "eval.global" | "eval.local.root",
 *     bindings: import("../../annotation/hoisting-public").Binding[],
 *   },
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").HeaderPrelude
 *     | import("../../prelude").ReifyExternalPrelude
 *     | import("../../prelude").SyntaxErrorPrelude
 *     | import("../../prelude").PrefixPrelude
 *     | import("../../prelude").WarningPrelude
 *   ),
 *   import(".").RootFrame,
 * >}
 */
export const setupRootFrame = (
  hash,
  meta,
  { global_declarative_record, mode, sort, bindings },
) => {
  switch (global_declarative_record) {
    case "builtin": {
      return setupAlienRootFrame(hash, meta, mode, sort, bindings);
    }
    case "emulate": {
      if (sort === "eval.local.root") {
        throw new AranExecError("Cannot emulate external-local-eval frame", {
          sort,
          bindings,
          global_declarative_record,
        });
      } else if (
        sort === "module" ||
        sort === "script" ||
        sort === "eval.global"
      ) {
        return setupReifyRootFrame(hash, mode, sort, bindings);
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
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   frame: import(".").RootFrame,
 *   operation: import("../operation").LoadOperation,
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").BodyPrelude,
 *   import("../../atom").Expression,
 * >}
 */
export const makeRootLoadExpression = (hash, meta, frame, operation) => {
  if (
    operation.type === "read" ||
    operation.type === "typeof" ||
    operation.type === "discard"
  ) {
    switch (frame.kind) {
      case "reify": {
        return makeReifyLoadExpression(
          hash,
          meta,
          hasOwn(frame.record, operation.variable)
            ? frame.record[operation.variable]
            : null,
          operation,
        );
      }
      case "alien": {
        return makeAlienLoadExpression(
          hash,
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
    // This might not be correct for eval.local.root
    // Because it might be inside a with statement.
    // cf: wrong-this-parameter-in-with-in-eval
    return zeroSequence(makeIntrinsicExpression("undefined", hash));
  } else if (operation.type === "read-import") {
    return zeroSequence(makeReadExpression("import", hash));
  } else if (
    operation.type === "get-private" ||
    operation.type === "has-private"
  ) {
    if (frame.sort === "eval.local.root") {
      if (operation.mode === "strict") {
        return initSequence(
          [makeUnboundPrivatePrelude(operation.key)],
          makeApplyExpression(
            makeReadExpression(PRIVATE_MAPPING[operation.type], hash),
            makeIntrinsicExpression("undefined", hash),
            [operation.target, makePrimitiveExpression(operation.key, hash)],
            hash,
          ),
        );
      } else if (operation.mode === "sloppy") {
        return initSyntaxErrorExpression(
          "Illegal sloppy private operation",
          hash,
        );
      } else {
        throw new AranTypeError(operation.mode);
      }
    } else {
      return initSyntaxErrorExpression(
        "Illegal global private operation",
        hash,
      );
    }
  } else {
    throw new AranExecError("missing binding frame", {
      hash,
      meta,
      frame,
      operation,
    });
  }
};

//////////
// save //
//////////

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   frame: import(".").RootFrame,
 *   operation: import("../operation").SaveOperation,
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").BodyPrelude,
 *   import("../../atom").Effect[],
 * >}
 */
export const listRootSaveEffect = (hash, meta, frame, operation) => {
  if (
    operation.type === "late-declare" ||
    operation.type === "initialize" ||
    operation.type === "write" ||
    operation.type === "write-sloppy-function"
  ) {
    switch (frame.kind) {
      case "reify": {
        return listReifySaveEffect(
          hash,
          meta,
          hasOwn(frame.record, operation.variable)
            ? frame.record[operation.variable]
            : null,
          operation,
        );
      }
      case "alien": {
        return makeAlienSaveEffect(
          hash,
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
    if (frame.sort === "eval.local.root") {
      if (operation.mode === "strict") {
        return initSequence(
          [makeUnboundPrivatePrelude(operation.key)],
          [
            makeExpressionEffect(
              makeApplyExpression(
                makeReadExpression("private.set", hash),
                makeIntrinsicExpression("undefined", hash),
                [
                  operation.target,
                  makePrimitiveExpression(operation.key, hash),
                  operation.value,
                ],
                hash,
              ),
              hash,
            ),
          ],
        );
      } else if (operation.mode === "sloppy") {
        return liftSequenceX(
          concat_,
          liftSequenceX_(
            makeExpressionEffect,
            initSyntaxErrorExpression("Illegal sloppy private operation", hash),
            hash,
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
          initSyntaxErrorExpression("Illegal global private operation", hash),
          hash,
        ),
      );
    }
  } else {
    throw new AranExecError("missing binding frame", {
      hash,
      meta,
      frame,
      operation,
    });
  }
};
