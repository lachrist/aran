import { AranTypeError } from "../../../../error.mjs";
import { makeIntrinsicExpression } from "../../../node.mjs";
import {
  findTree,
  map,
  flatSequence,
  mapSequence,
  zeroSequence,
} from "../../../../util/index.mjs";
import { forkMeta, nextMeta } from "../../../meta.mjs";
import {
  listReifyInitializeEffect,
  listReifyLateDeclareEffect,
  listReifyWriteEffect,
  listReifyWriteSloppyFunctionEffect,
  makeReifyDiscardExpression,
  makeReifyReadExpression,
  makeReifyTypeofExpression,
  setupReifyBinding,
} from "./reify.mjs";
import {
  listAlienInitializeEffect,
  listAlienLateDeclareEffect,
  listAlienWriteEffect,
  listAlienWriteSloppyFunctionEffect,
  makeAlienDiscardExpression,
  makeAlienReadExpression,
  makeAlienTypeofExpression,
  setupAlienBinding,
} from "./alien.mjs";

/**
 * @type {(
 *   variable: import("estree-sentry").VariableName,
 * ) => (
 *   binding: {
 *     variable: import("estree-sentry").VariableName,
 *   },
 * ) => boolean}
 */
const compileMatch =
  (variable1) =>
  ({ variable: variable2 }) =>
    variable1 === variable2;

/**
 * @type {(
 *   frame: import(".").RootFrame,
 *   root: import("../../../sort").RootSort,
 * ) => import(".").RootBind}
 */
export const hydrateRootFrame = (frame, root) => {
  switch (frame.kind) {
    case "reify": {
      const { kind, bindings } = frame;
      return { kind, root, bindings };
    }
    case "alien": {
      const { kind, bindings } = frame;
      return { kind, root, bindings };
    }
    default: {
      throw new AranTypeError(frame);
    }
  }
};

///////////
// setup //
///////////

/**
 * @type {import("../../api").Setup<
 *   import("../../../annotation/hoisting").Binding[],
 *   (
 *     | import("../../../prelude").ReifyExternalPrelude
 *     | import("../../../prelude").PrefixPrelude
 *     | import("../../../prelude").MetaDeclarationPrelude
 *   ),
 *   import(".").ReifyFrame,
 * >}
 */
const setupReifyRootFrame = (hash, meta, bindings) =>
  mapSequence(
    flatSequence(
      map(bindings, (binding) =>
        setupReifyBinding(hash, forkMeta((meta = nextMeta(meta))), binding),
      ),
    ),
    (bindings) => ({
      type: "root",
      kind: "reify",
      bindings,
    }),
  );

/**
 * @type {import("../../api").Setup<
 *   import("../../../annotation/hoisting").Binding[],
 *   (
 *     | import("../../../prelude").HeaderPrelude
 *     | import("../../../prelude").PrefixPrelude
 *     | import("../../../prelude").MetaDeclarationPrelude
 *     | import("../../../prelude").WarningPrelude
 *   ),
 *   import(".").AlienFrame,
 * >}
 */
const setupAlienRootFrame = (hash, meta, bindings) =>
  mapSequence(
    flatSequence(
      map(bindings, (binding) =>
        setupAlienBinding(hash, forkMeta((meta = nextMeta(meta))), binding),
      ),
    ),
    (bindings) => ({
      type: "root",
      kind: "alien",
      bindings,
    }),
  );

/**
 * @type {import("../../api").Setup<
 *   import(".").RawRootFrame,
 *   (
 *     | import("../../../prelude").MetaDeclarationPrelude
 *     | import("../../../prelude").HeaderPrelude
 *     | import("../../../prelude").ReifyExternalPrelude
 *     | import("../../../prelude").PrefixPrelude
 *     | import("../../../prelude").WarningPrelude
 *   ),
 *   import(".").RootFrame,
 * >}
 */
