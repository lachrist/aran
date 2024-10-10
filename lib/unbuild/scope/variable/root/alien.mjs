import { AranExecError, AranTypeError } from "../../../../report.mjs";
import { EMPTY, concat_X, concat___XX } from "../../../../util/index.mjs";
import { makeBinaryExpression } from "../../../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeWriteEffect,
} from "../../../node.mjs";
import {
  incorporateEffect,
  makeHeaderPrelude,
  makeMetaDeclarationPrelude,
  makeNativeExternalPrelude,
  makeWarningPrelude,
} from "../../../prelude/index.mjs";
import {
  EMPTY_SEQUENCE,
  initSequence,
  mapSequence,
  zeroSequence,
} from "../../../../sequence.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "../error.mjs";
import { mangleWritableMetaVariable } from "../../../mangle.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../../cache.mjs";

/**
 * @type {(
 *   initialization: "yes" | "no",
 *   closure: boolean,
 * ) => "yes" | "no" | "maybe"}
 */
const getInitialization = (initialization, closure) => {
  switch (initialization) {
    case "yes": {
      return "yes";
    }
    case "no": {
      return closure ? "maybe" : "no";
    }
    default: {
      throw new AranTypeError(initialization);
    }
  }
};

/**
 * @type {import("../../perform").Setup<
 *   import("../../../annotation/hoisting").Binding,
 *   (
 *     | import("../../../prelude").HeaderPrelude
 *     | import("../../../prelude").PrefixPrelude
 *     | import("../../../prelude").MetaDeclarationPrelude
 *     | import("../../../prelude").WarningPrelude
 *   ),
 *   null | import(".").AlienBinding,
 * >}
 */
export const setupAlienBinding = (hash, meta, binding) => {
  switch (binding.baseline) {
    case "live": {
      if (binding.write !== "perform") {
        throw new AranExecError(
          "only perform write is supported in live binding",
          {
            hash,
            meta,
            binding,
          },
        );
      } else {
        return initSequence(
          concat_X(
            makeHeaderPrelude({
              type: "declare",
              kind: "var",
              variable: binding.variable,
            }),
            binding.sloppy_function !== null
              ? [makeWarningPrelude({ name: "ExternalSloppyFunction", hash })]
              : EMPTY,
          ),
          null,
        );
      }
    }
    case "dead": {
      if (binding.write === "ignore") {
        throw new AranExecError(
          "silent constant are not supported in global frame",
          {
            hash,
            meta,
            binding,
          },
        );
      } else {
        const deadzone = mangleWritableMetaVariable(meta);
        return initSequence(
          concat___XX(
            makeHeaderPrelude({
              type: "declare",
              kind: "let",
              variable: binding.variable,
            }),
            makeMetaDeclarationPrelude([deadzone, "aran.deadzone"]),
            makeWarningPrelude({
              name: "ExternalDeadzone",
              hash,
            }),
            binding.write === "report"
              ? [makeWarningPrelude({ name: "ExternalConstant", hash })]
              : EMPTY,
            binding.sloppy_function !== null
              ? [makeWarningPrelude({ name: "ExternalSloppyFunction", hash })]
              : EMPTY,
          ),
          {
            type: "record",
            write: binding.write,
            variable: binding.variable,
            deadzone,
            initialization: "no",
          },
        );
      }
    }
    default: {
      throw new AranTypeError(binding.baseline);
    }
  }
};

/**
 * @type {{
 *   sloppy: "Sloppy",
 *   strict: "Strict",
 * }}
 */
const MODE = {
  sloppy: "Sloppy",
  strict: "Strict",
};

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   bind: {
 *     mode: "strict" | "sloppy",
 *     root: import("../../../sort").RootSort,
 *   },
 *   name: "write" | "discard" | "read" | "typeof",
 * ) => import("../../../atom").Expression}
 */
const resolveArrowExpression = (hash, { mode, root }, name) => {
  if (root === "script" || root === "module" || root === "eval.global") {
    if (name === "write") {
      return makeIntrinsicExpression(`aran.writeGlobal${MODE[mode]}`, hash);
    } else if (name === "read" || name === "typeof" || name === "discard") {
      return makeIntrinsicExpression(`aran.${name}Global`, hash);
    } else {
      throw new AranTypeError(name);
    }
  } else if (root === "eval.local.root") {
    if (name === "write") {
      return makeReadExpression(`scope.write${MODE[mode]}`, hash);
    } else if (name === "read" || name === "typeof" || name === "discard") {
      return makeReadExpression(`scope.${name}`, hash);
    } else {
      throw new AranTypeError(name);
    }
  } else {
    throw new AranTypeError(root);
  }
};

