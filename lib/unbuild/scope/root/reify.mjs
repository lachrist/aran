import { AranError, AranTypeError } from "../../../error.mjs";
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

/** @type {Record<"let" | "const" | "class", "writable" | "constant">} */
const ACCESS = {
  let: "writable",
  const: "constant",
  class: "writable",
};

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
 *   access: (
 *     | "writable"
 *     | "constant"
 *     | "unknown"
 *   ),
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
  access,
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
    if (access === "unknown") {
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
    } else if (access === "writable") {
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
    } else if (access === "constant") {
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
      throw new AranTypeError(access);
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
    } else if (operation.kind === "let" || operation.kind === "class") {
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
    } else if (operation.kind === "var" || operation.kind === "function") {
      return makeThrowDuplicateExpression(operation.variable, path);
    } else if (operation.kind === "arguments" || operation.kind === "callee") {
      throw new AranError("unexpected root initialization kind", operation);
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
 * @type {<X>(
 *   site: import("../../site").VoidSite,
 *   operation: {
 *     type: "declare",
 *     mode: "strict" | "sloppy",
 *     kind: "var" | "eval" | "let" | "const",
 *     variable: estree.Variable,
 *   },
 *   result: X,
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").NodePrelude,
 *   X,
 * >}
 */
const declare = ({ path }, operation, result) => {
  if (operation.kind === "let" || operation.kind === "const") {
    return bindThreeSequence(
      sequenceExpression(makeRecordBelongExpression({ path }, operation)),
      sequenceExpression(
        makeConditionalExpression(
          makeApplyExpression(
            makeIntrinsicExpression("Object.hasOwn", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeIntrinsicExpression("aran.global", path),
              makePrimitiveExpression(operation.variable, path),
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
                  makePrimitiveExpression(operation.variable, path),
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
            makePrimitiveExpression(operation.variable, path),
            makeDataDescriptorExpression(
              {
                value: makeIntrinsicExpression("aran.deadzone", path),
                writable: operation.kind !== "const",
                configurable: false,
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
              message: reportDuplicate(operation.variable),
              path,
            }),
            makeEarlyErrorPrelude({
              guard: guard2,
              message: reportDuplicate(operation.variable),
              path,
            }),
            ...map(declare, makeEffectPrelude),
          ],
          result,
        ),
    );
  } else if (operation.kind === "var" || operation.kind === "eval") {
    return bindTwoSequence(
      sequenceExpression(makeRecordBelongExpression({ path }, operation)),
      makeConditionalEffect(
        makeApplyExpression(
          makeIntrinsicExpression("Object.hasOwn", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeIntrinsicExpression("aran.global", path),
            makePrimitiveExpression(operation.variable, path),
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
              makePrimitiveExpression(operation.variable, path),
              makeDataDescriptorExpression(
                {
                  value: makePrimitiveExpression({ undefined: null }, path),
                  writable: true,
                  configurable: operation.kind === "eval",
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
              message: reportDuplicate(operation.variable),
              path,
            }),
            ...map(declare, makeEffectPrelude),
          ],
          result,
        ),
    );
  } else {
    throw new AranTypeError(operation.kind);
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
 *   operation: import(".").Declare,
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").NodePrelude,
 *   [
 *     estree.Variable,
 *     import(".").ReifyBinding
 *   ],
 * >}
 */
export const setupReifyEntry = ({ path }, operation) =>
  declare({ path }, operation, [
    operation.variable,
    { kind: operation.kind, deadzone: null },
  ]);

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   binding: null | import(".").ReifyBinding,
 *   operation: import("..").VariableSaveOperation,
 * ) => import("../../sequence").EffectSequence}
 */
export const makeReifySaveEffect = ({ path, meta }, binding, operation) => {
  if (operation.type === "declare") {
    return declare({ path }, operation, []);
  } else if (operation.type === "initialize") {
    if (
      binding === null ||
      binding.kind === "var" ||
      binding.kind === "function"
    ) {
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
            makeRecordLookupExpression({ path, meta }, "unknown", forgery),
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
    } else if (
      binding.kind === "let" ||
      binding.kind === "const" ||
      binding.kind === "class"
    ) {
      return makeExpressionEffect(
        makeRecordLookupExpression(
          { path, meta },
          ACCESS[binding.kind],
          operation,
        ),
        path,
      );
    } else {
      throw new AranTypeError(binding);
    }
  } else if (operation.type === "write") {
    // We can't assume binding remained in the global object:
    // > global.x = 123;
    // > var x = 456;
    // > delete x; >> true
    // > "x" in global >> false
    if (
      binding === null ||
      binding.kind === "var" ||
      binding.kind === "function"
    ) {
      return makeExpressionEffect(
        makeConditionalExpression(
          makeRecordBelongExpression({ path }, operation),
          makeRecordLookupExpression({ path, meta }, "unknown", operation),
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
    } else if (
      binding.kind === "let" ||
      binding.kind === "class" ||
      binding.kind === "const"
    ) {
      return makeExpressionEffect(
        makeRecordLookupExpression(
          { path, meta },
          ACCESS[binding.kind],
          operation,
        ),
        path,
      );
    } else {
      throw new AranTypeError(binding);
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
  if (
    binding === null ||
    binding.kind === "var" ||
    binding.kind === "function"
  ) {
    return makeConditionalExpression(
      makeRecordBelongExpression({ path }, operation),
      makeRecordLookupExpression({ path, meta }, "unknown", operation),
      makeConditionalExpression(
        makeGlobalBelongExpression({ path }, operation),
        makeGlobalLookupExpression({ path }, operation),
        makeMissingLookupExpression({ path }, operation),
        path,
      ),
      path,
    );
  } else if (
    binding.kind === "let" ||
    binding.kind === "const" ||
    binding.kind === "class"
  ) {
    return makeRecordLookupExpression(
      { path, meta },
      ACCESS[binding.kind],
      operation,
    );
  } else {
    throw new AranTypeError(binding);
  }
};
