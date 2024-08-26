/* eslint-disable no-use-before-define */

import { setupAran } from "../aran/index.mjs";
import { sanitizeMember } from "../argv.mjs";
import { AranTypeError } from "../error.mjs";

const { Promise } = globalThis;

/**
 * @type {(
 *   type: "standard" | "flexible",
 * ) => import("../aran").MakeAspect<null, unknown>}
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
              typeof code === "string" ? instrument(code, path, context) : code,
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
            typeof code === "string" ? instrument(code, path, context) : code,
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
 * @type {import("../stage").Stage}
 */
export default (options) =>
  Promise.resolve({
    precursor: ["identity", "parsing"],
    negative: [
      "arguments-two-way-binding",
      "function-dynamic-property",
      "negative-bare-duplicate-super-prototype-access",
      "negative-bare-early-module-declaration",
      "negative-bare-missing-iterable-return-in-pattern",
      "negative-bare-wrong-realm-for-default-prototype",
    ],
    exclude: ["function-string-representation"],
    listLateNegative: (_target, _metadata, error) =>
      error.layer === "meta" && error.name === "AranPatchError"
        ? ["patch-membrane"]
        : [],
    compileInstrument: ({ report, record, warning, context }) =>
      setupAran(
        sanitizeMember(options, "membrane", ["basic", "weave", "patch"]),
        compileMakeAspect(
          sanitizeMember(options, "weaving", ["standard", "flexible"]),
        ),
        {
          global_declarative_record: sanitizeMember(
            options,
            "global-declarative-record",
            ["builtin", "emulate"],
          ),
          initial: null,
          report,
          record,
          context,
          warning,
        },
      ),
  });
