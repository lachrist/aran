import { AranExecError, AranTypeError } from "../../../report.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";
import { bindSequence, mapSequence, zeroSequence } from "../../../sequence.mjs";
import {
  listEvalLateDeclareEffect,
  listEvalWriteEffect,
  listEvalWriteSloppyFunctionEffect,
  makeEvalDiscardExpression,
  makeEvalReadAmbientThisExpression,
  makeEvalReadExpression,
  makeEvalTypeofExpression,
} from "./eval/index.mjs";
import {
  listIllegalSaveEffect,
  makeIllegalLoadExpression,
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
} from "./regular/index.mjs";
import {
  listRootInitializeEffect,
  listRootLateDeclareEffect,
  listRootWriteEffect,
  listRootWriteSloppyFunctionEffect,
  makeRootDiscardExpression,
  makeRootReadAmbientThisExpression,
  makeRootReadExpression,
  makeRootTypeofExpression,
} from "./root/index.mjs";
import {
  listWithLateDeclareEffect,
  listWithWriteEffect,
  makeWithDiscardExpression,
  makeWithReadAmbientThisExpression,
  makeWithReadExpression,
  makeWithTypeofExpression,
} from "./with/index.mjs";
import { cacheConstant } from "../../cache.mjs";

/**
 * @type {<O>(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   operation: O,
 * ) => import("../../../sequence").Sequence<never, [O, O]>}
 */
const duplicate = (_hash, _meta, operation) =>
  zeroSequence([operation, operation]);

/**
 * @type {<O extends { right: import("../../atom").Expression }>(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   operation: O,
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   [O, O],
 * >}
 */
