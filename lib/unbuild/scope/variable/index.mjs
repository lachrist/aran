import { AranExecError, AranTypeError } from "../../../error.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";
import {
  bindSequence,
  mapSequence,
  zeroSequence,
  hasNarrowKey,
  map,
  initSequence,
} from "../../../util/index.mjs";
import {
  listEvalLateDeclareEffect,
  listEvalWriteEffect,
  listEvalWriteSloppyFunctionEffect,
  makeEvalDiscardExpression,
  makeEvalReadAmbientThisExpression,
  makeEvalReadExpression,
  makeEvalTypeofExpression,
  setupEvalFrame,
} from "./eval/index.mjs";
import {
  listIllegalSaveEffect,
  makeIllegalLoadExpression,
  setupIllegalFrame,
} from "./illegal/index.mjs";
import {
  listProxyInitializeEffect,
  listProxyLateDeclareEffect,
  listProxyWriteEffect,
  listProxyWriteSloppyFunctionEffect,
  makeProxyDiscardExpression,
  makeProxyReadAmbientThisExpression,
  makeProxyReadExpression,
  makeProxyTypeofExpression,
  setupProxyFrame,
} from "./proxy/index.mjs";
import {
  listRegularInitializeEffect,
  listRegularLateDeclareEffect,
  listRegularWriteEffect,
  listRegularWriteSloppyFunctionEffect,
  makeRegularDiscardExpression,
  makeRegularReadAmbientThisExpression,
  makeRegularReadExpression,
  makeRegularTypeofExpression,
  setupModuleRegularFrame,
  setupNormalRegularFrame,
  setupSwitchRegularFrame,
} from "./regular/index.mjs";
import {
  hydrateRootFrame,
  listRootInitializeEffect,
  listRootLateDeclareEffect,
  listRootWriteEffect,
  listRootWriteSloppyFunctionEffect,
  makeRootDiscardExpression,
  makeRootReadAmbientThisExpression,
  makeRootReadExpression,
  makeRootTypeofExpression,
  setupRootFrame,
} from "./root/index.mjs";
import {
  listWithLateDeclareEffect,
  listWithWriteEffect,
  listWithWriteSloppyFunctionEffect,
  makeWithDiscardExpression,
  makeWithReadAmbientThisExpression,
  makeWithReadExpression,
  makeWithTypeofExpression,
  setupWithFrame,
} from "./with/index.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../cache.mjs";
import { KEYWORD_RECORD, STRICT_KEYWORD_RECORD } from "estree-sentry";
import {
  incorporateEffect,
  incorporateExpression,
  makeSyntaxErrorPrelude,
} from "../../prelude/index.mjs";

/**
 * @type {<O>(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   operation: O,
 * ) => import("../../../util/sequence").Sequence<never, [O, O]>}
 */
const duplicateOperation = (_hash, _meta, operation) =>
  zeroSequence([operation, operation]);

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   operation: import(".").WriteVariableOperation,
 * ) => import("../../../util/sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   [
 *     import(".").WriteVariableOperation,
 *     import(".").WriteVariableOperation,
 *   ],
 * >}
 */
const duplicateWriteOperation = (hash, meta, operation) =>
  mapSequence(cacheConstant(meta, operation.right, hash), (right) => [
    { ...operation, right: makeReadCacheExpression(right, hash) },
    { ...operation, right: makeReadCacheExpression(right, hash) },
  ]);

/**
 * @type {<O extends { closure: import(".").Closure }>(
 *   operation: O,
 * ) => O}
 */
const escapeOperation = (operation) => {
  switch (operation.closure) {
    case "internal": {
      return { ...operation, closure: "external" };
    }
    case "external": {
      return operation;
    }
    default: {
      throw new AranTypeError(operation.closure);
    }
  }
};

///////////
// check //
///////////

/**
 * @type {(
 *   mode: import("../../mode").Mode,
 *   access: "load" | "save" | "init",
 *   variable: import("estree-sentry").VariableName,
 * ) => string[]}
 */
