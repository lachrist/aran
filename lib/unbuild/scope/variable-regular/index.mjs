import { AranTypeError } from "../../../error.mjs";
import {
  createRecord,
  hasOwn,
  includes,
  listEntry,
  listKey,
  map,
} from "../../../util/index.mjs";
import { makeEarlyErrorPrelude } from "../../prelude.mjs";
import {
  flatSequence,
  tellSequence,
  thenTwoSequence,
  zeroSequence,
} from "../../sequence.mjs";
import { reportDuplicate, reportUnboundExport } from "../error.mjs";
import {
  setupDeadzoneBinding,
  makeDeadzoneLoadExpression,
  listDeadzoneSaveEffect,
} from "./deadzone.mjs";

import {
  setupLifespanBinding,
  makeLifespanLoadExpression,
  listLifespanSaveEffect,
} from "./lifespan.mjs";

import {
  makeImportLoadExpression,
  listImportSaveEffect,
  setupImportBinding,
} from "./import.mjs";

/* eslint-disable local/no-impure */
/**
 * @type {<X>(
 *   xs: X[],
 *   x: X,
 * ) => void}
 */
const include = (xs, x) => {
  if (!includes(xs, x)) {
    xs[xs.length] = x;
  }
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   kind: import(".").RegularBinding["kind"],
 * ) => boolean}
 */
const allowDuplicate = (kind) => {
  if (
    kind === "var" ||
    kind === "function" ||
    kind === "callee" ||
    kind === "arguments"
  ) {
    return true;
  } else if (
    kind === "let" ||
    kind === "const" ||
    kind === "class" ||
    kind === "import"
  ) {
    return false;
  } else {
    throw new AranTypeError(kind);
  }
};

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   hoisting: (
 *     | import("../../query/hoist").Hoist
 *     | import(".").PseudoHoist
 *   )[],
 * ) => {
 *   errors: string[],
 *   record: Record<estree.Variable, import(".").RegularBinding>,
 * }}
 */
const recordEntry = (hoisting) => {
  /** @type {estree.Variable[]} */
  const duplicate = [];
  /** @type {Record<estree.Variable, estree.Specifier[]>} */
  const unbound = createRecord();
  /** @type {Record<estree.Variable, import(".").RegularBinding>} */
  const record = createRecord();
  for (const hoist of hoisting) {
    if (hoist.type === "import") {
      if (hasOwn(unbound, hoist.variable)) {
        delete unbound[hoist.variable];
      }
      if (hasOwn(record, hoist.variable)) {
        include(duplicate, hoist.variable);
      } else {
        record[hoist.variable] = {
          kind: "import",
          source: hoist.source,
          specifier: hoist.specifier,
        };
      }
    } else if (hoist.type === "export") {
      if (hasOwn(unbound, hoist.variable)) {
        include(unbound[hoist.variable], hoist.specifier);
      } else if (hasOwn(record, hoist.variable)) {
        const binding = record[hoist.variable];
        if (binding.kind !== "import") {
          includes(binding.export, hoist.specifier);
        }
      } else {
        unbound[hoist.variable] = [hoist.specifier];
      }
    } else if (hoist.type === "regular") {
      if (hasOwn(record, hoist.variable)) {
        const binding = record[hoist.variable];
        if (!allowDuplicate(binding.kind) || !allowDuplicate(hoist.kind)) {
          include(duplicate, hoist.variable);
        }
      } else if (hasOwn(unbound, hoist.variable)) {
        record[hoist.variable] = {
          kind: hoist.kind,
          export: unbound[hoist.variable],
        };
        delete unbound[hoist.variable];
      } else {
        record[hoist.variable] = {
          kind: hoist.kind,
          export: [],
        };
      }
    } else {
      throw new AranTypeError(hoist);
    }
  }
  return {
    errors: [
      ...map(duplicate, reportDuplicate),
      ...map(listKey(unbound), reportUnboundExport),
    ],
    record,
  };
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   hoisting: (
 *     | import("../../query/hoist").Hoist
 *     | import(".").PseudoHoist
 *   )[],
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").BodyPrelude,
 *   import(".").RegularFrame
 * >}
 */
export const setupRegularFrame = ({ path }, entries) => {
  const { errors, record } = recordEntry(entries);
  return thenTwoSequence(
    tellSequence(
      map(errors, (message) =>
        makeEarlyErrorPrelude({
          guard: null,
          message,
          path,
        }),
      ),
    ),
    flatSequence(
      map(listEntry(record), ([variable, binding]) => {
        if (binding.kind === "import") {
          return setupImportBinding({ path }, [variable, binding]);
        } else if (
          binding.kind === "let" ||
          binding.kind === "const" ||
          binding.kind === "class"
        ) {
          return setupDeadzoneBinding({ path }, [variable, binding]);
        } else if (
          binding.kind === "var" ||
          binding.kind === "function" ||
          binding.kind === "arguments" ||
          binding.kind === "callee"
        ) {
          return setupLifespanBinding({ path }, [variable, binding]);
        } else {
          throw new AranTypeError(binding.kind);
        }
      }),
    ),
    zeroSequence({ type: "regular", record }),
  );
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").RegularFrame,
 *   operation: import("..").VariableLoadOperation,
 * ) => import("../../sequence").ExpressionSequence | null}
 */
export const makeRegularLoadExpression = ({ path }, frame, operation) => {
  if (hasOwn(frame.record, operation.variable)) {
    const binding = frame.record[operation.variable];
    if (binding.kind === "import") {
      return makeImportLoadExpression({ path }, binding, operation);
    } else if (
      binding.kind === "let" ||
      binding.kind === "const" ||
      binding.kind === "class"
    ) {
      return makeDeadzoneLoadExpression({ path }, binding, operation);
    } else if (
      binding.kind === "var" ||
      binding.kind === "function" ||
      binding.kind === "arguments" ||
      binding.kind === "callee"
    ) {
      return makeLifespanLoadExpression({ path }, binding, operation);
    } else {
      throw new AranTypeError(binding.kind);
    }
  } else {
    return null;
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").RegularFrame,
 *   operation: import("..").VariableSaveOperation,
 * ) => null | import("../../sequence").EffectSequence}
 */
export const listRegularSaveEffect = ({ path }, frame, operation) => {
  if (hasOwn(frame.record, operation.variable)) {
    const binding = frame.record[operation.variable];
    if (binding.kind === "import") {
      return listImportSaveEffect({ path }, binding, operation);
    } else if (
      binding.kind === "let" ||
      binding.kind === "const" ||
      binding.kind === "class"
    ) {
      return listDeadzoneSaveEffect({ path }, binding, operation);
    } else if (
      binding.kind === "var" ||
      binding.kind === "function" ||
      binding.kind === "arguments" ||
      binding.kind === "callee"
    ) {
      return listLifespanSaveEffect({ path }, binding, operation);
    } else {
      throw new AranTypeError(binding.kind);
    }
  } else {
    return null;
  }
};
