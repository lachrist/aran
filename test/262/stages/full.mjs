/* eslint-disable no-use-before-define */

import { readFile } from "node:fs/promises";
import {
  getNegativeStatus,
  listNegativeCause,
  parseNegative,
} from "../negative.mjs";
import { getFailureTarget, parseFailureArray } from "../failure.mjs";
import { setupAran } from "../aran/index.mjs";
import { AranExecError, AranTypeError } from "../error.mjs";
import { parseList } from "../list.mjs";

const { Set, URL } = globalThis;

/** @type {["basic", "weave", "patch"]} */
const MEMBRANE = ["basic", "weave", "patch"];

/** @type {["builtin", "emulate"]} */
const GLOBAL_DECLARATIVE_RECORD = ["builtin", "emulate"];

/** @type {["standard", "flexible"]} */
const WEAVING = ["standard", "flexible"];

/**
 * @type {<X extends string>(
 *   candidate: string,
 *   enumeration: X[],
 * ) => X}
 */
export const parseEnumeration = (candidate, enumeration) => {
  for (const item of enumeration) {
    if (item === candidate) {
      return item;
    }
  }
  throw new AranExecError("invalid enumeration candidate");
};

/**
 * @type {(
 *   argv: string[]
 * ) => {
 *   membrane: "basic" | "weave" | "patch",
 *   global_declarative_record: "builtin" | "emulate",
 *   weaving: "standard" | "flexible",
 * }}
 */
const parseArgv = (argv) => {
  if (argv.length !== 3) {
    throw new AranExecError("Expected 3 arguments");
  }
  return {
    membrane: parseEnumeration(argv[0], MEMBRANE),
    global_declarative_record: parseEnumeration(
      argv[1],
      GLOBAL_DECLARATIVE_RECORD,
    ),
    weaving: parseEnumeration(argv[2], WEAVING),
  };
};

/**
 * @type {(
 *   type: "standard" | "flexible",
 * ) => import("../aran").MakeAspect<null>}
 */
const compileMakeAspect =
  (type) =>
  (_intrinsics, { instrument, apply, construct }) => {
    switch (type) {
      case "flexible": {
        /**
         * @type {import("../../../lib").HeterogeneousFlexibleAspect<
         *   null,
         *   unknown,
         *   {
         *     _ARAN_EVAL_BEFORE_: [import("../../../lib").Path],
         *     _ARAN_APPLY_AROUND_: [],
         *     _ARAN_CONSTRUCT_AROUND_: [],
         *   },
         * >}
         */
        const aspect = {
          _ARAN_EVAL_BEFORE_: {
            kind: "eval@before",
            pointcut: ({ tag: path }) => [path],
            advice: (_state, code, context, path) =>
              instrument(code, path, context),
          },
          _ARAN_APPLY_AROUND_:
            apply === null
              ? null
              : {
                  kind: "apply@around",
                  pointcut: (_node) => [],
                  advice: (_state, callee, self, input) =>
                    apply(callee, self, input),
                },
          _ARAN_CONSTRUCT_AROUND_:
            construct === null
              ? null
              : {
                  kind: "construct@around",
                  pointcut: (_node) => [],
                  advice: (_state, callee, input) => construct(callee, input),
                },
        };
        return { type, data: aspect };
      }
      case "standard": {
        /**
         * @type {import("../../../lib").StandardAspect<
         *   null,
         *   {
         *     Scope: unknown,
         *     Stack: unknown,
         *     Other: unknown,
         *   },
         * >}
         */
        const aspect = {
          "eval@before": (_state, context, code, path) =>
            instrument(code, path, context),
          "apply@around":
            apply === null
              ? null
              : (_state, callee, self, input, _path) =>
                  apply(callee, self, input),
          "construct@around":
            construct === null
              ? null
              : (_state, callee, input, _path) => construct(callee, input),
        };
        return { type, data: aspect };
      }
      default: {
        throw new AranTypeError(type);
      }
    }
  };

/**
 * @type {import("../types").Stage}
 */
export default async (argv) => {
  const exclusion = new Set([
    ...parseFailureArray(
      [
        await readFile(
          new URL("identity.failure.txt", import.meta.url),
          "utf8",
        ),
        await readFile(new URL("parsing.failure.txt", import.meta.url), "utf8"),
        await readFile(
          new URL(`bare-${argv.join("-")}.failure.txt`, import.meta.url),
          "utf8",
        ),
      ].join("\n"),
    ).map(getFailureTarget),
    ...parseList(
      await readFile(new URL("full.exclude.txt", import.meta.url), "utf8"),
    ),
  ]);
  const negative = parseNegative(
    await readFile(new URL("full.negative.txt", import.meta.url), "utf8"),
  );
  return {
    isExcluded: (target) => exclusion.has(target),
    predictStatus: (target) => getNegativeStatus(negative, target),
    listCause: (result) => listNegativeCause(negative, result.target),
    compileInstrument: ({ reject, record, warning, context }) => {
      const { membrane, global_declarative_record, weaving } = parseArgv(argv);
      return setupAran(membrane, compileMakeAspect(weaving), {
        global_declarative_record,
        initial: null,
        record,
        reject,
        context,
        warning,
      });
    },
  };
};