/**
 * @type {import("../../perform").PerformEffect<
 *   import(".").AlienBind,
 *   import("../").LateDeclareVariableOperation,
 *   (
 *     | import("../../../prelude").WarningPrelude
 *     | import("../../../prelude").ReifyExternalPrelude
 *     | import("../../../prelude").NativeExternalPrelude
 *   ),
 * >}
 */
export const listAlienLateDeclareEffect = (
  hash,
  _meta,
  { mode, root },
  { variable },
) => {
  switch (mode) {
    case "sloppy": {
      if (root === "eval.local.root") {
        return initSequence(
          [
            makeWarningPrelude({
              name: "ExternalLateDeclaration",
              hash,
            }),
          ],
          EMPTY,
        );
      } else if (
        root === "eval.global" ||
        root === "script" ||
        root === "module"
      ) {
        return initSequence([makeNativeExternalPrelude(variable)], EMPTY);
      } else {
        throw new AranTypeError(root);
      }
    }
    case "strict": {
      throw new AranExecError("late declaration in strict mode", {
        hash,
        mode,
        root,
        variable,
      });
    }
    default: {
      throw new AranTypeError(mode);
    }
  }
};

/**
 * @type {import("../../perform").Perform<
 *   import(".").AlienBind,
 *   import("../").InitializeVariableOperation,
 *   import("../../../../sequence").Sequence<
 *     never,
 *     {
 *       main: import("../../../atom").Effect[],
 *       auxi: import(".").AlienBinding,
 *     },
 *   >,
 * >}
 */
export const listAlienInitializeEffect = (
  hash,
  _meta,
  { root, mode, binding },
  { variable, right },
) => {
  if (binding === null) {
    throw new AranExecError("missing binding for initialization", {
      hash,
      root,
      mode,
      binding,
      variable,
      right,
    });
  } else {
    switch (binding.initialization) {
      case "yes": {
        throw new AranExecError("duplicate initialization", {
          hash,
          root,
          mode,
          binding,
          variable,
          right,
        });
      }
      case "no": {
        return zeroSequence({
          main: [
            makeExpressionEffect(
              makeApplyExpression(
                resolveArrowExpression(hash, { mode, root }, "write"),
                makeIntrinsicExpression("undefined", hash),
                [makePrimitiveExpression(variable, hash), right],
                hash,
              ),
              hash,
            ),
            makeWriteEffect(
              binding.deadzone,
              makeIntrinsicExpression("undefined", hash),
              hash,
            ),
          ],
          auxi: {
            variable,
            deadzone: binding.deadzone,
            initialization: "yes",
            write: binding.write,
          },
        });
      }
      default: {
        throw new AranTypeError(binding.initialization);
      }
    }
  }
};

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   bind: {
 *     mode: import("../../../mode").Mode,
 *     root: import("../../../sort").RootSort,
 *     write: import(".").Write,
 *   },
 *   operation: import("../").WriteVariableOperation,
 * ) => import("../../../atom").Effect[]}
 */
const listLiveWriteEffect = (
  hash,
  { mode, root, write },
  { variable, right },
) => {
  switch (write) {
    case "perform": {
      return [
        makeExpressionEffect(
          makeApplyExpression(
            resolveArrowExpression(hash, { mode, root }, "write"),
            makeIntrinsicExpression("undefined", hash),
            [makePrimitiveExpression(variable, hash), right],
            hash,
          ),
          hash,
        ),
      ];
    }
    // Global const are turned into global let.
    // Alhough other programs will be able able to write it,
    // we can at least prevent this program from overwritting it.
    case "report": {
      return [
        makeExpressionEffect(right, hash),
        makeExpressionEffect(makeThrowConstantExpression(variable, hash), hash),
      ];
    }
    default: {
      throw new AranTypeError(write);
    }
  }
};

/**
 * @type {import("../../perform").PerformEffect<
 *   import(".").AlienBind,
 *   import("../").WriteVariableOperation,
 *   import("../../../prelude").MetaDeclarationPrelude,
 * >}
 */
