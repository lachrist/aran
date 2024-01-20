import { AranTypeError } from "../../../error.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../cache.mjs";
import {
  makeBinaryExpression,
  makeDataDescriptorExpression,
  makeUnaryExpression,
} from "../../intrinsic.mjs";
import {
  EMPTY_EFFECT,
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
import {
  bindSequence,
  bindThreeSequence,
  bindTwoSequence,
  initSequence,
  sequenceExpression,
  thenSequence,
} from "../../sequence.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
  makeThrowDuplicateExpression,
  makeThrowMissingExpression,
  reportDuplicate,
} from "../error.mjs";
import { makeEarlyErrorPrelude, makeEffectPrelude } from "../../prelude.mjs";
import { map } from "../../../util/index.mjs";
import { isHoistWritable } from "../../query/index.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   operation: {
 *     variable: estree.Variable,
 *   },
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeRecordBelongExpression = ({ path }, { variable }) =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.has", path),
    makePrimitiveExpression({ undefined: null }, path),
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
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeGlobalBelongExpression = ({ path }, { variable }) =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.has", path),
    makePrimitiveExpression({ undefined: null }, path),
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
 *     | import("..").ReadOperation
 *     | import("..").TypeofOperation
 *     | import("..").DiscardOperation
 *     | import("..").WriteOperation
 *     | import("..").InitializeOperation
 *   ),
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeRecordLookupExpression = (
  { path, meta },
  writable,
  operation,
) => {
  if (operation.type === "read") {
    return bindSequence(
      cacheConstant(
        meta,
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.get", path),
          makePrimitiveExpression({ undefined: null }, path),
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
    );
  } else if (operation.type === "typeof") {
    return bindSequence(
      cacheConstant(
        meta,
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.get", path),
          makePrimitiveExpression({ undefined: null }, path),
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
    );
  } else if (operation.type === "discard") {
    return makePrimitiveExpression(false, path);
  } else if (operation.type === "write") {
    if (writable === null) {
      return bindSequence(
        cacheConstant(
          meta,
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.get", path),
            makePrimitiveExpression({ undefined: null }, path),
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
            makeConditionalExpression(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.set", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeIntrinsicExpression("aran.record", path),
                  makePrimitiveExpression(operation.variable, path),
                  makeReadCacheExpression(operation.right, path),
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
      return bindSequence(
        cacheConstant(
          meta,
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.get", path),
            makePrimitiveExpression({ undefined: null }, path),
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
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.set", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeIntrinsicExpression("aran.record", path),
                makePrimitiveExpression(operation.variable, path),
                makeReadCacheExpression(operation.right, path),
              ],
              path,
            ),
            path,
          ),
      );
    } else if (writable === false) {
      return makeConditionalExpression(
        makeBinaryExpression(
          "===",
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.get", path),
            makePrimitiveExpression({ undefined: null }, path),
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
      );
    } else {
      throw new AranTypeError(writable);
    }
  } else if (operation.type === "initialize") {
    if (operation.kind === "const") {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.defineProperty", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeIntrinsicExpression("aran.record", path),
          makePrimitiveExpression(operation.variable, path),
          makeDataDescriptorExpression(
            {
              value:
                operation.right === null
                  ? makePrimitiveExpression({ undefined: null }, path)
                  : makeReadCacheExpression(operation.right, path),
              writable: operation.kind !== "const",
              configurable: true,
              enumerable: true,
            },
            path,
          ),
        ],
        path,
      );
    } else if (operation.kind === "let") {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.set", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeIntrinsicExpression("aran.record", path),
          makePrimitiveExpression(operation.variable, path),
          operation.right === null
            ? makePrimitiveExpression({ undefined: null }, path)
            : makeReadCacheExpression(operation.right, path),
        ],
        path,
      );
    } else if (operation.kind === "var" || operation.kind === "val") {
      return makeThrowDuplicateExpression(operation.variable, path);
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
 *     | import("..").ReadOperation
 *     | import("..").TypeofOperation
 *     | import("..").DiscardOperation
 *     | import("..").WriteOperation
 *   ),
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeGlobalLookupExpression = ({ path }, operation) => {
  if (operation.type === "read") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.get", path),
      makePrimitiveExpression({ undefined: null }, path),
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
        makePrimitiveExpression({ undefined: null }, path),
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
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeIntrinsicExpression("aran.global", path),
        makePrimitiveExpression(operation.variable, path),
      ],
      path,
    );
  } else if (operation.type === "write") {
    if (operation.right === null) {
      return makePrimitiveExpression(true, path);
    } else {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.set", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeIntrinsicExpression("aran.global", path),
          makePrimitiveExpression(operation.variable, path),
          makeReadCacheExpression(operation.right, path),
        ],
        path,
      );
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
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").NodePrelude,
 *   [
 *     estree.Variable,
 *     import(".").ReifyBinding,
 *   ],
 * >}
 */
