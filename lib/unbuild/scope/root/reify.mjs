import { AranExecError, AranTypeError } from "../../../report.mjs";
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
  makeReadExpression,
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
  makeThrowMissingExpression,
} from "../error.mjs";
import {
  makePrefixPrelude,
  incorporateEffect,
  incorporateExpression,
  makeReifyExternalPrelude,
} from "../../prelude/index.mjs";
import { EMPTY, concat_ } from "../../../util/index.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";

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
    return incorporateExpression(
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
    return incorporateExpression(
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
        makeThrowDeadzoneExpression(operation.variable, path),
        makeRecordAliveWriteExpression(
          { path },
          binding === null ? "unknown" : binding.write,
          operation,
        ),
        path,
      ),
    );
  } else if (operation.type === "initialize") {
    if (binding === null) {
      throw new AranExecError("Missing binding for initialize operation", {
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
          // This should have marked as early error during hoisting phase
          return zeroSequence(
            makePrimitiveExpression(
              `ARAN_DUPLICATE_VARIABLE >> ${operation.variable} >> ${path}`,
              path,
            ),
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
 *     variable: import("../../../estree").Variable,
 *     baseline: "live" | "dead",
 *     write: "perform" | "report",
 *   },
 *   configurable: boolean,
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").PrefixPrelude
 *     | import("../../prelude").ReifyExternalPrelude
 *   ),
 *   [
 *     import("../../../estree").Variable,
 *     import(".").ReifyBinding,
 *   ],
 * >}
 */
const declare = ({ path }, binding, configurable) => {
  const writable = toWritable(binding.write);
  switch (binding.baseline) {
    case "dead": {
      return initSequence(
        [
          makeReifyExternalPrelude({
            frame: "aran.record",
            variable: binding.variable,
            origin: path,
          }),
          makePrefixPrelude(
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.set", path),
                makeIntrinsicExpression("undefined", path),
                [
                  makeIntrinsicExpression("aran.record", path),
                  makePrimitiveExpression(binding.variable, path),
                  makeIntrinsicExpression("aran.deadzone", path),
                ],
                path,
              ),
              path,
            ),
          ),
        ],
        [
          binding.variable,
          {
            frame: "record",
            write: binding.write,
          },
        ],
      );
    }
    case "live": {
      return initSequence(
        [
          makeReifyExternalPrelude({
            frame: "aran.global",
            variable: binding.variable,
            origin: path,
          }),
          makePrefixPrelude(
            makeConditionalEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Object.hasOwn", path),
                makeIntrinsicExpression("undefined", path),
                [
                  makeIntrinsicExpression("aran.global", path),
                  makePrimitiveExpression(binding.variable, path),
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
                      makePrimitiveExpression(binding.variable, path),
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
        [
          binding.variable,
          {
            frame: "global",
            write: binding.write,
          },
        ],
      );
    }
    default: {
      throw new AranTypeError(binding.baseline);
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
 * ) => null | import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").ReifyExternalPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   [
 *     import("../../../estree").Variable,
 *     import(".").ReifyBinding
 *   ],
 * >}
 */
export const setupReifyEntry = (site, binding, mode) => {
  if (binding.write === "ignore") {
    throw new AranExecError("silent constant are not supported in root frame", {
      site,
      binding,
      mode,
    });
  } else if (binding.write === "report" || binding.write === "perform") {
    return declare(site, /** @type {any} */ (binding), false);
  } else {
    throw new AranTypeError(binding.write);
  }
};

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   binding: null | import(".").ReifyBinding,
 *   operation: import("../operation").VariableSaveOperation,
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").ReifyExternalPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *   ),
 *   import("../../atom").Effect[],
 * >}
 */
export const listReifySaveEffect = ({ path, meta }, binding, operation) => {
  switch (operation.type) {
    case "late-declare": {
      return incorporateEffect(
        thenSequence(
          declare(
            { path },
            {
              variable: operation.variable,
              baseline: "live",
              write: "perform",
            },
            true,
          ),
          EMPTY_SEQUENCE,
        ),
        path,
      );
    }
    case "initialize": {
      if (binding === null || binding.frame === "global") {
        if (operation.right === null) {
          return EMPTY_SEQUENCE;
        } else {
          return incorporateEffect(
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
    }
    case "write": {
      // We can't assume binding remained in the global object:
      // > global.x = 123;
      // > var x = 456;
      // > delete x; >> true
      // > "x" in global >> false
      if (binding === null || binding.frame === "global") {
        return incorporateEffect(
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
    }
    case "write-sloppy-function": {
      if (operation.right === null) {
        return EMPTY_SEQUENCE;
      } else {
        return zeroSequence([
          makeExpressionEffect(
            makeGlobalLookupExpression(
              { path },
              {
                type: "write",
                variable: operation.variable,
                mode: operation.mode,
                right: makeReadExpression(operation.right, path),
              },
            ),
            path,
          ),
        ]);
      }
    }
    default: {
      throw new AranTypeError(operation);
    }
  }
};

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   binding: null | import(".").ReifyBinding,
 *   operation: Exclude<
 *     import("../operation").VariableLoadOperation,
 *     import("../operation").ReadAmbientThisOperation
 *   >,
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