const listSyntaxErrorMessage = (mode, access, variable) => {
  if (hasNarrowKey(KEYWORD_RECORD, variable)) {
    return [`Illegal keyword identifier: ${variable}`];
  }
  if (mode === "strict" && hasNarrowKey(STRICT_KEYWORD_RECORD, variable)) {
    return [`Illegal strict keyword identifier: ${variable}`];
  }
  if (
    mode === "strict" &&
    access === "save" &&
    (variable === "eval" || variable === "arguments")
  ) {
    return [`Illegal write to '${variable}' in strict mode`];
  }
  return [];
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   mode: import("../../mode").Mode,
 *   access: "load" | "save" | "init",
 *   variable: import("estree-sentry").VariableName,
 * ) => import("../../prelude").SyntaxErrorPrelude[]}
 */
const listSyntaxErrorPrelude = (hash, mode, access, variable) =>
  map(listSyntaxErrorMessage(mode, access, variable), (message) =>
    makeSyntaxErrorPrelude({
      origin: hash,
      message,
    }),
  );

///////////////
// Operation //
///////////////

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   mode: import("../../mode").Mode,
 *   variable: import("estree-sentry").VariableName,
 *   right: import("../../atom").Expression,
 * ) => import("../../../util/sequence").Sequence<
 *   import("../../prelude").SyntaxErrorPrelude,
 *   {
 *     variable: import("estree-sentry").VariableName;
 *     right: import("../../atom").Expression;
 *   },
 * >}
 */
export const makeSaveVariableOperation = (hash, mode, variable, right) =>
  initSequence(listSyntaxErrorPrelude(hash, mode, "save", variable), {
    variable,
    right,
  });

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   mode: import("../../mode").Mode,
 *   variable: import("estree-sentry").VariableName,
 *   right: import("../../atom").Expression,
 * ) => import("../../../util/sequence").Sequence<
 *   import("../../prelude").SyntaxErrorPrelude,
 *   {
 *     variable: import("estree-sentry").VariableName;
 *     right: import("../../atom").Expression;
 *   },
 * >}
 */
export const makeInitVariableOperation = (hash, mode, variable, right) =>
  initSequence(listSyntaxErrorPrelude(hash, mode, "init", variable), {
    variable,
    right,
  });

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   mode: import("../../mode").Mode,
 *   variable: import("estree-sentry").VariableName,
 * ) => import("../../../util/sequence").Sequence<
 *   import("../../prelude").SyntaxErrorPrelude,
 *   {
 *     variable: import("estree-sentry").VariableName;
 *   },
 * >}
 */
export const makeLoadVariableOperation = (hash, mode, variable) =>
  initSequence(listSyntaxErrorPrelude(hash, mode, "load", variable), {
    variable,
  });

////////////
// Extend //
////////////

export const INITIAL_VARIABLE = null;

/** @type {import(".").ClosureFrame} */
export const CLOSURE_FRAME = { type: "closure" };

/**
 * @type {<S extends import("..").Scope>(
 *   scope: S,
 * ) => S}
 */
export const extendClosureVariable = (scope) => ({
  ...scope,
  variable: [CLOSURE_FRAME, scope.variable],
});

/**
 * @type {<O, W>(
 *   setupFrame: import("../api").Setup<O, W, import(".").VariableFrame>,
 * ) => import("../api").Extend<O, W, import(".").VariableScope>}
 */
const compileExtend = (setupFrame) => (hash, meta, options, scope) =>
  mapSequence(setupFrame(hash, meta, options), (frame) => ({
    ...scope,
    variable: [frame, scope.variable],
  }));

export const extendEvalVariable = compileExtend(setupEvalFrame);

export const extendIllegalVariable = compileExtend(setupIllegalFrame);

export const extendProxyVariable = compileExtend(setupProxyFrame);

export const extendNormalRegularVariable = compileExtend(
  setupNormalRegularFrame,
);

export const extendSwitchRegularVariable = compileExtend(
  setupSwitchRegularFrame,
);

export const extendModuleRegularVariable = compileExtend(
  setupModuleRegularFrame,
);

export const extendRootVariable = compileExtend(setupRootFrame);

export const extendWithVariable = compileExtend(setupWithFrame);

//////////////
// Standard //
//////////////

