import { AranError, AranTypeError } from "../../../error.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../cache.mjs";
import {
  makeBinaryExpression,
  makeDataDescriptorExpression,
  makeUnaryExpression,
} from "../../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  initSequence,
  liftSequenceX,
  liftSequenceX_,
  liftSequence_X__,
  mapSequence,
  thenSequence,
  zeroSequence,
} from "../../../sequence.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
  makeThrowDuplicateExpression,
  makeThrowMissingExpression,
} from "../error.mjs";
import { makeEarlyErrorPrelude, makePrefixPrelude } from "../../prelude.mjs";
import { EMPTY, concat_ } from "../../../util/index.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";
import {
  incorporatePrefixEffect,
  incorporatePrefixExpression,
} from "../../prefix.mjs";
import { makeDuplicateEarlyError } from "../../early-error.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   operation: {
 *     variable: import("../../../estree").Variable,
 *   },
 * ) => import("../../atom").Expression}
 */
export const makeRecordBelongExpression = ({ path }, { variable }) =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.has", path),
    makeIntrinsicExpression("undefined", path),
    [
      makeIntrinsicExpression("aran.record", path),
      makePrimitiveExpression(variable, path),
    ],
    path,
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   operation: {
 *     variable: import("../../../estree").Variable,
 *   },
 * ) => import("../../atom").Expression}
 */
const makeGlobalBelongExpression = ({ path }, { variable }) =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.has", path),
    makeIntrinsicExpression("undefined", path),
    [
      makeIntrinsicExpression("aran.global", path),
      makePrimitiveExpression(variable, path),
    ],
    path,
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   write: "unknown" | "report" | "perform",
 *   operation: import("../operation").WriteOperation,
 * ) => import("../../atom").Expression}
 */
const makeRecordAliveWriteExpression = ({ path }, write, operation) => {
  switch (write) {
    case "unknown": {
      return makeConditionalExpression(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.set", path),
          makeIntrinsicExpression("undefined", path),
          [
            makeIntrinsicExpression("aran.record", path),
            makePrimitiveExpression(operation.variable, path),
            operation.right,
          ],
          path,
        ),
        makePrimitiveExpression(true, path),
        makeThrowConstantExpression(operation.variable, path),
        path,
      );
    }
    case "perform": {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.set", path),
        makeIntrinsicExpression("undefined", path),
        [
          makeIntrinsicExpression("aran.record", path),
          makePrimitiveExpression(operation.variable, path),
          operation.right,
        ],
        path,
      );
    }
    case "report": {
      return makeThrowConstantExpression(operation.variable, path);
    }
    default: {
      throw new AranTypeError(write);
    }
  }
};

/**
 * @type {(
 *   write: "report" | "perform",
 * ) => boolean}
 */
const toWritable = (write) => {
  switch (write) {
    case "perform": {
      return true;
    }
    case "report": {
      return false;
    }
    default: {
      throw new AranTypeError(write);
    }
  }
};

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   binding: null | import(".").ReifyBinding,
 *   operation: (
 *     | import("../operation").ReadOperation
 *     | import("../operation").TypeofOperation
 *     | import("../operation").DiscardOperation
 *     | import("../operation").WriteOperation
 *     | import("../operation").InitializeOperation
 *   ),
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").MetaDeclarationPrelude,
 *   import("../../atom").Expression,
 * >}
 */
