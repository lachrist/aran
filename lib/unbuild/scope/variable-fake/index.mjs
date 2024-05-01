import { AranTypeError } from "../../../error.mjs";
import {
  pairup,
  hasOwn,
  reduceEntry,
  map,
  concat_,
} from "../../../util/index.mjs";
import {
  cacheWritable,
  makeWriteCacheEffect,
  makeReadCacheExpression,
} from "../../cache.mjs";
import {
  makeRegularEarlyError,
  makeEarlyErrorExpression,
} from "../../early-error.mjs";
import { makeBinaryExpression, makeUnaryExpression } from "../../intrinsic.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";
import {
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
import {
  EMPTY_SEQUENCE,
  flatSequence,
  liftSequenceX,
  liftSequenceX_,
  mapSequence,
  zeroSequence,
} from "../../sequence.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
  reportDuplicate,
} from "../error.mjs";

/**
 * @type {(
 *   kind: import(".").FakeKind,
 * ) => aran.Intrinsic}
 */
const getInitializer = (kind) => {
  if (kind === "var" || kind === "val") {
    return "undefined";
  } else if (kind === "let" || kind === "const") {
    return "aran.deadzone";
  } else {
    throw new AranTypeError(kind);
  }
};

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   hoist: import(".").FakeHoist,
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").MetaDeclarationPrelude,
 *   [
 *     estree.Variable,
 *     import(".").FakeBinding,
 *   ],
 * >}
 */
const setupBinding = ({ meta }, { variable, kind }) =>
  mapSequence(cacheWritable(meta, getInitializer(kind)), (proxy) =>
    pairup(variable, {
      kind,
      proxy,
    }),
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: import("../../meta").Meta,
 *   },
 *   hoisting: import(".").FakeHoist[],
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").MetaDeclarationPrelude,
 *   import(".").FakeFrame
 * >}
 */
export const setupFakeFrame = ({ path, meta }, entries) =>
  mapSequence(
    flatSequence(
      map(entries, (entry) =>
        setupBinding({ path, meta: forkMeta((meta = nextMeta(meta))) }, entry),
      ),
    ),
    (entries) => ({
      type: "fake",
      record: reduceEntry(entries),
    }),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").FakeBinding,
 *   operation: import("../operation").VariableSaveOperation,
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").EarlyErrorPrelude,
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
const listBindingSaveEffect = ({ path }, binding, operation) => {
  if (operation.type === "initialize") {
    if (binding.kind !== operation.kind) {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          makeEarlyErrorExpression(
            makeRegularEarlyError(reportDuplicate(operation.variable), path),
          ),
          path,
        ),
      );
    } else {
      if (binding.kind === "let" || binding.kind === "const") {
        return zeroSequence([
          makeWriteCacheEffect(
            binding.proxy,
            operation.right === null
              ? makeIntrinsicExpression("undefined", path)
              : operation.right,
            path,
          ),
        ]);
      } else if (binding.kind === "var" || binding.kind === "val") {
        if (operation.right === null) {
          return EMPTY_SEQUENCE;
        } else {
          return zeroSequence([
            makeWriteCacheEffect(binding.proxy, operation.right, path),
          ]);
        }
      } else {
        throw new AranTypeError(binding.kind);
      }
    }
  } else if (operation.type === "write") {
    if (binding.kind === "let" || binding.kind === "const") {
      return zeroSequence([
        makeConditionalEffect(
          makeBinaryExpression(
            "===",
            makeReadCacheExpression(binding.proxy, path),
            makeIntrinsicExpression("aran.deadzone", path),
            path,
          ),
          binding.kind === "const"
            ? [
                makeExpressionEffect(
                  makeThrowDeadzoneExpression(operation.variable, path),
                  path,
                ),
              ]
            : [makeWriteCacheEffect(binding.proxy, operation.right, path)],
          [
            makeExpressionEffect(
              makeThrowConstantExpression(operation.variable, path),
              path,
            ),
          ],
          path,
        ),
      ]);
    } else if (binding.kind === "var") {
      return zeroSequence([
        makeWriteCacheEffect(binding.proxy, operation.right, path),
      ]);
    } else if (binding.kind === "val") {
      if (operation.mode === "strict") {
        return zeroSequence([
          makeExpressionEffect(
            makeThrowConstantExpression(operation.variable, path),
            path,
          ),
        ]);
      } else if (operation.mode === "sloppy") {
        return EMPTY_SEQUENCE;
      } else {
        throw new AranTypeError(operation.mode);
      }
    } else {
      throw new AranTypeError(binding.kind);
    }
  } else if (operation.type === "declare") {
    return liftSequenceX(
      concat_,
      liftSequenceX_(
        makeExpressionEffect,
        makeEarlyErrorExpression(
          makeRegularEarlyError(reportDuplicate(operation.variable), path),
        ),
        path,
      ),
    );
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").FakeFrame,
 *   operation: import("../operation").VariableSaveOperation
 * ) => null | import("../../sequence").Sequence<
 *   import("../../prelude").EarlyErrorPrelude,
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
export const listFakeSaveEffect = ({ path }, frame, operation) => {
  if (hasOwn(frame.record, operation.variable)) {
    return listBindingSaveEffect(
      { path },
      frame.record[operation.variable],
      operation,
    );
  } else {
    return null;
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").FakeBinding,
 *   operation: import("../operation").VariableLoadOperation,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeBindingLoadExpression = ({ path }, binding, operation) => {
  if (operation.type === "read") {
    if (binding.kind === "let" || binding.kind === "const") {
      return makeConditionalExpression(
        makeBinaryExpression(
          "===",
          makeReadCacheExpression(binding.proxy, path),
          makeIntrinsicExpression("aran.deadzone", path),
          path,
        ),
        makeThrowDeadzoneExpression(operation.variable, path),
        makeReadCacheExpression(binding.proxy, path),
        path,
      );
    } else if (binding.kind === "var" || binding.kind === "val") {
      return makeReadCacheExpression(binding.proxy, path);
    } else {
      throw new AranTypeError(binding.kind);
    }
  } else if (operation.type === "typeof") {
    if (binding.kind === "let" || binding.kind === "const") {
      return makeConditionalExpression(
        makeBinaryExpression(
          "===",
          makeReadCacheExpression(binding.proxy, path),
          makeIntrinsicExpression("aran.deadzone", path),
          path,
        ),
        makeThrowDeadzoneExpression(operation.variable, path),
        makeUnaryExpression(
          "typeof",
          makeReadCacheExpression(binding.proxy, path),
          path,
        ),
        path,
      );
    } else if (binding.kind === "var" || binding.kind === "val") {
      return makeUnaryExpression(
        "typeof",
        makeReadCacheExpression(binding.proxy, path),
        path,
      );
    } else {
      throw new AranTypeError(binding.kind);
    }
  } else if (operation.type === "discard") {
    return makePrimitiveExpression(false, path);
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").FakeFrame,
 *   operation: import("../operation").VariableLoadOperation,
 * ) => null | import("../../sequence").Sequence<
 *   never,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const makeFakeLookupExpression = ({ path }, frame, operation) => {
  if (hasOwn(frame.record, operation.variable)) {
    return zeroSequence(
      makeBindingLoadExpression(
        { path },
        frame.record[operation.variable],
        operation,
      ),
    );
  } else {
    return null;
  }
};