/**
 * @type {<
 *   O extends { closure: import(".").Closure },
 *   W1, W2, W3, W4, W5, W6,
 *   X,
 * >(
 *   duplicate: import(".").DuplicateOperation<O>,
 *   incorporate: import(".").Incorporate<X>,
 *   perform: import(".").PerformStandard<O, W1, W2, W3, W4, W5, W6, X>,
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   root: import("../../sort").RootSort,
 *   frames: import("../../../util/list").List<import(".").VariableFrame>,
 *   operation: O,
 * ) => import("../../../util/sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | W1 | W2 | W3 | W4 | W5 | W6
 *   ),
 *   X,
 * >}
 */
export const loopStandard = (
  duplicate,
  incorporate,
  perform,
  hash,
  meta,
  root,
  frames,
  operation,
) => {
  if (frames === null) {
    throw new AranExecError("missing binding frame", { hash, operation });
  } else {
    const { 0: head, 1: tail } = frames;
    switch (head.type) {
      case "eval": {
        switch (perform.performEval.type) {
          case "intercept": {
            const performEval = perform.performEval.data;
            return incorporate(
              bindSequence(
                duplicate(hash, forkMeta((meta = nextMeta(meta))), operation),
                ({ 0: operation1, 1: operation2 }) =>
                  bindSequence(
                    loopStandard(
                      duplicate,
                      incorporate,
                      perform,
                      hash,
                      forkMeta((meta = nextMeta(meta))),
                      root,
                      tail,
                      operation1,
                    ),
                    (alternate) =>
                      performEval(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        head,
                        operation2,
                        alternate,
                      ),
                  ),
              ),
              hash,
            );
          }
          case "perform": {
            const performEval = perform.performEval.data;
            return performEval(hash, meta, head, operation);
          }
          default: {
            throw new AranTypeError(perform.performEval);
          }
        }
      }
      case "illegal": {
        const { performIllegal } = perform;
        const result = performIllegal(hash, meta, head, operation);
        return result === null
          ? loopStandard(
              duplicate,
              incorporate,
              perform,
              hash,
              meta,
              root,
              tail,
              operation,
            )
          : result;
      }
      case "proxy": {
        const { performProxy } = perform;
        const result = performProxy(hash, meta, head, operation);
        return result === null
          ? loopStandard(
              duplicate,
              incorporate,
              perform,
              hash,
              meta,
              root,
              tail,
              operation,
            )
          : result;
      }
      case "regular": {
        const { performRegular } = perform;
        const result = performRegular(hash, meta, head, operation);
        return result === null
          ? loopStandard(
              duplicate,
              incorporate,
              perform,
              hash,
              meta,
              root,
              tail,
              operation,
            )
          : result;
      }
      case "root": {
        const { performRoot } = perform;
        return performRoot(hash, meta, hydrateRootFrame(head, root), operation);
      }
      case "with": {
        const { performWith } = perform;
        return incorporate(
          bindSequence(
            duplicate(hash, forkMeta((meta = nextMeta(meta))), operation),
            ({ 0: operation1, 1: operation2 }) =>
              bindSequence(
                loopStandard(
                  duplicate,
                  incorporate,
                  perform,
                  hash,
                  forkMeta((meta = nextMeta(meta))),
                  root,
                  tail,
                  operation1,
                ),
                (alternate) =>
                  performWith(
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    head,
                    operation2,
                    alternate,
                  ),
              ),
          ),
          hash,
        );
      }
      case "closure": {
        return loopStandard(
          duplicate,
          incorporate,
          perform,
          hash,
          meta,
          root,
          tail,
          escapeOperation(operation),
        );
      }
      default: {
        throw new AranTypeError(head);
      }
    }
  }
};

/**
 * @type {<
 *   R extends { variable: import("estree-sentry").VariableName },
 *   O extends { closure: import(".").Closure },
 *   W1, W2, W3, W4, W5, W6, X,
 * >(
 *   initialize: import(".").InitializeOperation<R, O>,
 *   duplicate: import(".").DuplicateOperation<O>,
 *   incorporate: import(".").Incorporate<X>,
 *   perform: import(".").PerformStandard<O, W1, W2, W3, W4, W5, W6, X>,
 * ) => import("../api").Perform<
 *   import(".").VariableScope,
 *   R,
 *   (
 *     | import("../../prelude").SyntaxErrorPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | W1 | W2 | W3 | W4 | W5 | W6
 *   ),
 *   X,
 * >}
 */
