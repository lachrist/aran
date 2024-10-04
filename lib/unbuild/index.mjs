// eslint-disable-next-line local/no-deep-import
import { unbuildProgram } from "./visitors/program.mjs";
import { ROOT_META } from "./meta.mjs";
import {
  isContextPrelude,
  isSyntaxErrorPrelude,
  isWarningPrelude,
  makeSyntaxErrorPrelude,
} from "./prelude/index.mjs";
import {
  map,
  filterNarrow,
  compileGet,
  reduceEntry,
  listEntry,
} from "../util/index.mjs";
import { unpackScope } from "./scope/index.mjs";
import { hasUseStrictDirective } from "./query/index.mjs";
import { AranExecError, AranSyntaxError, AranTypeError } from "../report.mjs";
import { getProgramSort } from "./sort.mjs";
import { hashHeader } from "../header.mjs";
import { annotate } from "./annotation/index.mjs";
import { prependSequence } from "../sequence.mjs";

const getData = compileGet("data");

/**
 * @type {<H extends import("../header").Header>(
 *   header: H
 * ) => [string, H]}
 */
const makeHeaderEntry = (header) => [hashHeader(header), header];

/**
 * @type {<X, Y>(
 *   pair: [X, Y]
 * ) => Y}
 */
const getSecond = ([_first, second]) => second;

/**
 * @type {<H extends import("../header").Header>(
 *   headers: H[],
 * ) => H[]}
 */
const removeDuplicateHeader = (headers) =>
  map(listEntry(reduceEntry(map(headers, makeHeaderEntry))), getSecond);

/**
 * @type {(
 *   root: import("./atom").Program
 * ) => import("./atom").Program}
 */
const removeProgramDuplicateHeader = (root) => ({
  ...root,
  head: /** @type {any} */ (
    removeDuplicateHeader(
      /** @type {import("../header").Header[]} */ (root.head),
    )
  ),
});

/**
 * @type {(
 *   node: import("../sequence").Sequence<
 *     import("./prelude").ProgramPrelude,
 *     import("./atom").Program,
 *   >,
 * ) => {
 *   root: import("./atom").Program,
 *   warnings: import("./prelude/warning").Warning[],
 *   reboot: import("../reboot").RebootRecord,
 * }}
 */
const unsequenceProgram = ({ head, tail }) => {
  for (const {
    data: { message, origin },
  } of filterNarrow(head, isSyntaxErrorPrelude)) {
    throw new AranSyntaxError(message, { type: "complex", hash: origin });
  }
  return {
    root: removeProgramDuplicateHeader(tail),
    reboot: reduceEntry(map(filterNarrow(head, isContextPrelude), getData)),
    warnings: map(filterNarrow(head, isWarningPrelude), getData),
  };
};

/**
 * @type {(
 *   program: import("../source").Source,
 * ) => "strict" | "sloppy"}
 */
const getRootProgramMode = (program) => {
  switch (program.kind) {
    case "module": {
      return "strict";
    }
    case "script": {
      return hasUseStrictDirective(program.root.body) ? "strict" : "sloppy";
    }
    case "eval": {
      switch (program.situ.type) {
        case "global": {
          return hasUseStrictDirective(program.root.body) ? "strict" : "sloppy";
        }
        case "local": {
          switch (program.situ.mode) {
            case "strict": {
              return "strict";
            }
            case "sloppy": {
              return hasUseStrictDirective(program.root.body)
                ? "strict"
                : "sloppy";
            }
            default: {
              throw new AranTypeError(program.situ.mode);
            }
          }
        }
        case "aran": {
          throw new AranExecError("not a root program", program);
        }
        default: {
          throw new AranTypeError(program.situ);
        }
      }
    }
    default: {
      throw new AranTypeError(program);
    }
  }
};

/**
 * @type {(
 *   source: import("../source").Source,
 *   config: import("./config").Config,
 * ) => {
 *   root: import("./atom").Program,
 *   warnings: import("./prelude/warning").Warning[],
 *   reboot: import("../reboot").RebootRecord,
 * }}
 */
export const unbuild = (source, { global_declarative_record }) => {
  if (source.situ.type === "global" || source.situ.type === "local") {
    const mode = getRootProgramMode(source);
    const { report, unbound, annotation } = annotate(
      source.root,
      source.kind,
      mode,
    );
    return unsequenceProgram(
      prependSequence(
        map(report, makeSyntaxErrorPrelude),
        unbuildProgram(
          source.root,
          ROOT_META,
          { mode, scope: null, parent: "program", annotation },
          { unbound, sort: getProgramSort(source), global_declarative_record },
        ),
      ),
    );
  } else if (source.situ.type === "aran") {
    const mode =
      source.situ.mode === "strict" || hasUseStrictDirective(source.root.body)
        ? "strict"
        : "sloppy";
    const { report, unbound, annotation } = annotate(
      source.root,
      source.kind,
      mode,
    );
    return unsequenceProgram(
      prependSequence(
        map(report, makeSyntaxErrorPrelude),
        unbuildProgram(
          source.root,
          source.situ.meta,
          {
            mode,
            scope: unpackScope(source.situ.scope),
            parent: "program",
            annotation,
          },
          { unbound, sort: getProgramSort(source), global_declarative_record },
        ),
      ),
    );
  } else {
    throw new AranTypeError(source.situ);
  }
};
