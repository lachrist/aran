import { AranTypeError } from "../../../error.mjs";
import {
  EMPTY,
  concatXXX,
  concatXXXX,
  createRecord,
  filterNarrow,
  flatMap,
  hasOwn,
  includes,
  listEntry,
  listValue,
  map,
  reduceEntry,
} from "../../../util/index.mjs";
import { makeEarlyErrorPrelude, makeHeaderPrelude } from "../../prelude.mjs";
import { initSequence } from "../../sequence.mjs";
import {
  reportDuplicate,
  reportDuplicateExport,
  reportUnboundExport,
} from "../error.mjs";
import {
  isAggregateHoist,
  isDeclareHoist,
  isExportHoist,
  isHoistDuplicable,
  isHoistWritable,
  isImportHoist,
} from "../../query/index.mjs";
import { makeRegularEarlyError } from "../../early-error.mjs";
import {
  listBindingSaveEffect,
  makeBindingLoadExpression,
  setupBinding,
} from "./binding.mjs";

const {
  JSON: { stringify },
} = globalThis;

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

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   record: { [k in estree.Variable]?: import(".").RegularBinding },
 *   hoisting: import("../../query/hoist").ImportHoist[],
 * ) => {
 *   errors: string[],
 *   headers: import("../../../header").ImportHeader[],
 *   record: { [k in estree.Variable]?: import(".").RegularBinding },
 * }}
 */
const recordImportEntry = (record, hoisting) => {
  record = reduceEntry(listEntry(record));
  /** @type {estree.Variable[]} */
  const duplicate = [];
  /** @type {{ [k in string]: import("../../../header").ImportHeader }} */
  const headers = createRecord();
  for (const hoist of hoisting) {
    headers[stringify([hoist.source, hoist.import])] = {
      type: "import",
      mode: "strict",
      source: hoist.source,
      import: hoist.import,
    };
    if (hoist.variable !== null) {
      if (hasOwn(record, hoist.variable)) {
        pushUnique(duplicate, hoist.variable);
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
  return {
    errors: map(duplicate, reportDuplicate),
    headers: listValue(headers),
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
 *   hoisting: import("../../query/hoist").ExportHoist[],
 * ) => {
 *   errors: string[],
 *   headers: import("../../../header").ExportHeader[],
 *   record: { [k in estree.Variable]?: import(".").RegularBinding },
 * }}
 */
const recordExportEntry = (record, hoisting) => {
  record = reduceEntry(map(listEntry(record), copyEntry));
  /** @type {estree.Variable[]} */
  const unbound = [];
  /** @type {import("../../../header").ExportHeader[]} */
  const headers = [];
  for (const hoist of hoisting) {
    push(headers, {
      type: "export",
      mode: "strict",
      export: hoist.export,
    });
    if (hoist.variable !== null) {
      if (hasOwn(record, hoist.variable)) {
        pushUnique(record[hoist.variable].export, hoist.export);
      } else {
        pushUnique(unbound, hoist.variable);
      }
    }
  }
  return {
    errors: map(unbound, reportUnboundExport),
    headers,
    record,
  };
};
/* eslint-enable local/no-impure */

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   record: { [k in estree.Variable]?: import(".").RegularBinding },
 *   hoisting: import("../../query/hoist").AggregateHoist[],
 * ) => {
 *   record: { [k in estree.Variable]?: import(".").RegularBinding },
 *   errors: string[],
 *   headers: import("../../../header").AggregateHeader[],
 * }}
 */
const recordAggregateEntry = (record, hoisting) => {
  /** @type {import("../../../header").AggregateHeader[]} */
  const headers = [];
  for (const hoist of hoisting) {
    push(headers, {
      type: "aggregate",
      mode: "strict",
      source: hoist.source,
      import: hoist.import,
      export: hoist.export,
    });
  }
  for (const binding of listValue(record)) {
    if (binding.kind === "external") {
      for (const specifier of binding.export) {
        push(headers, {
          type: "aggregate",
          mode: "strict",
          source: binding.import.source,
          import: binding.import.specifier,
          export: specifier,
        });
      }
    }
  }
  return { record, errors: [], headers };
};
/* eslint-enable local/no-impure */

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   headers: import("../../../header").ModuleHeader[],
 * ) => string[]}
 */
export const findDuplicateExport = (headers) => {
  /** @type {{[k in estree.Specifier]?: null}} */
  const hash = createRecord();
  /** @type {estree.Specifier[]} */
  const duplicate = [];
  for (const header of headers) {
    if (header.type === "export") {
      if (hasOwn(hash, header.export)) {
        pushUnique(duplicate, header.export);
      } else {
        hash[header.export] = null;
      }
    } else if (header.type === "aggregate") {
      if (header.export !== null) {
        if (hasOwn(hash, header.export)) {
          pushUnique(duplicate, header.export);
        } else {
          hash[header.export] = null;
        }
      }
    }
  }
  return map(duplicate, reportDuplicateExport);
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   hoisting: import("../../query/hoist").DeclareHoist[],
 * ) => import("../../sequence").Sequence<
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
 * ) => import("../../sequence").Sequence<
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
  const result2 = recordImportEntry(
    result1.record,
    filterNarrow(hoisting, isImportHoist),
  );
  const result3 = recordExportEntry(
    result2.record,
    filterNarrow(hoisting, isExportHoist),
  );
  const result4 = recordAggregateEntry(
    result3.record,
    filterNarrow(hoisting, isAggregateHoist),
  );
  const { record } = result4;
  const errors = concatXXXX(
    result1.errors,
    result2.errors,
    result3.errors,
    result4.errors,
  );
  const headers = concatXXX(result2.headers, result3.headers, result4.headers);
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
