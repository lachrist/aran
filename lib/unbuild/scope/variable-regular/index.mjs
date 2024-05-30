import { AranTypeError } from "../../../error.mjs";
import {
  EMPTY,
  concatXX,
  concatXXX,
  createRecord,
  filterNarrow,
  flatMap,
  hasOwn,
  includes,
  listEntry,
  map,
  reduceEntry,
} from "../../../util/index.mjs";
import { makeEarlyErrorPrelude, makeHeaderPrelude } from "../../prelude.mjs";
import { initSequence } from "../../../sequence.mjs";
import {
  reportDuplicate,
  reportDuplicateExport,
  reportUnboundExport,
} from "../error.mjs";
import {
  isDeclareHoist,
  isHoistDuplicable,
  isHoistWritable,
  isModuleHoist,
} from "../../query/index.mjs";
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
 * @type {<X>(
 *   xs: X[],
 *   x: X,
 * ) => void}
 */
const push = (xs, x) => {
  xs[xs.length] = x;
};
/* eslint-enable local/no-impure */

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   hoisting: import("../../query/hoist").DeclareHoist[],
 * ) => {
 *   errors: string[],
 *   record: { [k in estree.Variable]?: import(".").RegularBinding },
 * }}
 */
const recordDeclareEntry = (hoisting) => {
  /** @type {estree.Variable[]} */
  const duplicate = [];
  /** @type {{ [k in estree.Variable]?: import(".").RegularBinding }} */
  const record = createRecord();
  for (const hoist of hoisting) {
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
          export: EMPTY,
        };
      } else if (hoist.kind === "var" || hoist.kind === "val") {
        record[hoist.variable] = {
          kind: "internal",
          import: null,
          deadzone: false,
          writable: isHoistWritable(hoist),
          export: EMPTY,
        };
      } else {
        throw new AranTypeError(hoist.kind);
      }
    }
  }
  return {
    errors: map(duplicate, reportDuplicate),
    record,
  };
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   entry: [
 *     estree.Variable,
 *     import(".").RegularBinding,
 *   ],
 * ) => [
 *    estree.Variable,
 *    import(".").RegularBinding,
 *  ]}
 */
const copyEntry = ([variable, binding]) => [
  variable,
  { ...binding, export: [...binding.export] },
];

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   record: { [k in estree.Variable]?: import(".").RegularBinding },
 *   hoisting: import("../../query/hoist").ModuleHoist[],
 * ) => {
 *   errors: string[],
 *   headers: import("../../../header").ModuleProgramHeader[],
 *   record: { [k in estree.Variable]?: import(".").RegularBinding },
 * }}
 */
const recordModuleEntry = (record, hoisting) => {
  record = reduceEntry(map(listEntry(record), copyEntry));
  /** @type {estree.Variable[]} */
  const duplicate_variable = [];
  /** @type {estree.Specifier[]} */
  const duplicate_export = [];
  /** @type {estree.Variable[]} */
  const unbound = [];
  /** @type {{ [k in estree.Specifier] ?: null }} */
  const hash = createRecord();
  /** @type {import("../../../header").ModuleProgramHeader[]} */
  const headers = [];
  for (const hoist of hoisting) {
    if (hoist.type === "import" && hoist.variable !== null) {
      if (hasOwn(record, hoist.variable)) {
        pushUnique(duplicate_variable, hoist.variable);
      } else {
        record[hoist.variable] = {
          kind: "external",
          writable: false,
          deadzone: null,
          import: {
            source: hoist.source,
            specifier: hoist.import,
          },
          export: [],
        };
      }
    }
  }
  for (const hoist of hoisting) {
    if (hoist.type === "import") {
      push(headers, {
        type: "import",
        mode: "strict",
        source: hoist.source,
        import: hoist.import,
      });
    } else if (hoist.type === "export") {
      if (hasOwn(hash, hoist.export)) {
        pushUnique(duplicate_export, hoist.export);
      } else {
        hash[hoist.export] = null;
      }
      if (hoist.variable !== null) {
        if (hasOwn(record, hoist.variable)) {
          const binding = record[hoist.variable];
          pushUnique(binding.export, hoist.export);
          if (binding.kind === "internal") {
            push(headers, {
              type: "export",
              mode: "strict",
              export: hoist.export,
            });
          } else if (binding.kind === "external") {
            push(headers, {
              type: "aggregate",
              mode: "strict",
              source: binding.import.source,
              import: binding.import.specifier,
              export: hoist.export,
            });
          } else {
            throw new AranTypeError(binding);
          }
        } else {
          pushUnique(unbound, hoist.variable);
        }
      } else {
        push(headers, {
          type: "export",
          mode: "strict",
          export: hoist.export,
        });
      }
    } else if (hoist.type === "aggregate") {
      if (hoist.export !== null) {
        if (hasOwn(hash, hoist.export)) {
          pushUnique(duplicate_export, hoist.export);
        } else {
          hash[hoist.export] = null;
        }
      }
      push(headers, { mode: "strict", ...hoist });
    } else {
      throw new AranTypeError(hoist);
    }
  }
  return {
    errors: concatXXX(
      map(duplicate_variable, reportDuplicate),
      map(duplicate_export, reportDuplicateExport),
      map(unbound, reportUnboundExport),
    ),
    headers,
    record,
  };
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   hoisting: import("../../query/hoist").DeclareHoist[],
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").BaseDeclarationPrelude
 *   ),
 *   import(".").RegularFrame
 * >}
 */
export const setupRegularFrame = ({ path }, hoisting) => {
  const { errors, record } = recordDeclareEntry(hoisting);
  return initSequence(
    [
      ...map(errors, (message) =>
        makeEarlyErrorPrelude(makeRegularEarlyError(message, path)),
      ),
      ...flatMap(listEntry(record), (entry) => setupBinding({ path }, entry)),
    ],
    {
      type: "regular",
      record,
    },
  );
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   hoisting: import("../../query/hoist").Hoist[],
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").BaseDeclarationPrelude
 *     | import("../../prelude").HeaderPrelude
 *   ),
 *   import(".").RegularFrame
 * >}
 */
export const setupModuleFrame = ({ path }, hoisting) => {
  const result1 = recordDeclareEntry(filterNarrow(hoisting, isDeclareHoist));
  const result2 = recordModuleEntry(
    result1.record,
    filterNarrow(hoisting, isModuleHoist),
  );
  const { record } = result2;
  const errors = concatXX(result1.errors, result2.errors);
  const { headers } = result2;
  return initSequence(
    [
      ...map(errors, (message) =>
        makeEarlyErrorPrelude(makeRegularEarlyError(message, path)),
      ),
      ...map(headers, makeHeaderPrelude),
      ...flatMap(listEntry(record), (entry) => setupBinding({ path }, entry)),
    ],
    { type: "regular", record },
  );
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").RegularFrame,
 *   operation: import("../operation").VariableLoadOperation,
 * ) => null | import("../../../sequence").Sequence<
 *   never,
 *   import("../../atom").Expression,
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
 * ) => null | import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *   ),
 *   import("../../atom").Effect[],
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