export const makeRecordLookupExpression = (
  { path, meta },
  binding,
  operation,
) => {
  if (operation.type === "read") {
    return incorporatePrefixExpression(
      mapSequence(
        cacheConstant(
          meta,
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.get", path),
            makeIntrinsicExpression("undefined", path),
            [
              makeIntrinsicExpression("aran.record", path),
              makePrimitiveExpression(operation.variable, path),
            ],
            path,
          ),
          path,
        ),
        (result) =>
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeReadCacheExpression(result, path),
              makeIntrinsicExpression("aran.deadzone", path),
              path,
            ),
            makeThrowDeadzoneExpression(operation.variable, path),
            makeReadCacheExpression(result, path),
            path,
          ),
      ),
      path,
    );
  } else if (operation.type === "typeof") {
    return incorporatePrefixExpression(
      mapSequence(
        cacheConstant(
          meta,
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.get", path),
            makeIntrinsicExpression("undefined", path),
            [
              makeIntrinsicExpression("aran.record", path),
              makePrimitiveExpression(operation.variable, path),
            ],
            path,
          ),
          path,
        ),
        (result) =>
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeReadCacheExpression(result, path),
              makeIntrinsicExpression("aran.deadzone", path),
              path,
            ),
            makeThrowDeadzoneExpression(operation.variable, path),
            makeUnaryExpression(
              "typeof",
              makeReadCacheExpression(result, path),
              path,
            ),
            path,
          ),
      ),
      path,
    );
  } else if (operation.type === "discard") {
    return zeroSequence(makePrimitiveExpression(false, path));
  } else if (operation.type === "write") {
    return zeroSequence(
      makeConditionalExpression(
        makeBinaryExpression(
          "===",
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.get", path),
            makeIntrinsicExpression("undefined", path),
            [
              makeIntrinsicExpression("aran.record", path),
              makePrimitiveExpression(operation.variable, path),
            ],
            path,
          ),
          makeIntrinsicExpression("aran.deadzone", path),
          path,
        ),
        makeRecordAliveWriteExpression(
          { path },
          binding === null ? "unknown" : binding.write,
          operation,
        ),
        makeThrowConstantExpression(operation.variable, path),
        path,
      ),
    );
  } else if (operation.type === "initialize") {
    if (binding === null) {
      throw new AranError("Missing binding for initialize operation", {
        path,
        operation,
      });
    } else {
      switch (binding.frame) {
        case "record": {
          return zeroSequence(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.defineProperty", path),
              makeIntrinsicExpression("undefined", path),
              [
                makeIntrinsicExpression("aran.record", path),
                makePrimitiveExpression(operation.variable, path),
                makeDataDescriptorExpression(
                  {
                    value:
                      operation.right !== null
                        ? operation.right
                        : makeIntrinsicExpression("undefined", path),
                    writable: toWritable(binding.write),
                    configurable: false,
                    enumerable: true,
                  },
                  path,
                ),
              ],
              path,
            ),
          );
        }
        case "global": {
          return zeroSequence(
            makeThrowDuplicateExpression(operation.variable, path),
          );
        }
        default: {
          throw new AranTypeError(binding.frame);
        }
      }
    }
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   operation: (
 *     | import("../operation").ReadOperation
 *     | import("../operation").TypeofOperation
 *     | import("../operation").DiscardOperation
 *     | import("../operation").WriteOperation
 *   ),
 * ) => import("../../atom").Expression}
 */
const makeGlobalLookupExpression = ({ path }, operation) => {
  if (operation.type === "read") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.get", path),
      makeIntrinsicExpression("undefined", path),
      [
        makeIntrinsicExpression("aran.global", path),
        makePrimitiveExpression(operation.variable, path),
      ],
      path,
    );
  } else if (operation.type === "typeof") {
    return makeUnaryExpression(
      "typeof",
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.get", path),
        makeIntrinsicExpression("undefined", path),
        [
          makeIntrinsicExpression("aran.global", path),
          makePrimitiveExpression(operation.variable, path),
        ],
        path,
      ),
      path,
    );
  } else if (operation.type === "discard") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.deleteProperty", path),
      makeIntrinsicExpression("undefined", path),
      [
        makeIntrinsicExpression("aran.global", path),
        makePrimitiveExpression(operation.variable, path),
      ],
      path,
    );
  } else if (operation.type === "write") {
    if (operation.right !== null) {
      const perform = makeApplyExpression(
        makeIntrinsicExpression("Reflect.set", path),
        makeIntrinsicExpression("undefined", path),
        [
          makeIntrinsicExpression("aran.global", path),
          makePrimitiveExpression(operation.variable, path),
          operation.right,
        ],
        path,
      );
      switch (operation.mode) {
        case "strict": {
          return makeConditionalExpression(
            perform,
            makePrimitiveExpression(true, path),
            makeThrowConstantExpression(operation.variable, path),
            path,
          );
        }
        case "sloppy": {
          return perform;
        }
        default: {
          throw new AranTypeError(operation.mode);
        }
      }
    } else {
      return makePrimitiveExpression(true, path);
    }
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: {
 *     baseline: "undefined" | "deadzone",
 *     variable: import("../../../estree").Variable,
 *     write: "perform" | "report",
 *   },
 *   configurable: boolean,
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   [
 *     import("../../../estree").Variable,
 *     import(".").ReifyBinding,
 *   ],
 * >}
 */