export const compileStandard =
  (initialize, duplicate, incorporate, perform) =>
  (hash, meta, { mode, root, variable }, operation) =>
    loopStandard(
      duplicate,
      incorporate,
      perform,
      hash,
      meta,
      root,
      variable,
      initialize(operation, mode),
    );

/**
 * @type {(
 *   raw_operation: {
 *     variable: import("estree-sentry").VariableName,
 *   },
 *   mode: import("../../mode").Mode,
 * ) => import(".").VariableOperation}
 */
const initializeOperation = ({ variable }, mode) => ({
  variable,
  mode,
  closure: "internal",
});

/**
 * @type {(
 *   raw_operation: {
 *     variable: import("estree-sentry").VariableName,
 *     right: import("../../atom").Expression,
 *   },
 *   mode: import("../../mode").Mode,
 * ) => import(".").WriteVariableOperation}
 */
const initializeWriteOperation = ({ variable, right }, mode) => ({
  variable,
  closure: "internal",
  mode,
  right,
});

/**
 * @type {(
 *   raw_operation: {
 *     variable: import("estree-sentry").VariableName,
 *     conflict: "ignore" | "report",
 *   },
 *   mode: import("../../mode").Mode,
 * ) => import(".").LateDeclareVariableOperation}
 */
const initializeLateDeclareOperation = ({ variable, conflict }, mode) => ({
  variable,
  closure: "internal",
  mode,
  conflict,
});

export const makeReadVariableExpression = compileStandard(
  initializeOperation,
  duplicateOperation,
  /** @type {any} */ (incorporateExpression),
  {
    performEval: {
      type: "intercept",
      data: makeEvalReadExpression,
    },
    performIllegal: makeIllegalLoadExpression,
    performProxy: makeProxyReadExpression,
    performRegular: makeRegularReadExpression,
    performRoot: makeRootReadExpression,
    performWith: makeWithReadExpression,
  },
);

export const makeTypeofVariableExpression = compileStandard(
  initializeOperation,
  duplicateOperation,
  /** @type {any} */ (incorporateExpression),
  {
    performEval: {
      type: "intercept",
      data: makeEvalTypeofExpression,
    },
    performIllegal: makeIllegalLoadExpression,
    performProxy: makeProxyTypeofExpression,
    performRegular: makeRegularTypeofExpression,
    performRoot: makeRootTypeofExpression,
    performWith: makeWithTypeofExpression,
  },
);

export const makeDiscardVariableExpression = compileStandard(
  initializeOperation,
  duplicateOperation,
  /** @type {any} */ (incorporateExpression),
  {
    performEval: {
      type: "intercept",
      data: makeEvalDiscardExpression,
    },
    performIllegal: makeIllegalLoadExpression,
    performProxy: makeProxyDiscardExpression,
    performRegular: makeRegularDiscardExpression,
    performRoot: makeRootDiscardExpression,
    performWith: makeWithDiscardExpression,
  },
);

export const makeReadAmbientThisExpression = compileStandard(
  initializeOperation,
  duplicateOperation,
  /** @type {any} */ (incorporateExpression),
  {
    performEval: {
      type: "intercept",
      data: makeEvalReadAmbientThisExpression,
    },
    performIllegal: makeIllegalLoadExpression,
    performProxy: makeProxyReadAmbientThisExpression,
    performRegular: makeRegularReadAmbientThisExpression,
    performRoot: makeRootReadAmbientThisExpression,
    performWith: makeWithReadAmbientThisExpression,
  },
);

export const listWriteVariableEffect = compileStandard(
  initializeWriteOperation,
  duplicateWriteOperation,
  /** @type {any} */ (incorporateEffect),
  {
    performEval: {
      type: "intercept",
      data: listEvalWriteEffect,
    },
    performIllegal: listIllegalSaveEffect,
    performProxy: listProxyWriteEffect,
    performRegular: listRegularWriteEffect,
    performRoot: listRootWriteEffect,
    performWith: listWithWriteEffect,
  },
);

