import { AranTypeError } from "../../../error.mjs";
import {
  createRecord,
  flatMap,
  hasOwn,
  includes,
  listEntry,
  listKey,
  map,
} from "../../../util/index.mjs";
import { makeEarlyErrorPrelude } from "../../prelude.mjs";
import { initSequence } from "../../sequence.mjs";
import { reportDuplicate, reportUnboundExport } from "../error.mjs";
import { isHoistDuplicable, isHoistWritable } from "../../query/index.mjs";
import { makeRegularEarlyError } from "../../early-error.mjs";
import {
  listBindingSaveEffect,
  makeBindingLoadExpression,
  setupBinding,
} from "./binding.mjs";

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
          kind: "external",
          writable: false,
          deadzone: null,
          import: {
            source: hoist.source,
            specifier: hoist.specifier,
          },
          export: [],
        };
      }
    } else if (hoist.type === "export") {
      if (hasOwn(unbound, hoist.variable)) {
        pushUnique(unbound[hoist.variable], hoist.specifier);
      } else if (hasOwn(record, hoist.variable)) {
        pushUnique(record[hoist.variable].export, hoist.specifier);
      } else {
        unbound[hoist.variable] = [hoist.specifier];
      }
    } else if (hoist.type === "declare") {
      if (hasOwn(record, hoist.variable)) {
        if (record[hoist.variable].deadzone || !isHoistDuplicable(hoist)) {
          pushUnique(duplicate, hoist.variable);
        }
      } else {
        if (hoist.kind === "let" || hoist.kind === "const") {
          record[hoist.variable] = {
            kind: "internal",
            import: null,
            deadzone: true,
            writable: isHoistWritable(hoist),
            export: take(unbound, hoist.variable, []),
          };
        } else if (hoist.kind === "var" || hoist.kind === "val") {
          record[hoist.variable] = {
            kind: "internal",
            import: null,
            deadzone: false,
            writable: isHoistWritable(hoist),
            export: take(unbound, hoist.variable, []),
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
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").BaseDeclarationPrelude
 *     | import("../../prelude").HeaderPrelude
 *   ),
 *   import(".").RegularFrame
 * >}
 */
const setupFrame = ({ path }, entries, module) => {
  const { errors, record } = recordEntry(entries);
  return initSequence(
    [
      ...map(errors, (message) =>
        makeEarlyErrorPrelude(makeRegularEarlyError(message, path)),
      ),
      ...flatMap(listEntry(record), (entry) => setupBinding({ path }, entry)),
    ],
    {
      type: "regular",
      module,
      record,
    },
  );
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   hoisting: import("../../query/hoist").DeclareHoist[],
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").BaseDeclarationPrelude
 *     | import("../../prelude").HeaderPrelude
 *   ),
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
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").BaseDeclarationPrelude
 *     | import("../../prelude").HeaderPrelude
 *   ),
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
 * ) => null | import("../../sequence").Sequence<
 *   never,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const makeRegularLoadExpression = ({ path }, frame, operation) => {
  if (hasOwn(frame.record, operation.variable)) {
    return makeBindingLoadExpression(
      { path },
      frame.record[operation.variable],
      operation,
    );
  } else {
    return null;
  }
};

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   frame: import(".").RegularFrame,
 *   operation: import("../operation").VariableSaveOperation,
 * ) => null | import("../../sequence").Sequence<
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *   ),
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
export const listRegularSaveEffect = ({ path, meta }, frame, operation) => {
  if (hasOwn(frame.record, operation.variable)) {
    return listBindingSaveEffect(
      { path, meta },
      frame.record[operation.variable],
      operation,
    );
  } else {
    return null;
  }
};
