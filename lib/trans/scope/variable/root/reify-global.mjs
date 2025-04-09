import { AranExecError, AranTypeError } from "../../../../error.mjs";
import {
  makeDataDescriptorExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
} from "../../../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../../node.mjs";
import { makeThrowConstantExpression } from "../error.mjs";
import {
  makePrefixPrelude,
  makeReifyExternalPrelude,
} from "../../../prelude/index.mjs";
import { initSequence, EMPTY, includes } from "../../../../util/index.mjs";

/**
 * @type {(
 *   hash: import("../../../hash.d.ts").Hash,
 *   variable: import("estree-sentry").VariableName,
 * ) => import("../../../atom.d.ts").Expression}
 */
export const makeGlobalBelongExpression = (hash, variable) =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.has", hash),
    makeIntrinsicExpression("undefined", hash),
    [
      makeIntrinsicExpression("aran.global_object", hash),
      makePrimitiveExpression(variable, hash),
    ],
    hash,
  );

/**
 * @type {(
 *   hash: import("../../../hash.d.ts").Hash,
 *   variable: import("estree-sentry").VariableName,
 *   configurable: boolean | "prefer-true",
 * ) => import("../../../atom.d.ts").Effect}
 */
const makeDefineGlobalEffect = (hash, variable, configurable) =>
  makeConditionalEffect(
    makeApplyExpression(
      makeIntrinsicExpression("Reflect.defineProperty", hash),
      makeIntrinsicExpression("undefined", hash),
      [
        makeIntrinsicExpression("aran.global_object", hash),
        makePrimitiveExpression(variable, hash),
        makeDataDescriptorExpression(
          {
            value: makeIntrinsicExpression("undefined", hash),
            writable: true,
            enumerable: true,
            // Avoid throwing an error if the property is already defined
            // and is not configurable but writable and enumerable.
            configurable:
              typeof configurable === "boolean"
                ? configurable
                : makeConditionalExpression(
                    makeApplyExpression(
                      makeIntrinsicExpression("Object.hasOwn", hash),
                      makeIntrinsicExpression("undefined", hash),
                      [
                        makeIntrinsicExpression("aran.global_object", hash),
                        makePrimitiveExpression(variable, hash),
                      ],
                      hash,
                    ),
                    makeApplyExpression(
                      makeIntrinsicExpression("aran.getValueProperty", hash),
                      makeIntrinsicExpression("undefined", hash),
                      [
                        makeApplyExpression(
                          makeIntrinsicExpression(
                            "Reflect.getOwnPropertyDescriptor",
                            hash,
                          ),
                          makeIntrinsicExpression("undefined", hash),
                          [
                            makeIntrinsicExpression("aran.global_object", hash),
                            makePrimitiveExpression(variable, hash),
                          ],
                          hash,
                        ),
                        makePrimitiveExpression("configurable", hash),
                      ],
                      hash,
                    ),
                    makePrimitiveExpression(true, hash),
                    hash,
                  ),
          },
          hash,
        ),
      ],
      hash,
    ),
    EMPTY,
    [
      makeExpressionEffect(
        makeThrowErrorExpression(
          "TypeError",
          `Cannot define global variable ${variable}`,
          hash,
        ),
        hash,
      ),
    ],
    hash,
  );

/**
 * @type {(
 *   hash: import("../../../hash.d.ts").Hash,
 *   variable: import("estree-sentry").VariableName,
 *   options: {
 *     dynamic: boolean,
 *     kinds: (
 *       | "var"
 *       | "function-strict"
 *       | "function-sloppy-near"
 *       | "function-sloppy-away"
 *     )[],
 *   },
 * ) => import("../../../../util/sequence.d.ts").Sequence<
 *   (
 *     | import("../../../prelude/index.d.ts").PrefixPrelude
 *     | import("../../../prelude/index.d.ts").ReifyExternalPrelude
 *   ),
 *   null,
 * >}
 */
