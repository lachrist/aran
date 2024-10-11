import { AranExecError, AranTypeError } from "../../../report.mjs";
import { EMPTY, concat, concat_, guard, map } from "../../../util/index.mjs";
import {
  cacheConstant,
  cacheWritable,
  makeReadCacheExpression,
  makeWriteCacheEffect,
} from "../../cache.mjs";
import { makeIsProperObjectExpression } from "../../helper.mjs";
import {
  makeBinaryExpression,
  makeGetExpression,
  makeThrowErrorExpression,
} from "../../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeWriteEffect,
} from "../../node.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  liftSequenceX,
  liftSequenceX_,
  liftSequence_X_,
  liftSequence_X__,
  liftSequence__X_,
  mapSequence,
  prependSequence,
  zeroSequence,
} from "../../../sequence.mjs";
import {
  incorporateEffect,
  incorporateExpression,
  initSyntaxErrorExpression,
  makePrefixPrelude,
} from "../../prelude/index.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";

const {
  Array: { of: toArray },
} = globalThis;

/**
 * @type {(
 *   routine: import(".").Routine,
 * ) => (
 *   | "static-block"
 *   | "program"
 *   | "arrow"
 *   | "function"
 *   | "method"
 *   | "constructor"
 *   | "constructor*"
 * )}
 */
const getRoutineKind = (routine) => {
  if (routine.intermediaries === null) {
    if (routine.type === "constructor") {
      return routine.derived ? "constructor*" : "constructor";
    } else if (routine.type === "root") {
      return "program";
    } else {
      return routine.type;
    }
  } else {
    const intermediary = routine.intermediaries[0];
    switch (intermediary) {
      case "arrow": {
        return "arrow";
      }
      case "eval.local.deep": {
        return "program";
      }
      case "static-block": {
        return "static-block";
      }
      default: {
        throw new AranTypeError(intermediary);
      }
    }
  }
};

/**
 * @type {(
 *   routine: import(".").Routine,
 * ) => "illegal" | "program" | "closure"}
 */
const getOriginKind = (routine) => {
  if (routine.intermediaries === null) {
    return routine.type === "root" ? "program" : "closure";
  } else {
    const intermediary = routine.intermediaries[0];
    switch (intermediary) {
      case "arrow": {
        return "closure";
      }
      case "eval.local.deep": {
        return "program";
      }
      case "static-block": {
        return "illegal";
      }
      default: {
        throw new AranTypeError(intermediary);
      }
    }
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   routine: (
 *     | import(".").FunctionRoutine
 *     | import(".").MethodRoutine
 *     | import(".").ConstructorRoutine
 *   ),
 * ) => import("../../atom").Expression}
 */
const makeThisExpression = (hash, routine) =>
  guard(
    routine.type === "constructor" && routine.derived,
    (node) =>
      makeConditionalExpression(
        makeReadExpression("this", hash),
        node,
        makeThrowErrorExpression(
          "ReferenceError",
          "Cannot read 'this' before initialization",
          hash,
        ),
        hash,
      ),
    makeReadExpression("this", hash),
  );

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   routine: (
 *     | import(".").MethodRoutine
 *     | import(".").ConstructorRoutine
 *   ),
 * ) => import("../../atom").Expression}
 */
const makeSuperExpression = (hash, routine) => {
  if (routine.type === "method") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.getPrototypeOf", hash),
      makeIntrinsicExpression("undefined", hash),
      [makeReadCacheExpression(routine.proto, hash)],
      hash,
    );
  } else if (routine.type === "constructor") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.getPrototypeOf", hash),
      makeIntrinsicExpression("undefined", hash),
      [
        makeGetExpression(
          makeReadCacheExpression(routine.self, hash),
          makePrimitiveExpression("prototype", hash),
          hash,
        ),
      ],
      hash,
    );
  } else {
    throw new AranTypeError(routine);
  }
};

////////////
// extend //
////////////

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").MetaDeclarationPrelude,
 *   import("../../atom").Effect[],
 * >}
 */
