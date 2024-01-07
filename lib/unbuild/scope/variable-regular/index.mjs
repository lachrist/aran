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
  setupHoistingBinding,
  makeHoistingLoadExpression,
  listHoistingSaveEffect,
} from "./hoisting.mjs";

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

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   hoisting: import("../../query/hoist").Hoist[],
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
    } else if (hoist.type === "block" || hoist.type === "closure") {
      if (hasOwn(record, hoist.variable)) {
        const binding = record[hoist.variable];
        if (binding.kind !== "var" || hoist.kind !== "var") {
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

// /* eslint-disable local/no-impure */
// /**
//  * @type {(
//  *   entries: import(".").RegularEntry[],
//  * ) => estree.Variable[]}
//  */
// const listDuplicate = (entries) => {
//   const { length } = entries;
//   const duplicates = [];
//   for (let index1 = 0; index1 < length; index1 += 1) {
//     const entry1 = entries[index1];
//     for (let index2 = index1 + 1; index2 < length; index2 += 1) {
//       const entry2 = entries[index2];
//       if (
//         entry1.variable === entry2.variable &&
//         (kind1 !== "var" || kind2 !== "var")
//       ) {
//         duplicates[duplicates.length] = variable1;
//       }
//     }
//   }
//   return duplicates;
// };
// /* eslint-enable local/no-impure */

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   hoisting: import("../../query/hoist").Hoist[],
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
        } else if (binding.kind === "let" || binding.kind === "const") {
          return setupDeadzoneBinding({ path }, [variable, binding]);
        } else if (binding.kind === "var") {
          return setupHoistingBinding({ path }, [variable, binding]);
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
    } else if (binding.kind === "let" || binding.kind === "const") {
      return makeDeadzoneLoadExpression({ path }, binding, operation);
    } else if (binding.kind === "var") {
      return makeHoistingLoadExpression({ path }, binding, operation);
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
    } else if (binding.kind === "let" || binding.kind === "const") {
      return listDeadzoneSaveEffect({ path }, binding, operation);
    } else if (binding.kind === "var") {
      return listHoistingSaveEffect({ path }, binding, operation);
    } else {
      throw new AranTypeError(binding.kind);
    }
  } else {
    return null;
  }
};