export const declareGlobal = (hash, variable, { dynamic, kinds }) =>
  initSequence(
    [
      makeReifyExternalPrelude({
        dynamic,
        kinds,
        variable,
        origin: hash,
      }),
      includes(kinds, "function-strict") ||
      includes(kinds, "function-sloppy-near")
        ? makePrefixPrelude(
            makeDefineGlobalEffect(
              hash,
              variable,
              dynamic ? "prefer-true" : false,
            ),
          )
        : makePrefixPrelude(
            makeConditionalEffect(
              makeApplyExpression(
                makeIntrinsicExpression(
                  "Reflect.getOwnPropertyDescriptor",
                  hash,
                ),
                makeIntrinsicExpression("undefined", hash),
                [
                  makeIntrinsicExpression("aran.global_object", hash),
                  makePrimitiveExpression(variable, hash),
                ],
                hash,
              ),
              EMPTY,
              [makeDefineGlobalEffect(hash, variable, dynamic)],
              hash,
            ),
          ),
    ],
    null,
  );

/**
 * @type {(
 *   hash: import("../../../hash.d.ts").Hash,
 *   operation: {
 *     variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("../../../atom.d.ts").Expression}
 */
export const makeGlobalReadExpression = (hash, { variable }) =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.get", hash),
    makeIntrinsicExpression("undefined", hash),
    [
      makeIntrinsicExpression("aran.global_object", hash),
      makePrimitiveExpression(variable, hash),
    ],
    hash,
  );

/**
 * @type {(
 *   hash: import("../../../hash.d.ts").Hash,
 *   operation: {
 *     variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("../../../atom.d.ts").Expression}
 */
export const makeGlobalTypeofExpression = (hash, { variable }) =>
  makeUnaryExpression(
    "typeof",
    makeApplyExpression(
      makeIntrinsicExpression("Reflect.get", hash),
      makeIntrinsicExpression("undefined", hash),
      [
        makeIntrinsicExpression("aran.global_object", hash),
        makePrimitiveExpression(variable, hash),
      ],
      hash,
    ),
    hash,
  );

/**
 * @type {(
 *   hash: import("../../../hash.d.ts").Hash,
 *   operation: {
 *     mode: import("../../../mode.d.ts").Mode,
 *     variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("../../../atom.d.ts").Expression}
 */
export const makeGlobalDiscardExpression = (hash, { mode, variable }) => {
  switch (mode) {
    case "sloppy": {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.deleteProperty", hash),
        makeIntrinsicExpression("undefined", hash),
        [
          makeIntrinsicExpression("aran.global_object", hash),
          makePrimitiveExpression(variable, hash),
        ],
        hash,
      );
    }
    case "strict": {
      throw new AranExecError(
        "delete variable in strict mode should have been reported earlier",
        { hash, mode, variable },
      );
    }
    default: {
      throw new AranTypeError(mode);
    }
  }
};

/**
 * @type {(
 *   hash: import("../../../hash.d.ts").Hash,
 *   operation: {
 *     mode: import("../../../mode.d.ts").Mode,
 *     variable: import("estree-sentry").VariableName,
 *     right: import("../../../atom.d.ts").Expression,
 *   },
 * ) => import("../../../atom.d.ts").Expression}
 */
export const makeGlobalWriteExpression = (hash, { mode, variable, right }) => {
  const perform = makeApplyExpression(
    makeIntrinsicExpression("Reflect.set", hash),
    makeIntrinsicExpression("undefined", hash),
    [
      makeIntrinsicExpression("aran.global_object", hash),
      makePrimitiveExpression(variable, hash),
      right,
    ],
    hash,
  );
  switch (mode) {
    case "strict": {
      return makeConditionalExpression(
        perform,
        makePrimitiveExpression(true, hash),
        makeThrowConstantExpression(variable, hash),
        hash,
      );
    }
    case "sloppy": {
      return perform;
    }
    default: {
      throw new AranTypeError(mode);
    }
  }
};