export const listWriteSloppyFunctionVariableEffect = compileStandard(
  initializeWriteOperation,
  duplicateOperation,
  /** @type {any} */ (incorporateEffect),
  {
    performEval: {
      type: "intercept",
      data: listEvalWriteSloppyFunctionEffect,
    },
    performIllegal: listIllegalSaveEffect,
    performProxy: listProxyWriteSloppyFunctionEffect,
    performRegular: listRegularWriteSloppyFunctionEffect,
    performRoot: listRootWriteSloppyFunctionEffect,
    performWith: listWithWriteSloppyFunctionEffect,
  },
);

export const listLateDeclareVariableEffect = compileStandard(
  initializeLateDeclareOperation,
  duplicateOperation,
  /** @type {any} */ (incorporateEffect),
  {
    performEval: {
      type: "perform",
      data: listEvalLateDeclareEffect,
    },
    performIllegal: listIllegalSaveEffect,
    performProxy: listProxyLateDeclareEffect,
    performRegular: listRegularLateDeclareEffect,
    performRoot: listRootLateDeclareEffect,
    performWith: listWithLateDeclareEffect,
  },
);

////////////////
// Initialize //
////////////////

/**
 * @type {(
 *    hash: import("../../../hash").Hash,
 *    meta: import("../../meta").Meta,
 *    root: import("../../sort").RootSort,
 *    head: import(".").VariableFrame,
 *    operation: import(".").InitializeVariableOperation,
 * ) => null | import("../../../util/sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").SyntaxErrorPrelude
 *   ),
 *   [
 *     import("../../../util/tree").Tree<import("../../atom").Effect>,
 *     import(".").VariableFrame,
 *   ],
 * >}
 */
const listInitializeEffect = (hash, meta, root, head, operation) => {
  switch (head.type) {
    case "closure": {
      return null;
    }
    case "eval": {
      return null;
    }
    case "illegal": {
      const may_seq = listIllegalSaveEffect(hash, meta, head, operation);
      if (may_seq === null) {
        return null;
      } else {
        return mapSequence(may_seq, (data) => [data, head]);
      }
    }
    case "proxy": {
      return listProxyInitializeEffect(hash, meta, head, operation);
    }
    case "regular": {
      return listRegularInitializeEffect(hash, meta, head, operation);
    }
    case "root": {
      return listRootInitializeEffect(
        hash,
        meta,
        hydrateRootFrame(head, root),
        operation,
      );
    }
    case "with": {
      return null;
    }
    default: {
      throw new AranTypeError(head);
    }
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   root: import("../../sort").RootSort,
 *   list: import("../../../util/list").List<import(".").VariableFrame>,
 *   operation: import(".").InitializeVariableOperation,
 * ) => import("../../../util/sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").SyntaxErrorPrelude
 *   ),
 *   [
 *     import("../../../util/tree").Tree<import("../../atom").Effect>,
 *     import("../../../util/list").List<import(".").VariableFrame>,
 *   ],
 * >}
 */
const loopInitialize = (hash, meta, root, list, operation) => {
  if (list === null) {
    throw new AranExecError("missing binding frame", { hash, operation });
  } else {
    const { 0: head, 1: tail } = list;
    const result = listInitializeEffect(hash, meta, root, head, operation);
    if (result === null) {
      return loopInitialize(hash, meta, root, tail, operation);
    } else {
      return mapSequence(result, ({ 0: value, 1: state }) => [
        value,
        [state, tail],
      ]);
    }
  }
};

/**
 * @type {<S extends import(".").VariableScope>(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   scope: S,
 *   operation: {
 *     variable: import("estree-sentry").VariableName,
 *     right: import("../../atom").Expression,
 *   },
 * ) => import("../../../util/sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").SyntaxErrorPrelude
 *   ),
 *   [
 *     import("../../../util/tree").Tree<import("../../atom").Effect>,
 *     S,
 *   ]
 * >}
 */
export const listInitializeVariableEffect = (
  hash,
  meta,
  scope,
  { variable, right },
) => {
  const { mode, root, variable: frames } = scope;
  // Do not report early syntax error here because
  // it should have been reported earlier during hoisting.
  // If we call listSyntaxErrorPrelude here,
  // it will incorrectly report initialization of builtin arguments.
  return mapSequence(
    loopInitialize(hash, meta, root, frames, {
      variable,
      mode,
      closure: "internal",
      right,
    }),
    ({ 0: value, 1: state }) => [value, { ...scope, variable: state }],
  );
};
