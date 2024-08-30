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
         * @type {import("../../../lib").HomogeneousFlexibleAspect<
         *   null,
         *   unknown,
         *   [import("../../../lib").Path],
         * >}
         */
        const aspect1 = {
          _ARAN_EVAL_BEFORE_: {
            kind: "eval@before",
            pointcut: ({ tag: path }) => [path],
            advice: (_state, code, context, path) =>
              typeof code === "string" ? instrument(code, path, context) : code,
          },
        };
        /**
         * @type {null | import("../../../lib").HomogeneousFlexibleAspect<
         *   null,
         *   unknown,
         *   [],
         * >}
         */
        const aspect2 =
          apply === null
            ? null
            : {
                _ARAN_APPLY_AROUND_: {
                  kind: "apply@around",
                  pointcut: (_node) => [],
                  advice: (_state, callee, self, input) =>
                    apply(callee, self, input),
                },
              };
        /**
         * @type {null | import("../../../lib").HomogeneousFlexibleAspect<
         *   null,
         *   unknown,
         *   [],
         * >}
         */
        const aspect3 =
          construct === null
            ? null
            : {
                _ARAN_APPLY_AROUND_: {
                  kind: "construct@around",
                  pointcut: (_node) => [],
                  advice: (_state, callee, input) => construct(callee, input),
                },
              };
        return {
          type,
          data: {
            ...aspect1,
            ...aspect2,
            ...aspect3,
          },
        };
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
          initial_state: null,
          report,
          record,
          context,
          warning,
        },
      ),
  });