const duplicateRight = (hash, meta, operation) =>
  mapSequence(cacheConstant(meta, operation.right, hash), (right) => [
    { ...operation, right },
    { ...operation, right },
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

//////////////
// Standard //
//////////////

/**
 * @type {<O extends { closure: import(".").Closure }, W0, W1, W2, W3, W4, W5, W6, X>(
 *   duplicate: import(".").DuplicateOperation<W0, O>,
 *   perform: import(".").PerformStandard<O, W1, W2, W3, W4, W5, W6, X>,
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   mode: import("../../mode").Mode,
 *   root: import("../../sort").RootSort,
 *   frames: import("../../../util/list").List<import(".").VariableFrame>,
 *   operation: O,
 * ) => import("../../../sequence").Sequence<W0 | W1 | W2 | W3 | W4 | W5 | W6, X>}
 */
export const loopStandard = (
  duplicate,
  perform,
  hash,
  meta,
  mode,
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
        const { performEval } = perform;
        return bindSequence(
          duplicate(hash, forkMeta((meta = nextMeta(meta))), operation),
          ({ 0: operation1, 1: operation2 }) =>
            bindSequence(
              loopStandard(
                duplicate,
                perform,
                hash,
                forkMeta((meta = nextMeta(meta))),
                mode,
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
        );
      }
      case "illegal": {
        const { performIllegal } = perform;
        const result = performIllegal(hash, meta, head, operation);
        return result === null
          ? loopStandard(
              duplicate,
              perform,
              hash,
              meta,
              mode,
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
              perform,
              hash,
              meta,
              mode,
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
              perform,
              hash,
              meta,
              mode,
              root,
              tail,
              operation,
            )
          : result;
      }
      case "root": {
        const { performRoot } = perform;
        return performRoot(hash, meta, { mode, root, ...head }, operation);
      }
      case "with": {
        const { performWith } = perform;
        return bindSequence(
          duplicate(hash, forkMeta((meta = nextMeta(meta))), operation),
          ({ 0: operation1, 1: operation2 }) =>
            bindSequence(
              loopStandard(
                duplicate,
                perform,
                hash,
                forkMeta((meta = nextMeta(meta))),
                mode,
                root,
                tail,
                operation1,
              ),
              (alternate) =>
                performWith(
                  hash,
                  forkMeta((meta = nextMeta(meta))),
                  { mode, ...head },
                  operation2,
                  alternate,
                ),
            ),
        );
      }
      case "closure": {
        return loopStandard(
          duplicate,
          perform,
          hash,
          meta,
          mode,
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
 * @type {<O extends { closure: import(".").Closure }, W0, W1, W2, W3, W4, W5, W6, X>(
 *   duplicate: import(".").DuplicateOperation<W0, O>,
 *   perform: import(".").PerformStandard<O, W1, W2, W3, W4, W5, W6, X>,
 * ) => import("../perform").Perform<
 *   import(".").VariableScope,
 *   O,
 *   W0 | W1 | W2 | W3 | W4 | W5 | W6,
 *   X,
 * >}
 */
export const compileStandard =
  (duplicate, perform) =>
  (hash, meta, { mode, root, variable }, operation) =>
    loopStandard(
      duplicate,
      perform,
      hash,
      meta,
      mode,
      root,
      variable,
      operation,
    );

export const makeReadVariableExpression = compileStandard(duplicate, {
  performEval: makeEvalReadExpression,
  performIllegal: makeIllegalLoadExpression,
  performProxy: makeProxyReadExpression,
  performRegular: makeRegularReadExpression,
  performRoot: makeRootReadExpression,
  performWith: makeWithReadExpression,
});

export const makeTypeofVariableExpression = compileStandard(duplicate, {
  performEval: makeEvalTypeofExpression,
  performIllegal: makeIllegalLoadExpression,
  performProxy: makeProxyTypeofExpression,
  performRegular: makeRegularTypeofExpression,
  performRoot: makeRootTypeofExpression,
  performWith: makeWithTypeofExpression,
});

export const makeDiscardVariableExpression = compileStandard(duplicate, {
  performEval: makeEvalDiscardExpression,
  performIllegal: makeIllegalLoadExpression,
  performProxy: makeProxyDiscardExpression,
  performRegular: makeRegularDiscardExpression,
  performRoot: makeRootDiscardExpression,
  performWith: makeWithDiscardExpression,
});

export const makeReadAmbientThisExpression = compileStandard(duplicate, {
  performEval: makeEvalReadAmbientThisExpression,
  performIllegal: makeIllegalLoadExpression,
  performProxy: makeProxyReadAmbientThisExpression,
  performRegular: makeRegularReadAmbientThisExpression,
  performRoot: makeRootReadAmbientThisExpression,
  performWith: makeWithReadAmbientThisExpression,
});

export const listWriteVariableEffect = compileStandard(duplicateRight, {
  performEval: listEvalWriteEffect,
  performIllegal: listIllegalSaveEffect,
  performProxy: listProxyWriteEffect,
  performRegular: listRegularWriteEffect,
  performRoot: listRootWriteEffect,
  performWith: listWithWriteEffect,
});

export const listLateDeclareVariableEffect = compileStandard(duplicate, {
  performEval: listEvalLateDeclareEffect,
  performIllegal: listIllegalSaveEffect,
  performProxy: listProxyLateDeclareEffect,
  performRegular: listRegularLateDeclareEffect,
  performRoot: listRootLateDeclareEffect,
  performWith: listWithLateDeclareEffect,
});

////////////////
// Initialize //
////////////////

/**
 * @type {(
 *    hash: import("../../../hash").Hash,
 *    meta: import("../../meta").Meta,
 *    mode: import("../../mode").Mode,
 *    root: import("../../sort").RootSort,
 *    head: import(".").VariableFrame,
 *    operation: import(".").InitializeVariableOperation,
 * ) => null | import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").SyntaxErrorPrelude
 *   ),
 *   [
 *     import("../../atom").Effect[],
 *     import(".").VariableFrame,
 *   ],
 * >}
 */
const listInitializeEffect = (hash, meta, mode, root, head, operation) => {
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
        { mode, root, ...head },
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
 *   operation: import(".").InitializeVariableOperation,
 * ) => import(".").InitializeVariableOperation}
 */
const schrodingerInitializeOperation = (operation) => {
  switch (operation.status) {
    case "live": {
      return { ...operation, status: "schrodinger" };
    }
    case "schrodinger": {
      return operation;
    }
    default: {
      throw new AranTypeError(operation.status);
    }
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   mode: import("../../mode").Mode,
 *   root: import("../../sort").RootSort,
 *   list: import("../../../util/list").List<import(".").VariableFrame>,
 *   operation: import(".").InitializeVariableOperation,
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").SyntaxErrorPrelude
 *   ),
 *   [
 *     import("../../atom").Effect[],
 *     import("../../../util/list").List<import(".").VariableFrame>,
 *   ],
 * >}
 */
const loopInitialize = (hash, meta, mode, root, list, operation) => {
  if (list === null) {
    throw new AranExecError("missing binding frame", { hash, operation });
  } else {
    const { 0: head, 1: tail } = list;
    const result = listInitializeEffect(
      hash,
      meta,
      mode,
      root,
      head,
      operation,
    );
    if (result === null) {
      return loopInitialize(
        hash,
        meta,
        mode,
        root,
        tail,
        schrodingerInitializeOperation(operation),
      );
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
 *   operation: import(".").InitializeVariableOperation,
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").SyntaxErrorPrelude
 *   ),
 *   [
 *     import("../../atom").Effect[],
 *     S,
 *   ]
 * >}
 */
export const listInitializeVariableEffect = (hash, meta, scope, operation) =>
  mapSequence(
    loopInitialize(
      hash,
      meta,
      scope.mode,
      scope.root,
      scope.variable,
      operation,
    ),
    ({ 0: value, 1: state }) => [value, { ...scope, variable: state }],
  );

///////////////////////////
// write-sloppy-function //
///////////////////////////

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   mode: import("../../mode").Mode,
 *   root: import("../../sort").RootSort,
 *   list: import("../../../util/list").List<import(".").VariableFrame>,
 *   operation: import(".").WriteSloppyFunctionVariableOperation,
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").SyntaxErrorPrelude
 *   ),
 *   import("../../atom").Effect[],
 * >}
 */
export const loopWriteSloppyFunction = (
  hash,
  meta,
  mode,
  root,
  list,
  operation,
) => {
  if (list === null) {
    throw new AranExecError("missing binding frame", { hash, operation });
  } else {
    const { 0: head, 1: tail } = list;
    switch (head.type) {
      case "closure": {
        return loopWriteSloppyFunction(
          hash,
          meta,
          mode,
          root,
          tail,
          escapeOperation(operation),
        );
      }
      case "eval": {
        return bindSequence(
          loopWriteSloppyFunction(
            hash,
            forkMeta((meta = nextMeta(meta))),
            mode,
            root,
            tail,
            operation,
          ),
          (alternate) =>
            listEvalWriteSloppyFunctionEffect(
              hash,
              meta,
              head,
              operation,
              alternate,
            ),
        );
      }
      case "illegal": {
        const result = listIllegalSaveEffect(hash, meta, head, operation);
        if (result === null) {
          // eslint-disable-next-line local/no-label
          break;
        }
        return result;
      }
      case "proxy": {
        const result = listProxyWriteSloppyFunctionEffect(
          hash,
          meta,
          head,
          operation,
        );
        if (result === null) {
          // eslint-disable-next-line local/no-label
          break;
        }
        return result;
      }
      case "regular": {
        const either = listRegularWriteSloppyFunctionEffect(
          hash,
          meta,
          head,
          operation,
        );
        switch (either.type) {
          case "stop": {
            return either.data;
          }
          case "pass": {
            return loopWriteSloppyFunction(
              hash,
              meta,
              mode,
              root,
              tail,
              either.data,
            );
          }
          default: {
            throw new AranTypeError(either);
          }
        }
      }
      case "root": {
        return listRootWriteSloppyFunctionEffect(
          hash,
          meta,
          { mode, root, ...head },
          operation,
        );
      }
      case "with": {
        // With frames are ignored: f returns [Function: g]
        //
        // function f() {
        //   with ({ g: 123 }) {
        //     function g() {}
        //   }
        //   return g;
        // }
        // eslint-disable-next-line local/no-label
        break;
      }
      default: {
        throw new AranTypeError(head);
      }
    }
    return loopWriteSloppyFunction(hash, meta, mode, root, tail, operation);
  }
};
