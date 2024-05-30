import { AranTypeError } from "../../../error.mjs";
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
import { isHoistWritable } from "../../query/index.mjs";
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
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<import("../../atom").Atom>}
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
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<import("../../atom").Atom>}
 */
export const makeGlobalBelongExpression = ({ path }, { variable }) =>
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
 *   site: import("../../site").LeafSite,
 *   writable: boolean | null,
 *   operation: (
 *     | import("../operation").ReadOperation
 *     | import("../operation").TypeofOperation
 *     | import("../operation").DiscardOperation
 *     | import("../operation").WriteOperation
 *     | import("../operation").InitializeOperation
 *   ),
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").MetaDeclarationPrelude,
 *   aran.Expression<import("../../atom").Atom>,
 * >}
 */
export const makeRecordLookupExpression = (
  { path, meta },
  writable,
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
    if (writable === null) {
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
          makeThrowDeadzoneExpression(operation.variable, path),
          makeConditionalExpression(
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
          ),
          path,
        ),
      );
    } else if (writable === true) {
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
          makeThrowDeadzoneExpression(operation.variable, path),
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
          path,
        ),
      );
    } else if (writable === false) {
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
          makeThrowDeadzoneExpression(operation.variable, path),
          makeThrowConstantExpression(operation.variable, path),
          path,
        ),
      );
    } else {
      throw new AranTypeError(writable);
    }
  } else if (operation.type === "initialize") {
    if (operation.kind === "let" || operation.kind === "const") {
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
                writable: operation.kind !== "const",
                configurable: false,
                enumerable: true,
              },
              path,
            ),
          ],
          path,
        ),
      );
    } else if (operation.kind === "var" || operation.kind === "val") {
      return zeroSequence(
        makeThrowDuplicateExpression(operation.variable, path),
      );
    } else {
      throw new AranTypeError(operation.kind);
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
 * ) => aran.Expression<import("../../atom").Atom>}
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
 *   operation: import("../../query/hoist").DeclareHoist,
 *   configurable: boolean,
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   [
 *     estree.Variable,
 *     import(".").ReifyBinding,
 *   ],
 * >}
 */
const declare = ({ path }, hoist, configurable) => {
  const writable = isHoistWritable(hoist);
  if (hoist.kind === "let" || hoist.kind === "const") {
    return initSequence(
      [
        makeEarlyErrorPrelude(
          makeDuplicateEarlyError("aran.record", hoist.variable, path),
        ),
        makePrefixPrelude(
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.set", path),
              makeIntrinsicExpression("undefined", path),
              [
                makeIntrinsicExpression("aran.record", path),
                makePrimitiveExpression(hoist.variable, path),
                makeIntrinsicExpression("aran.deadzone", path),
              ],
              path,
            ),
            path,
          ),
        ),
      ],
      [hoist.variable, { type: "reify", record: "aran.record", writable }],
    );
  } else if (hoist.kind === "var" || hoist.kind === "val") {
    return initSequence(
      [
        makeEarlyErrorPrelude(
          makeDuplicateEarlyError("aran.global", hoist.variable, path),
        ),
        makePrefixPrelude(
          makeConditionalEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Object.hasOwn", path),
              makeIntrinsicExpression("undefined", path),
              [
                makeIntrinsicExpression("aran.global", path),
                makePrimitiveExpression(hoist.variable, path),
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
                    makePrimitiveExpression(hoist.variable, path),
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
      [hoist.variable, { type: "reify", record: "aran.global", writable }],
    );
  } else {
    throw new AranTypeError(hoist.kind);
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
 * ) => aran.Expression<import("../../atom").Atom>}
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
 *   hoist: import("../../query/hoist").DeclareHoist,
 *   mode: "strict" | "sloppy",
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   [
 *     estree.Variable,
 *     import(".").ReifyBinding
 *   ],
 * >}
 */
export const setupReifyEntry = ({ path }, hoist, _mode) =>
  declare({ path }, hoist, false);

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
 *   aran.Effect<import("../../atom").Atom>[],
 * >}
 */
export const makeReifySaveEffect = ({ path, meta }, binding, operation) => {
  if (operation.type === "declare") {
    return incorporatePrefixEffect(
      thenSequence(
        declare(
          { path },
          {
            type: "declare",
            kind: "var",
            variable: operation.variable,
          },
          operation.configurable,
        ),
        EMPTY_SEQUENCE,
      ),
      path,
    );
  } else if (operation.type === "initialize") {
    if (binding === null || binding.record === "aran.global") {
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
    } else if (binding.record === "aran.record") {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          makeRecordLookupExpression(
            { path, meta },
            binding.writable,
            operation,
          ),
          path,
        ),
      );
    } else {
      throw new AranTypeError(binding.record);
    }
  } else if (operation.type === "write") {
    // We can't assume binding remained in the global object:
    // > global.x = 123;
    // > var x = 456;
    // > delete x; >> true
    // > "x" in global >> false
    if (binding === null || binding.record === "aran.global") {
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
    } else if (binding.record === "aran.record") {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          makeRecordLookupExpression(
            { path, meta },
            binding.writable,
            operation,
          ),
          path,
        ),
      );
    } else {
      throw new AranTypeError(binding.record);
    }
  } else {
    throw new AranTypeError();
  }
};

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   binding: null | import(".").ReifyBinding,
 *   operation: import("../operation").VariableLoadOperation,
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").MetaDeclarationPrelude,
 *   aran.Expression<import("../../atom").Atom>,
 * >}
 */
export const makeReifyLoadExpression = ({ path, meta }, binding, operation) => {
  // We can't assume binding remained in the global object:
  // > global.x = 123;
  // > var x = 456;
  // > delete x; >> true
  // > "x" in global >> false
  if (binding === null || binding.record === "aran.global") {
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
  } else if (binding.record === "aran.record") {
    return makeRecordLookupExpression(
      { path, meta },
      binding.writable,
      operation,
    );
  } else {
    throw new AranTypeError(binding.record);
  }
};