const listSetupThisConstructorEffect = (hash, meta) =>
  liftSequenceX(
    toArray,
    liftSequence_X_(
      makeWriteEffect,
      "this",
      liftSequence__X_(
        makeApplyExpression,
        makeIntrinsicExpression("Object.create", hash),
        makeIntrinsicExpression("undefined", hash),
        liftSequenceX(
          toArray,
          incorporateExpression(
            mapSequence(
              cacheConstant(
                forkMeta((meta = nextMeta(meta))),
                makeGetExpression(
                  makeReadExpression("new.target", hash),
                  makePrimitiveExpression("prototype", hash),
                  hash,
                ),
                hash,
              ),
              (prototype) =>
                makeConditionalExpression(
                  makeIsProperObjectExpression(hash, { value: prototype }),
                  makeReadCacheExpression(prototype, hash),
                  makeIntrinsicExpression("Object.prototype", hash),
                  hash,
                ),
            ),
            hash,
          ),
        ),
        hash,
      ),
      hash,
    ),
  );

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   mode: "strict" | "sloppy",
 * ) => import("../../atom").Effect[]}
 */
const listSetupThisMethodEffect = (hash, mode) => {
  if (mode === "strict") {
    return EMPTY;
  } else if (mode === "sloppy") {
    return [
      makeWriteEffect(
        "this",
        makeConditionalExpression(
          makeBinaryExpression(
            "==",
            makeReadExpression("this", hash),
            makePrimitiveExpression(null, hash),
            hash,
          ),
          makeIntrinsicExpression("globalThis", hash),
          makeApplyExpression(
            makeIntrinsicExpression("Object", hash),
            makeIntrinsicExpression("undefined", hash),
            [makeReadExpression("this", hash)],
            hash,
          ),
          hash,
        ),
        hash,
      ),
    ];
  } else {
    throw new AranTypeError(mode);
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   options: {
 *     result: "direct" | "indirect",
 *   },
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   import(".").RootRoutine,
 * >}
 */
export const setupInitialRoutine = (_hash, meta, { result }) => {
  switch (result) {
    case "direct": {
      return zeroSequence({
        type: "root",
        intermediaries: null,
        result: null,
      });
    }
    case "indirect": {
      return mapSequence(
        cacheWritable(forkMeta((meta = nextMeta(meta))), "undefined"),
        (result) => ({
          type: "root",
          intermediaries: null,
          result,
        }),
      );
    }
    default: {
      throw new AranTypeError(result);
    }
  }
};

/**
 * @type {import("../api").Extend<
 *   {
 *     mode: import("../../mode").Mode,
 *   },
 *   (
 *     | import("../../prelude").PrefixPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *   ),
 *   import(".").RoutineScope,
 * >}
 */
export const extendFunctionRoutine = (hash, meta, { mode }, scope) =>
  bindSequence(
    liftSequence_X__(
      makeConditionalEffect,
      makeReadExpression("new.target", hash),
      listSetupThisConstructorEffect(hash, meta),
      listSetupThisMethodEffect(hash, mode),
      hash,
    ),
    (setup) =>
      prependSequence(
        [makePrefixPrelude(setup)],
        mapSequence(
          cacheWritable(forkMeta((meta = nextMeta(meta))), "undefined"),
          (result) => ({
            ...scope,
            routine: {
              type: "function",
              intermediary: "none",
              result,
            },
          }),
        ),
      ),
  );

/**
 * @type {import("../api").Extend<
 *   {
 *     derived: boolean,
 *     self: import("../../cache").Cache,
 *     field: import("../../cache").Cache,
 *   },
 *   (
 *     | import("../../prelude").PrefixPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *   ),
 *   import(".").RoutineScope,
 * >}
 */
export const extendConstructorRoutine = (hash, meta, options, scope) =>
  bindSequence(
    liftSequence_X__(
      makeConditionalEffect,
      makeReadExpression("new.target", hash),
      options.derived
        ? EMPTY_SEQUENCE
        : liftSequenceX_(concat, listSetupThisConstructorEffect(hash, meta), [
            makeConditionalEffect(
              makeReadCacheExpression(options.field, hash),
              [
                makeExpressionEffect(
                  makeApplyExpression(
                    makeReadCacheExpression(options.field, hash),
                    makeReadExpression("this", hash),
                    [],
                    hash,
                  ),
                  hash,
                ),
              ],
              EMPTY,
              hash,
            ),
          ]),
      [
        makeExpressionEffect(
          makeThrowErrorExpression(
            "TypeError",
            "constructor cannot be called as a method",
            hash,
          ),
          hash,
        ),
      ],
      hash,
    ),
    (setup) =>
      prependSequence(
        [makePrefixPrelude(setup)],
        mapSequence(
          cacheWritable(forkMeta((meta = nextMeta(meta))), "undefined"),
          (result) => ({
            ...scope,
            routine: {
              type: "constructor",
              intermediary: "none",
              result,
              derived: options.derived,
              self: options.self,
              field: options.field,
            },
          }),
        ),
      ),
  );

/**
 * @type {import("../api").Extend<
 *   { proto: import("../../cache").Cache },
 *   (
 *     | import("../../prelude").PrefixPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *   ),
 *   import(".").RoutineScope,
 * >}
 */
export const extendMethodRoutine = (hash, meta, { proto }, scope) =>
  prependSequence(
    map(listSetupThisMethodEffect(hash, scope.mode), makePrefixPrelude),
    mapSequence(
      cacheWritable(forkMeta((meta = nextMeta(meta))), "undefined"),
      (result) => ({
        ...scope,
        routine: {
          type: "method",
          intermediary: "none",
          result,
          proto,
        },
      }),
    ),
  );

/**
 * @type {import("../api").Extend<
 *   {},
 *   never,
 *   import(".").RoutineScope,
 * >}
 */
export const extendStaticBlock = (_hash, _meta, _options, scope) =>
  zeroSequence({
    ...scope,
    routine: {
      ...scope.routine,
      intermediaries: ["static-block", scope.routine.intermediaries],
    },
  });

/**
 * @type {(
 *  intermediary: import(".").Intermediary,
 * ) => import("../api").Extend<
 *   { result: "direct" | "indirect" },
 *   import("../../prelude").MetaDeclarationPrelude,
 *   import(".").RoutineScope,
 * >}
 */
export const compileExtend =
  (intermediary) =>
  (_hash, meta, { result }, scope) => {
    switch (result) {
      case "direct": {
        return zeroSequence({
          ...scope,
          routine: {
            ...scope.routine,
            intermediaries: [intermediary, scope.routine.intermediaries],
            result: null,
          },
        });
      }
      case "indirect": {
        return mapSequence(
          cacheWritable(forkMeta((meta = nextMeta(meta))), "undefined"),
          (result) => ({
            ...scope,
            routine: {
              ...scope.routine,
              intermediaries: [intermediary, scope.routine.intermediaries],
              result,
            },
          }),
        );
      }
      default: {
        throw new AranTypeError(result);
      }
    }
  };

export const extendEvalRoutine = compileExtend("eval.local.deep");

export const extendArrowRoutine = compileExtend("arrow");

//////////
// load //
//////////

/**
 * @type {import("../api").PerformExpression<
 *   import(".").RoutineScope,
 *   import(".").ReadThisOperation,
 *   never,
 * >}
 */
export const makeReadThisExpression = (
  hash,
  _meta,
  { root, routine },
  _operation,
) => {
  if (
    routine.type === "function" ||
    routine.type === "method" ||
    routine.type === "constructor"
  ) {
    return zeroSequence(makeThisExpression(hash, routine));
  } else if (routine.type === "root") {
    if (root === "module") {
      return zeroSequence(makeIntrinsicExpression("undefined", hash));
    } else if (root === "script" || root === "eval.global") {
      return zeroSequence(makeIntrinsicExpression("globalThis", hash));
    } else if (root === "eval.local.root") {
      return zeroSequence(makeReadExpression("this", hash));
    } else {
      throw new AranTypeError(root);
    }
  } else {
    throw new AranTypeError(routine);
  }
};

/**
 * @type {import("../api").PerformExpression<
 *   import(".").RoutineScope,
 *   import(".").ReadNewTargetOperation,
 *   import("../../prelude").SyntaxErrorPrelude,
 * >}
 */
export const makeReadNewTargetExpression = (
  hash,
  _meta,
  { root, routine },
  _operation,
) => {
  if (
    routine.type === "function" ||
    routine.type === "method" ||
    routine.type === "constructor"
  ) {
    return zeroSequence(makeReadExpression("new.target", hash));
  } else if (routine.type === "root") {
    if (root === "script" || root === "module" || root === "eval.global") {
      return initSyntaxErrorExpression("Illegal 'new.target' read", hash);
    } else if (root === "eval.local.root") {
      return zeroSequence(makeReadExpression("new.target", hash));
    } else {
      throw new AranTypeError(root);
    }
  } else {
    throw new AranTypeError(routine);
  }
};

/**
 * @type {import("../api").PerformExpression<
 *   import(".").RoutineScope,
 *   import(".").ReadInputOperation,
 *   import("../../prelude").SyntaxErrorPrelude,
 * >}
 */
export const makeReadInputExpression = (
  hash,
  _meta,
  { routine },
  _operation,
) => {
  const kind = getRoutineKind(routine);
  if (
    kind === "arrow" ||
    kind === "method" ||
    kind === "function" ||
    kind === "constructor" ||
    kind === "constructor*"
  ) {
    return zeroSequence(makeReadExpression("function.arguments", hash));
  } else if (kind === "static-block" || kind === "program") {
    return initSyntaxErrorExpression(`Illegal 'input' read in ${kind}`, hash);
  } else {
    throw new AranTypeError(kind);
  }
};

/**
 * @type {(
 *   key: import("../../atom").Expression,
 * ) => import(".").GetSuperOperation}
 */
export const makeGetSuperOperation = (key) => ({ key });

/**
 * @type {import("../api").PerformExpression<
 *   import(".").RoutineScope,
 *   import(".").GetSuperOperation,
 *   import("../../prelude").SyntaxErrorPrelude,
 * >}
 */
export const makeGetSuperExpression = (
  hash,
  _meta,
  { root, routine },
  operation,
) => {
  if (routine.type === "method" || routine.type === "constructor") {
    return zeroSequence(
      guard(
        routine.type === "constructor" && routine.derived,
        (node) =>
          makeConditionalExpression(
            makeReadExpression("this", hash),
            node,
            makeThrowErrorExpression(
              "ReferenceError",
              "Cannot get `super` before calling `super`",
              hash,
            ),
            hash,
          ),
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.get", hash),
          makeIntrinsicExpression("undefined", hash),
          [
            makeSuperExpression(hash, routine),
            operation.key,
            makeReadExpression("this", hash),
          ],
          hash,
        ),
      ),
    );
  } else if (routine.type === "function") {
    return initSyntaxErrorExpression("Illegal 'super' get", hash);
  } else if (routine.type === "root") {
    if (root === "script" || root === "module" || root === "eval.global") {
      return initSyntaxErrorExpression("Illegal 'super' get", hash);
    } else if (root === "eval.local.root") {
      return zeroSequence(
        makeApplyExpression(
          makeReadExpression("super.get", hash),
          makeIntrinsicExpression("undefined", hash),
          [operation.key],
          hash,
        ),
      );
    } else {
      throw new AranTypeError(root);
    }
  } else {
    throw new AranTypeError(routine);
  }
};

