import { AranExecError, AranTypeError } from "../../../../error.mjs";
import {
  EMPTY,
  initSequence,
  mapSequence,
  zeroSequence,
  flatenTree,
  includes,
} from "../../../../util/index.mjs";
import { makeBinaryExpression } from "../../../intrinsic.mjs";
import {
  listExpressionEffect,
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
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "../error.mjs";
import { mangleWritableMetaVariable } from "../../../mangle.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../../cache.mjs";

/**
 * @type {(
 *   status: import(".").Status,
 *   closure: import("..").Closure,
 * ) => import(".").Status}
 */
const updateStatus = (status, closure) => {
  switch (status) {
    case "live": {
      return "live";
    }
    case "dead": {
      switch (closure) {
        case "internal": {
          return "dead";
        }
        case "external": {
          return "schrodinger";
        }
        default: {
          throw new AranTypeError(closure);
        }
      }
    }
    case "schrodinger": {
      return "schrodinger";
    }
    default: {
      throw new AranTypeError(status);
    }
  }
};

/**
 * @type {import("../../api").Setup<
 *   {
 *     binding: [
 *       import("estree-sentry").VariableName,
 *       import(".").RootKind[],
 *     ],
 *   },
 *   (
 *     | import("../../../prelude").HeaderPrelude
 *     | import("../../../prelude").PrefixPrelude
 *     | import("../../../prelude").MetaDeclarationPrelude
 *     | import("../../../prelude").WarningPrelude
 *   ),
 *   null | import(".").AlienBinding,
 * >}
 */
export const setupAlienBinding = (
  hash,
  meta,
  { binding: { 0: variable, 1: kinds } },
) => {
  if (
    includes(kinds, "let") ||
    includes(kinds, "const") ||
    includes(kinds, "class")
  ) {
    const writable = !includes(kinds, "const");
    const deadzone = mangleWritableMetaVariable(meta);
    return initSequence(
      [
        makeHeaderPrelude({
          type: "declare",
          kind: "let",
          variable,
        }),
        makeMetaDeclarationPrelude([deadzone, "aran.deadzone"]),
        makeWarningPrelude({
          name: "ExternalDeadzone",
          hash,
        }),
        writable
          ? null
          : makeWarningPrelude({ name: "ExternalConstant", hash }),
      ],
      {
        type: "record",
        write: writable ? "perform" : "report",
        variable,
        deadzone,
        status: "dead",
      },
    );
  } else {
    return initSequence(
      [
        makeHeaderPrelude({
          type: "declare",
          kind: "var",
          variable,
        }),
        includes(kinds, "function-sloppy-away")
          ? makeWarningPrelude({ name: "ExternalSloppyFunction", hash })
          : null,
      ],
      null,
    );
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
 *   hash: import("../../../hash").Hash,
 *   root: import("../../../sort").RootSort,
 *   operation: {
 *     mode: import("../../../mode").Mode,
 *     name: "write" | "discard" | "read" | "typeof",
 *   },
 * ) => import("../../../atom").Expression}
 */
const resolveArrowExpression = (hash, root, { mode, name }) => {
  if (root === "script" || root === "module" || root === "eval.global") {
    if (name === "write") {
      return makeIntrinsicExpression(
        `aran.writeGlobalVariable${MODE[mode]}`,
        hash,
      );
    } else if (name === "read" || name === "typeof" || name === "discard") {
      return makeIntrinsicExpression(`aran.${name}GlobalVariable`, hash);
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
 * @type {import("../../api").PerformEffect<
 *   import(".").AlienMatch,
 *   import("..").LateDeclareVariableOperation,
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
  { root },
  { mode, variable },
) => {
  switch (mode) {
    case "sloppy": {
      if (root === "eval.local.root") {
        return initSequence(
          makeWarningPrelude({
            name: "ExternalLateDeclaration",
            hash,
          }),
          null,
        );
      } else if (
        root === "eval.global" ||
        root === "script" ||
        root === "module"
      ) {
        return initSequence(makeNativeExternalPrelude(variable), EMPTY);
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
 * @type {import("../../api").Perform<
 *   import(".").AlienMatch,
 *   import("..").InitializeVariableOperation,
 *   never,
 *   [
 *     import("../../../atom").Effect[],
 *     import(".").AlienBinding,
 *   ],
 * >}
 */
export const listAlienInitializeEffect = (
  hash,
  _meta,
  { root, binding },
  { mode, variable, right },
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
  }
  if (binding.status !== "dead") {
    throw new AranExecError("duplicate initialization", {
      hash,
      root,
      mode,
      binding,
      variable,
      right,
    });
  }
  return zeroSequence([
    [
      makeExpressionEffect(
        makeApplyExpression(
          resolveArrowExpression(hash, root, { name: "write", mode }),
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
    {
      variable,
      deadzone: binding.deadzone,
      status: "live",
      write: binding.write,
    },
  ]);
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   bind: {
 *     root: import("../../../sort").RootSort,
 *     write: import(".").Write,
 *   },
 *   operation: import("..").WriteVariableOperation,
 * ) => import("../../../../util/tree").Tree<import("../../../atom").Effect>}
 */
const listLiveWriteEffect = (
  hash,
  { root, write },
  { mode, variable, right },
) => {
  switch (write) {
    case "perform": {
      return makeExpressionEffect(
        makeApplyExpression(
          resolveArrowExpression(hash, root, { name: "write", mode }),
          makeIntrinsicExpression("undefined", hash),
          [makePrimitiveExpression(variable, hash), right],
          hash,
        ),
        hash,
      );
    }
    // Global const are turned into global let.
    // Alhough other programs will be able able to write it,
    // we can at least prevent this program from overwritting it.
    case "report": {
      return [
        listExpressionEffect(right, hash),
        makeExpressionEffect(makeThrowConstantExpression(variable, hash), hash),
      ];
    }
    default: {
      throw new AranTypeError(write);
    }
  }
};

/**
 * @type {import("../../api").PerformEffect<
 *   import(".").AlienMatch,
 *   import("..").WriteVariableOperation,
 *   never,
 * >}
 */
export const listAlienWriteWriteSloppyFunctionEffect = (
  hash,
  _meta,
  { root, binding },
  operation,
) => {
  if (binding === null) {
    return zeroSequence(
      listLiveWriteEffect(hash, { root, write: "perform" }, operation),
    );
  } else {
    return zeroSequence(listExpressionEffect(operation.right, hash));
  }
};

/**
 * @type {import("../../api").PerformEffect<
 *   import(".").AlienMatch,
 *   import("..").WriteVariableOperation,
 *   import("../../../prelude").MetaDeclarationPrelude,
 * >}
 */
export const listAlienWriteEffect = (
  hash,
  meta,
  { root, binding },
  operation,
) => {
  if (binding === null) {
    return zeroSequence(
      listLiveWriteEffect(hash, { root, write: "perform" }, operation),
    );
  } else {
    const status = updateStatus(binding.status, operation.closure);
    switch (status) {
      case "live": {
        return zeroSequence(
          listLiveWriteEffect(hash, { root, write: binding.write }, operation),
        );
      }
      case "dead": {
        return zeroSequence([
          listExpressionEffect(operation.right, hash),
          makeExpressionEffect(
            makeThrowConstantExpression(operation.variable, hash),
            hash,
          ),
        ]);
      }
      case "schrodinger": {
        return incorporateEffect(
          mapSequence(cacheConstant(meta, operation.right, hash), (right) =>
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
              flatenTree(
                listLiveWriteEffect(
                  hash,
                  { root, write: binding.write },
                  {
                    ...operation,
                    right: makeReadCacheExpression(right, hash),
                  },
                ),
              ),
              hash,
            ),
          ),
          hash,
        );
      }
      default: {
        throw new AranTypeError(status);
      }
    }
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   root: import("../../../sort").RootSort,
 *   operation: {
 *     mode: import("../../../mode").Mode,
 *     name: "read" | "typeof" | "discard",
 *     variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("../../../atom").Expression}
 */
const makeLoadExpression = (hash, root, { mode, name, variable }) =>
  makeApplyExpression(
    resolveArrowExpression(hash, root, { name, mode }),
    makeIntrinsicExpression("undefined", hash),
    [makePrimitiveExpression(variable, hash)],
    hash,
  );

/**
 * @type {(
 *   name: "read" | "typeof",
 * ) => import("../../api").PerformExpression<
 *   import(".").AlienMatch,
 *   import("..").VariableOperation,
 *   never,
 * >}
 */
const compileMakeLookupExpression =
  (name) =>
  (hash, _meta, { root, binding }, { mode, variable, closure }) => {
    if (binding === null) {
      return zeroSequence(
        makeLoadExpression(hash, root, { mode, name, variable }),
      );
    } else {
      const status = updateStatus(binding.status, closure);
      switch (status) {
        case "live": {
          return zeroSequence(
            makeLoadExpression(hash, root, { mode, name, variable }),
          );
        }
        case "dead": {
          return zeroSequence(makeThrowDeadzoneExpression(variable, hash));
        }
        case "schrodinger": {
          return zeroSequence(
            makeConditionalExpression(
              makeBinaryExpression(
                "===",
                makeReadExpression(binding.deadzone, hash),
                makeIntrinsicExpression("aran.deadzone", hash),
                hash,
              ),
              makeThrowDeadzoneExpression(variable, hash),
              makeLoadExpression(hash, root, { mode, name, variable }),
              hash,
            ),
          );
        }
        default: {
          throw new AranTypeError(status);
        }
      }
    }
  };

export const makeAlienReadExpression = compileMakeLookupExpression("read");

export const makeAlienTypeofExpression = compileMakeLookupExpression("typeof");

/**
 * @type {import("../../api").PerformExpression<
 *   import(".").AlienMatch,
 *   import("..").VariableOperation,
 *   never,
 * >}
 */
export const makeAlienDiscardExpression = (
  hash,
  _meta,
  { root },
  { mode, variable },
) =>
  zeroSequence(
    makeLoadExpression(hash, root, { name: "discard", mode, variable }),
  );
