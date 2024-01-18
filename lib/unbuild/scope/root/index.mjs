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
  isExternalRootContext,
  isInternalRootContext,
} from "../../../context.mjs";
import {
  makePrivateParameterExpression,
  makeStraightParameterExpression,
} from "./parameter.mjs";
import {
  createRecord,
  hasOwn,
  includes,
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
 *   hoisting: import("../../query/hoist").RegularHoist[],
 * ) => estree.Variable[]}
 */
const listDuplicate = (hoisting) => {
  /** @type {Record<estree.Variable, "var" | "let" | "const" | undefined>}} */
  const record = createRecord();
  /** @type {Record<estree.Variable, null>} */
  const duplicate = createRecord();
  for (const hoist of hoisting) {
    const kind = record[hoist.variable];
    if (kind === undefined) {
      record[hoist.variable] = hoist.kind;
    } else if (kind !== "var" || hoist.kind !== "var") {
      duplicate[hoist.variable] = null;
    }
  }
  return listKey(duplicate);
};
/* eslint-enable local/no-impure */

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   hoisting: import("../../query/hoist").RegularHoist[],
 * ) => import(".").Declare[]}
 */
const listDeclare = (mode, hoisting) => {
  /**
   * @type {Record<estree.Variable, import(".").Declare>}
   */
  const record = createRecord();
  for (const { kind, variable } of hoisting) {
    record[variable] = { type: "declare", mode, kind, variable };
  }
  return listValue(record);
};

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   context: (
 *     | import("../../../context").InternalRootContext
 *     | import("../../../context").ExternalRootContext
 *   ),
 *   hoisting: import("../../query/hoist").RegularHoist[],
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").NodePrelude,
 *   import(".").RootFrame,
 * >}
 */
export const setupRootFrame = ({ path, meta }, context, hoisting) => {
  const { mode } = context;
  const errors = map(listDuplicate(hoisting), (variable) =>
    makeEarlyErrorPrelude({
      guard: null,
      message: reportDuplicate(variable),
      path,
    }),
  );
  const operations = listDeclare(mode, hoisting);
  if (isInternalRootContext(context)) {
    return bindSequence(
      flatSequence(
        map(operations, (operation) => setupReifyEntry({ path }, operation)),
      ),
      (entries) =>
        initSequence(errors, {
          type: "root-reify",
          context,
          record: reduceEntry(entries),
        }),
    );
  } else if (isExternalRootContext(context)) {
    return bindSequence(
      flatSequence(
        map(operations, (operation) =>
          setupAlienEntry(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            operation,
          ),
        ),
      ),
      (entries) =>
        initSequence(errors, {
          type: "root-alien",
          context,
          record: reduceEntry(entries),
        }),
    );
  } else {
    throw new AranTypeError(context);
  }
};

//////////
// load //
//////////

/**
 * @type {import("../../../header").Header}
 */
const IMPORT_META_HEADER = {
  type: "import.meta",
  mode: null,
};

/**
 * @type {import("../../../header").Header}
 */
const IMPORT_DYNAMIC_HEADER = {
  type: "import.dynamic",
  mode: null,
};

/**
 * @type {import("../../../header").Header[]}
 */
const STRICT_DYNAMIC_LOOKUP_HEADER_ENUM = [
  {
    type: "read",
    mode: "strict",
    variable: null,
  },
  {
    type: "write",
    mode: "strict",
    variable: null,
  },
  {
    type: "typeof",
    mode: "strict",
    variable: null,
  },
];

/**
 * @type {import("../../../header").Header[]}
 */
const SLOPPY_DYNAMIC_LOOKUP_HEADER_ENUM = [
  {
    type: "read",
    mode: "sloppy",
    variable: null,
  },
  {
    type: "write",
    mode: "sloppy",
    variable: null,
  },
  {
    type: "typeof",
    mode: "sloppy",
    variable: null,
  },
  {
    type: "discard",
    mode: "sloppy",
    variable: null,
  },
];

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   context: import("../../../context").RootContext,
 * ) => import("../../../header").Header[]}
 */
const listDynamicHeader = (mode, context) => {
  if (
    context.source === "module" ||
    context.source === "script" ||
    context.source === "global-eval"
  ) {
    return [
      IMPORT_DYNAMIC_HEADER,
      ...(context.source === "module" ? [IMPORT_META_HEADER] : []),
      ...(context.scope === "alien" ? STRICT_DYNAMIC_LOOKUP_HEADER_ENUM : []),
      ...(context.scope === "alien" && mode === "sloppy"
        ? SLOPPY_DYNAMIC_LOOKUP_HEADER_ENUM
        : []),
    ];
  } else if (context.source === "local-eval") {
    return [
      ...map(context.scope, (parameter) => ({
        type: parameter,
        mode: null,
      })),
      ...STRICT_DYNAMIC_LOOKUP_HEADER_ENUM,
      ...(mode === "sloppy" ? SLOPPY_DYNAMIC_LOOKUP_HEADER_ENUM : []),
    ];
  } else {
    throw new AranTypeError(context);
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
    if (frame.context.source === "module") {
      return makePrimitiveExpression({ undefined: null }, path);
    } else if (
      frame.context.source === "script" ||
      frame.context.source === "global-eval"
    ) {
      return makeIntrinsicExpression("globalThis", path);
    } else if (frame.context.source === "local-eval") {
      return makeStraightParameterExpression(operation.mode, "this", path);
    } else {
      throw new AranTypeError(frame.context);
    }
  } else if (operation.type === "read-import-meta") {
    if (
      frame.context.source === "module" ||
      (frame.context.source === "local-eval" &&
        includes(frame.context.scope, "import.meta"))
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
      frame.context.source === "local-eval" &&
      includes(frame.context.scope, "new.target")
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
      frame.context.source === "local-eval" &&
      includes(frame.context.scope, "super.get")
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
    if (frame.context.source === "local-eval") {
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
      map(listDynamicHeader(operation.mode, frame.context), makeHeaderPrelude),
      makeEvalExpression(makeReadCacheExpression(operation.code, path), path),
    );
  } else if (operation.type === "wrap-result") {
    return makeEarlyErrorExpression("Illegal return statement", path);
  } else if (operation.type === "read-error") {
    throw new AranError("Missing catch frame", operation);
  } else if (operation.type === "read-input") {
    throw new AranError("Missing closure frame", operation);
  } else if (
    operation.type === "has-template" ||
    operation.type === "get-template"
  ) {
    throw new AranError("Missing template frame", operation);
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
      frame.context.source === "local-eval" &&
      includes(frame.context.scope, "super.call")
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
      frame.context.source === "local-eval" &&
      includes(frame.context.scope, "super.set")
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
    if (frame.context.source === "local-eval") {
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
  } else if (operation.type === "set-template") {
    throw new AranError("Missing template frame", operation);
  } else {
    throw new AranTypeError(operation);
  }
};