/**
 * @type {(
 *   result: null | import("../../atom").Expression,
 * ) => import(".").FinalizeResultOperation}
 */
export const makeFinalizeResultOperation = (result) => ({ result });

/**
 * @type {import("../api").PerformExpression<
 *   import(".").RoutineScope,
 *   import(".").FinalizeResultOperation,
 *   never,
 * >}
 */
export const makeFinalizeResultExpression = (
  hash,
  meta,
  { routine },
  operation,
) => {
  const kind = getRoutineKind(routine);
  if (kind === "arrow" || kind === "method" || kind === "program") {
    return zeroSequence(
      operation.result ??
        (routine.result === null
          ? makeIntrinsicExpression("undefined", hash)
          : makeReadCacheExpression(routine.result, hash)),
    );
  } else if (
    kind === "function" ||
    kind === "constructor" ||
    kind === "constructor*"
  ) {
    return incorporateExpression(
      mapSequence(
        /**
         * @type {import("../../../sequence").Sequence<
         *   import("../../prelude").PrefixPrelude,
         *   import("../../cache").Cache,
         * >}
         */ (
          operation.result === null
            ? routine.result === null
              ? cacheConstant(
                  meta,
                  makeIntrinsicExpression("undefined", hash),
                  hash,
                )
              : zeroSequence(routine.result)
            : cacheConstant(meta, operation.result, hash)
        ),
        (result) => {
          if (kind === "function") {
            return makeConditionalExpression(
              makeReadExpression("new.target", hash),
              makeConditionalExpression(
                makeIsProperObjectExpression(hash, { value: result }),
                makeReadCacheExpression(result, hash),
                makeReadExpression("this", hash),
                hash,
              ),
              makeReadCacheExpression(result, hash),
              hash,
            );
          } else if (kind === "constructor*") {
            return makeConditionalExpression(
              makeIsProperObjectExpression(hash, { value: result }),
              makeReadCacheExpression(result, hash),
              makeConditionalExpression(
                makeBinaryExpression(
                  "===",
                  makeReadCacheExpression(result, hash),
                  makeIntrinsicExpression("undefined", hash),
                  hash,
                ),
                makeConditionalExpression(
                  makeReadExpression("this", hash),
                  makeReadExpression("this", hash),
                  makeThrowErrorExpression(
                    "ReferenceError",
                    "Derived constructors must call super before returning default value",
                    hash,
                  ),
                  hash,
                ),
                makeThrowErrorExpression(
                  "TypeError",
                  "Derived constructors may only return object or undefined",
                  hash,
                ),
                hash,
              ),
              hash,
            );
          } else if (kind === "constructor") {
            return makeConditionalExpression(
              makeIsProperObjectExpression(hash, { value: result }),
              makeReadCacheExpression(result, hash),
              makeReadExpression("this", hash),
              hash,
            );
          } else {
            throw new AranTypeError(kind);
          }
        },
      ),
      hash,
    );
  } else if (kind === "static-block") {
    throw new AranExecError("illegal finalize result in static block", {
      routine,
      operation,
    });
  } else {
    throw new AranTypeError(kind);
  }
};