const declare = ({ path }, { baseline, variable, write }, configurable) => {
  const writable = toWritable(write);
  switch (baseline) {
    case "deadzone": {
      return initSequence(
        [
          makeEarlyErrorPrelude(
            makeDuplicateEarlyError("aran.record", variable, path),
          ),
          makePrefixPrelude(
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.set", path),
                makeIntrinsicExpression("undefined", path),
                [
                  makeIntrinsicExpression("aran.record", path),
                  makePrimitiveExpression(variable, path),
                  makeIntrinsicExpression("aran.deadzone", path),
                ],
                path,
              ),
              path,
            ),
          ),
        ],
        [variable, { type: "reify", frame: "record", write }],
      );
    }
    case "undefined": {
      return initSequence(
        [
          makeEarlyErrorPrelude(
            makeDuplicateEarlyError("aran.global", variable, path),
          ),
          makePrefixPrelude(
            makeConditionalEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Object.hasOwn", path),
                makeIntrinsicExpression("undefined", path),
                [
                  makeIntrinsicExpression("aran.global", path),
                  makePrimitiveExpression(variable, path),
                ],
                path,
              ),
              EMPTY,
              [
                makeExpressionEffect(
                  makeApplyExpression(
                    makeIntrinsicExpression("Reflect.defineProperty", path),
                    makeIntrinsicExpression("undefined", path),
                    [
                      makeIntrinsicExpression("aran.global", path),
                      makePrimitiveExpression(variable, path),
                      makeDataDescriptorExpression(
                        {
                          value: makeIntrinsicExpression("undefined", path),
                          writable,
                          configurable,
                          enumerable: true,
                        },
                        path,
                      ),
                    ],
                    path,
                  ),
                  path,
                ),
              ],
              path,
            ),
          ),
        ],
        [variable, { type: "reify", frame: "global", write }],
      );
    }
    default: {
      throw new AranTypeError(baseline);
    }
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   operation: (
 *     | import("../operation").ReadOperation
 *     | import("../operation").TypeofOperation
 *     | import("../operation").DiscardOperation
 *     | import("../operation").WriteOperation
 *   ),
 * ) => import("../../atom").Expression}
 */
export const makeMissingLookupExpression = ({ path }, operation) => {
  if (operation.type === "read") {
    return makeThrowMissingExpression(operation.variable, path);
  } else if (operation.type === "typeof") {
    return makePrimitiveExpression("undefined", path);
  } else if (operation.type === "discard") {
    return makePrimitiveExpression(true, path);
  } else if (operation.type === "write") {
    if (operation.mode === "strict") {
      return makeThrowMissingExpression(operation.variable, path);
    } else if (operation.mode === "sloppy") {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.set", path),
        makeIntrinsicExpression("undefined", path),
        [
          makeIntrinsicExpression("aran.global", path),
          makePrimitiveExpression(operation.variable, path),
          operation.right,
        ],
        path,
      );
    } else {
      throw new AranTypeError(operation.mode);
    }
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import("../../query/hoist-public").Binding,
 *   mode: "strict" | "sloppy",
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   [
 *     import("../../../estree").Variable,
 *     import(".").ReifyBinding
 *   ],
 * >}
 */
export const setupReifyEntry = (
  { path },
  { baseline, variable, write },
  _mode,
) => {
  if (baseline === "import") {
    throw new AranError("root frame does not support import binding", {
      baseline,
      variable,
      write,
    });
  } else if (baseline === "undefined" || baseline === "deadzone") {
    if (write === "ignore") {
      throw new AranError("root frame does not support silent constant", {
        baseline,
        variable,
        write,
      });
    } else if (write === "perform" || write === "report") {
      return declare({ path }, { baseline, variable, write }, false);
    } else {
      throw new AranTypeError(write);
    }
  } else {
    throw new AranTypeError(baseline);
  }
};

/**s
 * @type {(
 *   site: import("../../site").LeafSite,
 *   binding: null | import(".").ReifyBinding,
 *   operation: import("../operation").VariableSaveOperation,
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *   ),
 *   import("../../atom").Effect[],
 * >}
 */
