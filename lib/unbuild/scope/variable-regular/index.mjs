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
import { isHoistDuplicable, isHoistWritable } from "../../query/index.mjs";
import { listEarlyErrorEffect } from "../../early-error.mjs";

/* eslint-disable local/no-impure */
/**
 * @type {<X>(
 *   xs: X[],
 *   x: X,
 * ) => void}
 */
const pushUnique = (xs, x) => {
  if (!includes(xs, x)) {
    xs[xs.length] = x;
  }
};
/* eslint-enable local/no-impure */

/* eslint-disable local/no-impure */
/**
 * @type {<K extends string, V>(
 *   obj: { [k in K]?: V },
 *   key: K,
 *   def: V,
 * ) => V}
 */
const take = (obj, key, def) => {
  if (hasOwn(obj, key)) {
    const val = obj[key];
    delete obj[key];
    return val;
  } else {
    return def;
  }
};
/* eslint-enable local/no-impure */

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   hoisting: import("../../query/hoist").Hoist[],
 * ) => {
 *   errors: string[],
 *   record: { [k in estree.Variable]?: import(".").RegularBinding },
 * }}
 */
const recordEntry = (hoisting) => {
  /** @type {estree.Variable[]} */
  const duplicate = [];
  /** @type {{ [k in estree.Variable]?: estree.Specifier[] }} */
  const unbound = createRecord();
  /** @type {{ [k in estree.Variable]?: import(".").RegularBinding }} */
  const record = createRecord();
  for (const hoist of hoisting) {
    if (hoist.type === "import") {
      if (hasOwn(unbound, hoist.variable)) {
        delete unbound[hoist.variable];
      }
      if (hasOwn(record, hoist.variable)) {
        pushUnique(duplicate, hoist.variable);
      } else {
        record[hoist.variable] = {
          type: "import",
          source: hoist.source,
          specifier: hoist.specifier,
        };
      }
    } else if (hoist.type === "export") {
      if (hasOwn(unbound, hoist.variable)) {
        pushUnique(unbound[hoist.variable], hoist.specifier);
      } else if (hasOwn(record, hoist.variable)) {
        const binding = record[hoist.variable];
        if (binding.type === "lifespan" || binding.type === "deadzone") {
          pushUnique(binding.export, hoist.specifier);
        }
      } else {
        unbound[hoist.variable] = [hoist.specifier];
      }
    } else if (hoist.type === "declare") {
      if (hasOwn(record, hoist.variable)) {
        if (
          record[hoist.variable].type !== "lifespan" ||
          !isHoistDuplicable(hoist)
        ) {
          pushUnique(duplicate, hoist.variable);
        }
      } else {
        if (hoist.kind === "let" || hoist.kind === "const") {
          record[hoist.variable] = {
            type: "deadzone",
            export: take(unbound, hoist.variable, []),
            writable: isHoistWritable(hoist),
          };
        } else if (hoist.kind === "var" || hoist.kind === "val") {
          record[hoist.variable] = {
            type: "lifespan",
            export: take(unbound, hoist.variable, []),
            writable: isHoistWritable(hoist),
          };
        } else {
          throw new AranTypeError(hoist.kind);
        }
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
 *   hoisting: import("../../query/hoist").Hoist[],
 *   module: boolean,
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").FramePrelude,
 *   import(".").RegularFrame
 * >}
 */
const setupFrame = ({ path }, entries, module) => {
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
        if (binding.type === "import") {
          return setupImportBinding({ path }, [variable, binding]);
        } else if (binding.type === "deadzone") {
          return setupDeadzoneBinding({ path }, [variable, binding]);
        } else if (binding.type === "lifespan") {
          return setupLifespanBinding({ path }, [variable, binding]);
        } else {
          throw new AranTypeError(binding);
        }
      }),
    ),
    zeroSequence({ type: "regular", module, record }),
  );
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   hoisting: import("../../query/hoist").DeclareHoist[],
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").FramePrelude,
 *   import(".").RegularFrame
 * >}
 */
export const setupRegularFrame = (site, hoisting) =>
  setupFrame(site, hoisting, false);

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   hoisting: import("../../query/hoist").Hoist[],
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").FramePrelude,
 *   import(".").RegularFrame
 * >}
 */
export const setupModuleFrame = (site, hoisting) =>
  setupFrame(site, hoisting, true);

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").RegularFrame,
 *   operation: import("../operation").VariableLoadOperation,
 * ) => import("../../sequence").ExpressionSequence | null}
 */
export const makeRegularLoadExpression = ({ path }, frame, operation) => {
  if (hasOwn(frame.record, operation.variable)) {
    const binding = frame.record[operation.variable];
    if (binding.type === "import") {
      return makeImportLoadExpression({ path }, binding, operation);
    } else if (binding.type === "deadzone") {
      return makeDeadzoneLoadExpression({ path }, binding, operation);
    } else if (binding.type === "lifespan") {
      return makeLifespanLoadExpression({ path }, binding, operation);
    } else {
      throw new AranTypeError(binding);
    }
  } else {
    return null;
  }
};

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   frame: import(".").RegularFrame,
 *   operation: (
 *     | import("../operation").VariableSaveOperation
 *     | import("../operation").ModuleOperation
 *   ),
 * ) => null | import("../../sequence").EffectSequence}
 */
export const listRegularSaveEffect = ({ path, meta }, frame, operation) => {
  if (operation.type === "module") {
    if (frame.module) {
      return null;
    } else {
      return listEarlyErrorEffect(
        "Illegal module declaration in nested scope",
        path,
      );
    }
  } else if (
    operation.type === "declare" ||
    operation.type === "initialize" ||
    operation.type === "write"
  ) {
    if (hasOwn(frame.record, operation.variable)) {
      const binding = frame.record[operation.variable];
      if (binding.type === "import") {
        return listImportSaveEffect({ path }, binding, operation);
      } else if (binding.type === "deadzone") {
        return listDeadzoneSaveEffect({ path, meta }, binding, operation);
      } else if (binding.type === "lifespan") {
        return listLifespanSaveEffect({ path }, binding, operation);
      } else {
        throw new AranTypeError(binding);
      }
    } else {
      return null;
    }
  } else {
    throw new AranTypeError(operation);
  }
};