/**
 * @type {import("../api").PerformExpression<
 *   import(".").RoutineScope,
 *   import(".").ReadResultOperation,
 *   never,
 * >}
 */
export const makeReadResultExpression = (
  hash,
  _meta,
  { routine },
  _operation,
) => {
  if (routine.result === null) {
    return zeroSequence(makeIntrinsicExpression("undefined", hash));
  } else {
    return zeroSequence(makeReadCacheExpression(routine.result, hash));
  }
};

//////////
// save //
//////////

/**
 * @type {(
 *   key: import("../../atom").Expression,
 *   value: import("../../atom").Expression,
 * ) => import(".").SetSuperOperation}
 */
export const makeSetSuperOperation = (key, value) => ({ key, value });

/**
 * @type {import("../api").PerformEffect<
 *   import(".").RoutineScope,
 *   import(".").SetSuperOperation,
 *   import("../../prelude").SyntaxErrorPrelude
 * >}
 */
export const listSetSuperEffect = (
  hash,
  _meta,
  { root, mode, routine },
  operation,
) => {
  if (routine.type === "method" || routine.type === "constructor") {
    const perform = guard(
      routine.type === "constructor" && routine.derived,
      (node) =>
        makeConditionalExpression(
          makeReadExpression("this", hash),
          node,
          makeThrowErrorExpression(
            "ReferenceError",
            "Cannot set `super` before calling `super`",
            hash,
          ),
          hash,
        ),
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.set", hash),
        makeIntrinsicExpression("undefined", hash),
        [
          makeSuperExpression(hash, routine),
          operation.key,
          operation.value,
          makeReadExpression("this", hash),
        ],
        hash,
      ),
    );
    if (mode === "sloppy") {
      return zeroSequence([makeExpressionEffect(perform, hash)]);
    } else if (mode === "strict") {
      return zeroSequence([
        makeConditionalEffect(
          perform,
          EMPTY,
          [
            makeExpressionEffect(
              makeThrowErrorExpression(
                "TypeError",
                "Cannot assign super property",
                hash,
              ),
              hash,
            ),
          ],
          hash,
        ),
      ]);
    } else {
      throw new AranTypeError(mode);
    }
  } else if (routine.type === "function") {
    return liftSequenceX(
      concat_,
      liftSequenceX_(
        makeExpressionEffect,
        initSyntaxErrorExpression("Illegal 'super' set", hash),
        hash,
      ),
    );
  } else if (routine.type === "root") {
    if (root === "script" || root === "module" || root === "eval.global") {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          initSyntaxErrorExpression("Illegal 'super' set", hash),
          hash,
        ),
      );
    } else if (root === "eval.local.root") {
      return zeroSequence([
        makeExpressionEffect(
          makeApplyExpression(
            makeReadExpression("super.set", hash),
            makeIntrinsicExpression("undefined", hash),
            [operation.key, operation.value],
            hash,
          ),
          hash,
        ),
      ]);
    } else {
      throw new AranTypeError(root);
    }
  } else {
    throw new AranTypeError(routine);
  }
};

