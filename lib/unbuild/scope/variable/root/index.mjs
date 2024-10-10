import { AranTypeError } from "../../../../report.mjs";
import { makeIntrinsicExpression } from "../../../node.mjs";
import { findTree, map } from "../../../../util/index.mjs";
import {
  flatSequence,
  mapSequence,
  zeroSequence,
} from "../../../../sequence.mjs";
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

///////////
// setup //
///////////

/**
 * @type {import("../../perform").Setup<
 *   import("../../../annotation/hoisting").Binding[],
 *   (
 *     | import("../../../prelude").ReifyExternalPrelude
 *     | import("../../../prelude").PrefixPrelude
 *     | import("../../../prelude").MetaDeclarationPrelude
 *   ),
 *   import(".").DryReifyRootFrame,
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
 * @type {import("../../perform").Setup<
 *   import("../../../annotation/hoisting").Binding[],
 *   (
 *     | import("../../../prelude").HeaderPrelude
 *     | import("../../../prelude").PrefixPrelude
 *     | import("../../../prelude").MetaDeclarationPrelude
 *     | import("../../../prelude").WarningPrelude
 *   ),
 *   import(".").DryAlienRootFrame,
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
 * @type {import("../../perform").Setup<
 *   {
 *     global_declarative_record: "builtin" | "emulate",
 *     bindings: import("../../../annotation/hoisting").Binding[],
 *   },
 *   (
 *     | import("../../../prelude").MetaDeclarationPrelude
 *     | import("../../../prelude").HeaderPrelude
 *     | import("../../../prelude").ReifyExternalPrelude
 *     | import("../../../prelude").PrefixPrelude
 *     | import("../../../prelude").WarningPrelude
 *   ),
 *   import(".").DryRootFrame,
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
 * @type {<X, O extends { variable: import("estree-sentry").VariableName }>(
 *   performReify: import("../../perform").Perform<import(".").ReifyBind, O, X>,
 *   performAlien: import("../../perform").Perform<import(".").AlienBind, O, X>,
 * ) => import("../../perform").Perform<import(".").RootFrame, O, X>}
 */
const compileOperation =
  (performReify, performAlien) => (hash, meta, frame, operation) => {
    switch (frame.kind) {
      case "reify": {
        return performReify(
          hash,
          meta,
          {
            mode: frame.mode,
            binding: findTree(frame.bindings, compileMatch(operation.variable)),
          },
          operation,
        );
      }
      case "alien": {
        return performAlien(
          hash,
          meta,
          {
            mode: frame.mode,
            root: frame.root,
            binding: findTree(frame.bindings, compileMatch(operation.variable)),
          },
          operation,
        );
      }
      default: {
        throw new AranTypeError(frame);
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
 * @type {import("../../perform").Perform<
 *   import(".").RootFrame,
 *   import("../").InitializeVariableOperation,
 *   import("../../../../sequence").Sequence<
 *     import("../../../prelude").MetaDeclarationPrelude,
 *     {
 *       main: import("../../../atom").Effect[],
 *       auxi: import(".").RootFrame,
 *     },
 *   >,
 * >}
 */
export const listRootInitializeEffect = (hash, meta, frame, operation) => {
  switch (frame.kind) {
    case "reify": {
      return mapSequence(
        listReifyInitializeEffect(
          hash,
          meta,
          {
            mode: frame.mode,
            binding: findTree(frame.bindings, compileMatch(operation.variable)),
          },
          operation,
        ),
        ({ main, auxi }) => ({
          main,
          auxi: {
            ...frame,
            bindings: [auxi, frame.bindings],
          },
        }),
      );
    }
    case "alien": {
      return mapSequence(
        listAlienInitializeEffect(
          hash,
          meta,
          {
            mode: frame.mode,
            root: frame.root,
            binding: findTree(frame.bindings, compileMatch(operation.variable)),
          },
          operation,
        ),
        ({ main, auxi }) => ({
          main,
          auxi: {
            ...frame,
            bindings: [auxi, frame.bindings],
          },
        }),
      );
    }
    default: {
      throw new AranTypeError(frame);
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
 *   frame: import(".").RootFrame,
 *   operation: import("../").ReadAmbientThisVariableOperation,
 * ) => import("../../../../sequence").Sequence<
 *   never,
 *   import("../../../atom").Expression,
 * >}
 */
export const makeRootReadAmbientThisExpression = (
  hash,
  _meta,
  _frame,
  _operation,
) => zeroSequence(makeIntrinsicExpression("undefined", hash));