export const makeReifySaveEffect = ({ path, meta }, binding, operation) => {
  if (operation.type === "late-declare") {
    return incorporatePrefixEffect(
      thenSequence(
        declare(
          { path },
          {
            baseline: "undefined",
            write: "perform",
            variable: operation.variable,
          },
          true,
        ),
        EMPTY_SEQUENCE,
      ),
      path,
    );
  } else if (operation.type === "initialize") {
    if (binding === null || binding.frame === "global") {
      if (operation.right === null) {
        return EMPTY_SEQUENCE;
      } else {
        return incorporatePrefixEffect(
          bindSequence(
            cacheConstant(
              forkMeta((meta = nextMeta(meta))),
              operation.right,
              path,
            ),
            (right) =>
              liftSequenceX(
                concat_,
                liftSequenceX_(
                  makeExpressionEffect,
                  liftSequence_X__(
                    makeConditionalExpression,
                    makeRecordBelongExpression(
                      { path },
                      { variable: operation.variable },
                    ),
                    makeRecordLookupExpression({ path, meta }, null, {
                      ...operation,
                      type: "write",
                      right: makeReadCacheExpression(right, path),
                    }),
                    makeConditionalExpression(
                      makeGlobalBelongExpression(
                        { path },
                        { variable: operation.variable },
                      ),
                      makeGlobalLookupExpression(
                        { path },
                        {
                          ...operation,
                          type: "write",
                          right: makeReadCacheExpression(right, path),
                        },
                      ),
                      makeMissingLookupExpression(
                        { path },
                        {
                          ...operation,
                          type: "write",
                          right: makeReadCacheExpression(right, path),
                        },
                      ),
                      path,
                    ),
                    path,
                  ),
                  path,
                ),
              ),
          ),
          path,
        );
      }
    } else if (binding.frame === "record") {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          makeRecordLookupExpression({ path, meta }, binding, operation),
          path,
        ),
      );
    } else {
      throw new AranTypeError(binding.frame);
    }
  } else if (operation.type === "write") {
    // We can't assume binding remained in the global object:
    // > global.x = 123;
    // > var x = 456;
    // > delete x; >> true
    // > "x" in global >> false
    if (binding === null || binding.frame === "global") {
      return incorporatePrefixEffect(
        bindSequence(
          cacheConstant(
            forkMeta((meta = nextMeta(meta))),
            operation.right,
            path,
          ),
          (right) =>
            liftSequenceX(
              concat_,
              liftSequenceX_(
                makeExpressionEffect,
                liftSequence_X__(
                  makeConditionalExpression,
                  makeRecordBelongExpression(
                    { path },
                    { variable: operation.variable },
                  ),
                  makeRecordLookupExpression({ path, meta }, null, {
                    ...operation,
                    right: makeReadCacheExpression(right, path),
                  }),
                  makeConditionalExpression(
                    makeGlobalBelongExpression(
                      { path },
                      { variable: operation.variable },
                    ),
                    makeGlobalLookupExpression(
                      { path },
                      {
                        ...operation,
                        right: makeReadCacheExpression(right, path),
                      },
                    ),
                    makeMissingLookupExpression(
                      { path },
                      {
                        ...operation,
                        right: makeReadCacheExpression(right, path),
                      },
                    ),
                    path,
                  ),
                  path,
                ),
                path,
              ),
            ),
        ),
        path,
      );
    } else if (binding.frame === "record") {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          makeRecordLookupExpression({ path, meta }, binding, operation),
          path,
        ),
      );
    } else {
      throw new AranTypeError(binding.frame);
    }
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   binding: null | import(".").ReifyBinding,
 *   operation: import("../operation").VariableLoadOperation,
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").MetaDeclarationPrelude,
 *   import("../../atom").Expression,
 * >}
 */
export const makeReifyLoadExpression = ({ path, meta }, binding, operation) => {
  // We can't assume binding remained in the global object:
  // > global.x = 123;
  // > var x = 456;
  // > delete x; >> true
  // > "x" in global >> false
  if (binding === null || binding.frame === "global") {
    return liftSequence_X__(
      makeConditionalExpression,
      makeRecordBelongExpression({ path }, operation),
      makeRecordLookupExpression({ path, meta }, null, operation),
      makeConditionalExpression(
        makeGlobalBelongExpression({ path }, operation),
        makeGlobalLookupExpression({ path }, operation),
        makeMissingLookupExpression({ path }, operation),
        path,
      ),
      path,
    );
  } else if (binding.frame === "record") {
    return makeRecordLookupExpression({ path, meta }, binding, operation);
  } else {
    throw new AranTypeError(binding.frame);
  }
};