/**
 * @type {(
 *   input: import("../../atom").Expression,
 * ) => import(".").CallSuperOperation}
 */
export const makeCallSuperOperation = (input) => ({ input });

/**
 * @type {import("../api").PerformEffect<
 *   import(".").RoutineScope,
 *   import(".").CallSuperOperation,
 *   (
 *     | import("../../prelude").SyntaxErrorPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *   ),
 * >}
 */
export const listCallSuperEffect = (
  hash,
  meta,
  { root, routine },
  operation,
) => {
  if (routine.type === "constructor") {
    if (routine.derived) {
      return incorporateEffect(
        mapSequence(
          cacheConstant(
            meta,
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.construct", hash),
              makeIntrinsicExpression("undefined", hash),
              [
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.getPrototypeOf", hash),
                  makeIntrinsicExpression("undefined", hash),
                  [makeReadCacheExpression(routine.self, hash)],
                  hash,
                ),
                operation.input,
                makeReadExpression("new.target", hash),
              ],
              hash,
            ),
            hash,
          ),
          (right) => [
            makeConditionalEffect(
              makeReadExpression("this", hash),
              [
                makeExpressionEffect(
                  makeThrowErrorExpression(
                    "ReferenceError",
                    "Duplicate super call",
                    hash,
                  ),
                  hash,
                ),
              ],
              [
                makeWriteEffect(
                  "this",
                  makeReadCacheExpression(right, hash),
                  hash,
                ),
                makeConditionalEffect(
                  makeReadCacheExpression(routine.field, hash),
                  [
                    makeExpressionEffect(
                      makeApplyExpression(
                        makeReadCacheExpression(routine.field, hash),
                        makeReadExpression("this", hash),
                        [],
                        hash,
                      ),
                      hash,
                    ),
                  ],
                  EMPTY,
                  hash,
                ),
              ],
              hash,
            ),
          ],
        ),
        hash,
      );
    } else {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          initSyntaxErrorExpression("Illegal 'super' call", hash),
          hash,
        ),
      );
    }
  } else if (routine.type === "function" || routine.type === "method") {
    return liftSequenceX(
      concat_,
      liftSequenceX_(
        makeExpressionEffect,
        initSyntaxErrorExpression("Illegal 'super' call", hash),
        hash,
      ),
    );
  } else if (routine.type === "root") {
    if (root === "script" || root === "module" || root === "eval.global") {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          initSyntaxErrorExpression("Illegal 'super' call", hash),
          hash,
        ),
      );
    } else if (root === "eval.local.root") {
      return zeroSequence([
        makeExpressionEffect(
          makeApplyExpression(
            makeReadExpression("super.call", hash),
            makeIntrinsicExpression("undefined", hash),
            [operation.input],
            hash,
          ),
          hash,
        ),
      ]);
    } else {
      throw new AranTypeError(root);
    }
  } else {
    throw new AranTypeError(routine);
  }
};

/**
 * @type {(
 *   origin: "closure" | "program",
 *   result: import("../../atom").Expression | null,
 * ) => import(".").UpdateResultOperation}
 */
export const makeUpdateResultOperation = (origin, result) => ({
  origin,
  result,
});

/**
 * @type {import("../api").PerformEffect<
 *   import(".").RoutineScope,
 *   import(".").UpdateResultOperation,
 *   import("../../prelude").SyntaxErrorPrelude,
 * >}
 */
export const listUpdateResultEffect = (hash, _meta, { routine }, operation) => {
  if (getOriginKind(routine) !== operation.origin) {
    return liftSequenceX(
      concat_,
      liftSequenceX_(
        makeExpressionEffect,
        initSyntaxErrorExpression("Illegal 'result' update", hash),
        hash,
      ),
    );
  } else {
    if (routine.result === null) {
      if (operation.result === null) {
        return EMPTY_SEQUENCE;
      } else {
        return zeroSequence([makeExpressionEffect(operation.result, hash)]);
      }
    } else {
      return zeroSequence([
        makeWriteCacheEffect(
          routine.result,
          operation.result ?? makeIntrinsicExpression("undefined", hash),
          hash,
        ),
      ]);
    }
  }
};