export const listAlienWriteEffect = (
  hash,
  meta,
  { mode, root, binding },
  operation,
) => {
  if (binding === null) {
    return zeroSequence(
      listLiveWriteEffect(hash, { mode, root, write: "perform" }, operation),
    );
  } else {
    const initialization = getInitialization(
      binding.initialization,
      operation.closure,
    );
    switch (initialization) {
      case "yes": {
        return zeroSequence(
          listLiveWriteEffect(
            hash,
            { mode, root, write: binding.write },
            operation,
          ),
        );
      }
      case "no": {
        return zeroSequence([
          makeExpressionEffect(operation.right, hash),
          makeExpressionEffect(
            makeThrowConstantExpression(operation.variable, hash),
            hash,
          ),
        ]);
      }
      case "maybe": {
        return incorporateEffect(
          mapSequence(cacheConstant(meta, operation.right, hash), (right) => [
            makeConditionalEffect(
              makeBinaryExpression(
                "===",
                makeReadExpression(binding.deadzone, hash),
                makeIntrinsicExpression("aran.deadzone", hash),
                hash,
              ),
              [
                makeExpressionEffect(
                  makeThrowDeadzoneExpression(operation.variable, hash),
                  hash,
                ),
              ],
              listLiveWriteEffect(
                hash,
                { mode, root, write: binding.write },
                {
                  ...operation,
                  right: makeReadCacheExpression(right, hash),
                },
              ),
              hash,
            ),
          ]),
          hash,
        );
      }
      default: {
        throw new AranTypeError(initialization);
      }
    }
  }
};

/**
 * @type {import("../../perform").PerformEffect<
 *   import(".").AlienBind,
 *   import("../").WriteSloppyFunctionVariableOperation,
 *   import("../../../prelude").MetaDeclarationPrelude,
 * >}
 */
export const listAlienWriteSloppyFunctionEffect = (
  hash,
  meta,
  match,
  operation,
) => {
  if (operation.right === null) {
    return EMPTY_SEQUENCE;
  } else {
    return listAlienWriteEffect(hash, meta, match, {
      ...operation,
      right: makeReadExpression(operation.right, hash),
    });
  }
};

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   bind: {
 *     mode: import("../../../mode").Mode,
 *     root: import("../../../sort").RootSort,
 *   },
 *   operation: {
 *     name: "read" | "typeof" | "discard",
 *     variable: import("estree-sentry").VariableName,
 *   }
 * ) => import("../../../atom").Expression}
 */
const makeLiveLoadExpression = (hash, bind, { name, variable }) =>
  makeApplyExpression(
    resolveArrowExpression(hash, bind, name),
    makeIntrinsicExpression("undefined", hash),
    [makePrimitiveExpression(variable, hash)],
    hash,
  );

/**
 * @type {<O extends {
 *   variable: import("estree-sentry").VariableName,
 *   closure: boolean,
 * }>(
 *   name: "read" | "typeof",
 * ) => import("../../perform").PerformExpression<
 *   import(".").AlienBind,
 *   O,
 *   never,
 * >}
 */
const compileMakeLookupExpression =
  (name) =>
  (hash, _meta, { root, mode, binding }, { variable, closure }) => {
    if (binding === null) {
      return zeroSequence(
        makeLiveLoadExpression(hash, { root, mode }, { name, variable }),
      );
    } else {
      const initialization = getInitialization(binding.initialization, closure);
      switch (initialization) {
        case "yes": {
          return zeroSequence(
            makeLiveLoadExpression(hash, { root, mode }, { name, variable }),
          );
        }
        case "no": {
          return zeroSequence(makeThrowDeadzoneExpression(variable, hash));
        }
        case "maybe": {
          return zeroSequence(
            makeConditionalExpression(
              makeBinaryExpression(
                "===",
                makeReadExpression(binding.deadzone, hash),
                makeIntrinsicExpression("aran.deadzone", hash),
                hash,
              ),
              makeThrowDeadzoneExpression(variable, hash),
              makeLiveLoadExpression(hash, { root, mode }, { name, variable }),
              hash,
            ),
          );
        }
        default: {
          throw new AranTypeError(initialization);
        }
      }
    }
  };

export const makeAlienReadExpression = compileMakeLookupExpression("read");

export const makeAlienTypeofExpression = compileMakeLookupExpression("typeof");

/**
 * @type {import("../../perform").PerformExpression<
 *   import(".").AlienBind,
 *   import("../").DiscardVariableOperation,
 *   never,
 * >}
 */
export const makeAlienDiscardExpression = (hash, _meta, match, { variable }) =>
  zeroSequence(
    makeLiveLoadExpression(hash, match, { name: "discard", variable }),
  );