const declare = ({ path }, hoist, configurable) => {
  const writable = isHoistWritable(hoist);
  if (hoist.kind === "let" || hoist.kind === "const") {
    return bindThreeSequence(
      sequenceExpression(makeRecordBelongExpression({ path }, hoist)),
      sequenceExpression(
        makeConditionalExpression(
          makeApplyExpression(
            makeIntrinsicExpression("Object.hasOwn", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeIntrinsicExpression("aran.global", path),
              makePrimitiveExpression(hoist.variable, path),
            ],
            path,
          ),
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.get", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeApplyExpression(
                makeIntrinsicExpression(
                  "Reflect.getOwnPropertyDescriptor",
                  path,
                ),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeIntrinsicExpression("aran.global", path),
                  makePrimitiveExpression(hoist.variable, path),
                ],
                path,
              ),
              makePrimitiveExpression("configurable", path),
            ],
            path,
          ),
          makePrimitiveExpression(false, path),
          path,
        ),
      ),
      makeExpressionEffect(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.defineProperty", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeIntrinsicExpression("aran.record", path),
            makePrimitiveExpression(hoist.variable, path),
            makeDataDescriptorExpression(
              {
                value: makeIntrinsicExpression("aran.deadzone", path),
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
      (guard1, guard2, declare) =>
        initSequence(
          [
            makeEarlyErrorPrelude({
              guard: guard1,
              message: reportDuplicate(hoist.variable),
              path,
            }),
            makeEarlyErrorPrelude({
              guard: guard2,
              message: reportDuplicate(hoist.variable),
              path,
            }),
            ...map(declare, makeEffectPrelude),
          ],
          [hoist.variable, { type: "reify", record: "aran.record", writable }],
        ),
    );
  } else if (hoist.kind === "var" || hoist.kind === "val") {
    return bindTwoSequence(
      sequenceExpression(makeRecordBelongExpression({ path }, hoist)),
      makeConditionalEffect(
        makeApplyExpression(
          makeIntrinsicExpression("Object.hasOwn", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeIntrinsicExpression("aran.global", path),
            makePrimitiveExpression(hoist.variable, path),
          ],
          path,
        ),
        EMPTY_EFFECT,
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.defineProperty", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeIntrinsicExpression("aran.record", path),
              makePrimitiveExpression(hoist.variable, path),
              makeDataDescriptorExpression(
                {
                  value: makePrimitiveExpression({ undefined: null }, path),
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
        path,
      ),
      (guard, declare) =>
        initSequence(
          [
            makeEarlyErrorPrelude({
              guard,
              message: reportDuplicate(hoist.variable),
              path,
            }),
            ...map(declare, makeEffectPrelude),
          ],
          [hoist.variable, { type: "reify", record: "aran.global", writable }],
        ),
    );
  } else {
    throw new AranTypeError(hoist.kind);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   operation: (
 *     | import("..").ReadOperation
 *     | import("..").TypeofOperation
 *     | import("..").DiscardOperation
 *     | import("..").WriteOperation
 *   ),
 * ) => import("../../sequence").ExpressionSequence}
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
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeIntrinsicExpression("aran.global", path),
          makePrimitiveExpression(operation.variable, path),
          makeReadCacheExpression(operation.right, path),
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
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").NodePrelude,
 *   [
 *     estree.Variable,
 *     import(".").ReifyBinding
 *   ],
 * >}
 */
export const setupReifyEntry = ({ path }, hoist, _mode) =>
  declare({ path }, hoist, false);

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   binding: null | import(".").ReifyBinding,
 *   operation: import("..").VariableSaveOperation,
 * ) => import("../../sequence").EffectSequence}
 */
export const makeReifySaveEffect = ({ path, meta }, binding, operation) => {
  if (operation.type === "declare") {
    return thenSequence(
      declare({ path }, operation, operation.configurable),
      EMPTY_EFFECT,
    );
  } else if (operation.type === "initialize") {
    if (binding === null || binding.record === "aran.global") {
      if (operation.right !== null) {
        /** @type {import("..").WriteOperation} */
        const forgery = {
          type: "write",
          mode: operation.mode,
          variable: operation.variable,
          right: operation.right,
        };
        return makeExpressionEffect(
          makeConditionalExpression(
            makeRecordBelongExpression({ path }, forgery),
            makeRecordLookupExpression({ path, meta }, null, forgery),
            makeConditionalExpression(
              makeGlobalBelongExpression({ path }, forgery),
              makeGlobalLookupExpression({ path }, forgery),
              makeMissingLookupExpression({ path }, forgery),
              path,
            ),
            path,
          ),
          path,
        );
      } else {
        return EMPTY_EFFECT;
      }
    } else if (binding.record === "aran.record") {
      return makeExpressionEffect(
        makeRecordLookupExpression({ path, meta }, binding.writable, operation),
        path,
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
      return makeExpressionEffect(
        makeConditionalExpression(
          makeRecordBelongExpression({ path }, operation),
          makeRecordLookupExpression({ path, meta }, null, operation),
          makeConditionalExpression(
            makeGlobalBelongExpression({ path }, operation),
            makeGlobalLookupExpression({ path }, operation),
            makeMissingLookupExpression({ path }, operation),
            path,
          ),
          path,
        ),
        path,
      );
    } else if (binding.record === "aran.record") {
      return makeExpressionEffect(
        makeRecordLookupExpression({ path, meta }, binding.writable, operation),
        path,
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
 *   operation: import("..").VariableLoadOperation,
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeReifyLoadExpression = ({ path, meta }, binding, operation) => {
  // We can't assume binding remained in the global object:
  // > global.x = 123;
  // > var x = 456;
  // > delete x; >> true
  // > "x" in global >> false
  if (binding === null || binding.record === "aran.global") {
    return makeConditionalExpression(
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