export const setupRootFrame = (
  hash,
  meta,
  { global_declarative_record, bindings },
) => {
  switch (global_declarative_record) {
    case "builtin": {
      return setupAlienRootFrame(hash, meta, bindings);
    }
    case "emulate": {
      return setupReifyRootFrame(hash, meta, bindings);
    }
    default: {
      throw new AranTypeError(global_declarative_record);
    }
  }
};

//////////
// load //
//////////

/**
 * @type {<X, W1, W2, O extends { variable: import("estree-sentry").VariableName }>(
 *   performReify: import("../../api").Perform<import(".").ReifyMatch, O, W1, X>,
 *   performAlien: import("../../api").Perform<import(".").AlienMatch, O, W2, X>,
 * ) => import("../../api").Perform<import(".").RootBind, O, W1 | W2, X>}
 */
const compileOperation =
  (performReify, performAlien) => (hash, meta, bind, operation) => {
    switch (bind.kind) {
      case "reify": {
        return performReify(
          hash,
          meta,
          {
            root: bind.root,
            binding: findTree(bind.bindings, compileMatch(operation.variable)),
          },
          operation,
        );
      }
      case "alien": {
        return performAlien(
          hash,
          meta,
          {
            root: bind.root,
            binding: findTree(bind.bindings, compileMatch(operation.variable)),
          },
          operation,
        );
      }
      default: {
        throw new AranTypeError(bind);
      }
    }
  };

export const makeRootReadExpression = compileOperation(
  makeReifyReadExpression,
  makeAlienReadExpression,
);

export const makeRootTypeofExpression = compileOperation(
  makeReifyTypeofExpression,
  makeAlienTypeofExpression,
);

export const makeRootDiscardExpression = compileOperation(
  makeReifyDiscardExpression,
  makeAlienDiscardExpression,
);

export const listRootWriteEffect = compileOperation(
  listReifyWriteEffect,
  listAlienWriteEffect,
);

export const listRootWriteSloppyFunctionEffect = compileOperation(
  listReifyWriteSloppyFunctionEffect,
  listAlienWriteSloppyFunctionEffect,
);

export const listRootLateDeclareEffect = compileOperation(
  listReifyLateDeclareEffect,
  listAlienLateDeclareEffect,
);

/**
 * @type {import("../../api").Perform<
 *   import(".").RootBind,
 *   import("../").InitializeVariableOperation,
 *   import("../../../prelude").MetaDeclarationPrelude,
 *   [
 *     import("../../../atom").Effect[],
 *     import(".").RootFrame,
 *   ],
 * >}
 */
export const listRootInitializeEffect = (hash, meta, bind, operation) => {
  switch (bind.kind) {
    case "reify": {
      const { root, bindings } = bind;
      return mapSequence(
        listReifyInitializeEffect(
          hash,
          meta,
          {
            root,
            binding: findTree(bindings, compileMatch(operation.variable)),
          },
          operation,
        ),
        ({ 0: value, 1: state }) => [
          value,
          {
            type: "root",
            kind: "reify",
            bindings: [state, bindings],
          },
        ],
      );
    }
    case "alien": {
      const { root, bindings } = bind;
      return mapSequence(
        listAlienInitializeEffect(
          hash,
          meta,
          {
            root,
            binding: findTree(bindings, compileMatch(operation.variable)),
          },
          operation,
        ),
        ({ 0: value, 1: state }) => [
          value,
          {
            type: "root",
            kind: "alien",
            bindings: [state, bindings],
          },
        ],
      );
    }
    default: {
      throw new AranTypeError(bind);
    }
  }
};

/**
 * This might not be correct for eval.local.root
 * Because it might be inside a with statement.
 * cf: wrong-this-parameter-in-with-in-eval
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   meta: import("../../../meta").Meta,
 *   bind: import(".").RootBind,
 *   operation: import("../").VariableOperation,
 * ) => import("../../../../util/sequence").Sequence<
 *   never,
 *   import("../../../atom").Expression,
 * >}
 */
export const makeRootReadAmbientThisExpression = (
  hash,
  _meta,
  _bind,
  _operation,
) => zeroSequence(makeIntrinsicExpression("undefined", hash));
