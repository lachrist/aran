import {
  createRuntime,
  standard_pointcut as pointcut,
  weave as weaveCustomInner,
} from "linvail";
import { weaveStandard as weaveStandardInner } from "aran";
import { compileListPrecursorFailure } from "../../failure.mjs";
import { record } from "../../../record/index.mjs";
import { compileAran } from "../../aran.mjs";
import { toTestSpecifier } from "../../../result.mjs";
import { loadTaggingList } from "../../../tagging/index.mjs";
import { recreateError } from "../../../util/index.mjs";
import { compileFunctionCode } from "../../helper.mjs";

const {
  Error,
  String,
  Array: { from: toArray },
  Object: { assign },
  Reflect: { defineProperty },
  console: { dir },
} = globalThis;

/**
 * @type {<X, Y>(
 *   array: X[],
 *   transform: (item: X) => Y,
 * ) => Y[]}
 */
const map = (array, transform) =>
  toArray({ length: array.length }, (_, index) => transform(array[index]));

/**
 * @type {import("aran").Digest}
 */
const digest = (_node, node_path, file_path, _kind) =>
  `${file_path}:${node_path}`;

/**
 * @type {(hash: string) => string}
 */
const toEvalPath = (hash) => `dynamic://eval/local/${hash}`;

const advice_global_variable = "__ARAN_ADVICE__";

const listSlow = await loadTaggingList(["slow"]);

const listNegative = await loadTaggingList(["proxy"]);

/**
 * @type {<atom extends import("aran").Atom>(
 *   config: {
 *     intrinsics: import("aran").IntrinsicRecord,
 *     advice: Pick<
 *       import("linvail").Advice,
 *       "enterValue" | "leaveValue" | "apply" | "construct"
 *     >,
 *     record_directory: null | URL,
 *     weave: (
 *       root: import("aran").Program<atom>,
 *     ) => import("aran").Program,
 *     trans: (
 *       path: string,
 *       kind: "script" | "module" | "eval",
 *       code: string,
 *     ) => import("aran").Program<atom>,
 *     retro: (
 *       root: import("aran").Program,
 *     ) => string,
 *   },
 * ) => Pick<import("linvail").Advice, "apply" | "construct">}
 */
export const interceptGlobalEval = ({
  advice: { construct, apply, leaveValue, enterValue },
  intrinsics,
  record_directory,
  weave,
  trans,
  retro,
}) => {
  const globals = {
    eval: {
      external: intrinsics.globalThis.eval,
      internal: enterValue(
        /** @type {import("linvail").ExternalValue} */ (
          /** @type {unknown} */ (intrinsics.globalThis.eval)
        ),
      ),
    },
    evalScript: {
      external:
        /** @type {{$262: { evalScript: (code: string) => import("linvail").ExternalValue}}} */ (
          /** @type {unknown} */ (intrinsics.globalThis)
        ).$262.evalScript,
      internal: enterValue(
        /** @type {{$262: {evalScript: import("linvail").ExternalValue}}} */ (
          /** @type {unknown} */ (intrinsics.globalThis)
        ).$262.evalScript,
      ),
    },
    Function: {
      internal: enterValue(
        /** @type {import("linvail").ExternalValue} */ (
          /** @type {unknown} */ (intrinsics.globalThis.eval)
        ),
      ),
    },
  };
  const syntax_error_mapping = {
    SyntaxError: intrinsics.globalThis.SyntaxError,
    AranSyntaxError: intrinsics.globalThis.SyntaxError,
  };
  return {
    apply: (target, that, input) => {
      if (target === globals.eval.internal && input.length > 0) {
        const code = leaveValue(input[0]);
        if (typeof code === "string") {
          try {
            const path = "dynamic://eval/global";
            const { content } = record(
              {
                path,
                content: retro(weave(trans(path, "eval", code))),
              },
              record_directory,
            );
            return enterValue(globals.eval.external(content));
          } catch (error) {
            throw recreateError(error, syntax_error_mapping);
          }
        }
      }
      if (target === globals.evalScript.internal && input.length > 0) {
        const code = String(leaveValue(input[0]));
        try {
          const path = "dynamic://script/global";
          const { content } = record(
            {
              path,
              content: retro(weave(trans(path, "script", code))),
            },
            record_directory,
          );
          return enterValue(globals.evalScript.external(content));
        } catch (error) {
          throw recreateError(error, syntax_error_mapping);
        }
      }
      return apply(target, that, input);
    },
    construct: (target, input) => {
      if (target === globals.Function.internal) {
        try {
          const path = "dynamic://function/global";
          const { content } = record(
            {
              path,
              content: retro(
                weave(
                  trans(
                    path,
                    "eval",
                    compileFunctionCode(map(input, leaveValue)),
                  ),
                ),
              ),
            },
            record_directory,
          );
          return /** @type {import("linvail").InternalReference} */ (
            enterValue(globals.eval.external(content))
          );
        } catch (error) {
          throw recreateError(error, syntax_error_mapping);
        }
      }
      return construct(target, input);
    },
  };
};

/**
 * @type {(
 *   instrumentation: "custom" | "standard",
 * ) => (
 *   root: import("aran").Program,
 * ) => import("aran").Program}}
 */
const compileWeave = (instrumentation) => {
  switch (instrumentation) {
    case "custom": {
      return (root) => weaveCustomInner(root, { advice_global_variable });
    }
    case "standard": {
      return (root) =>
        weaveStandardInner(
          /** @type {import("aran").Program<import("aran").Atom & { Tag: string }>} */ (
            root
          ),
          {
            initial_state: null,
            advice_global_variable,
            pointcut,
          },
        );
    }
    default: {
      throw new Error("unknown instrumentation", {
        cause: { instrumentation },
      });
    }
  }
};

/**
 * @type {(
 *   config: {
 *     include: "main" | "comp",
 *     instrumentation: "standard" | "custom",
 *   },
 * ) => Promise<import("../../stage").Stage<
 *   import("../../stage").Config,
 *   import("../../stage").Config,
 * >>}
 */
export const createStage = async ({ include, instrumentation }) => {
  const listPrecursorFailure = await compileListPrecursorFailure([
    `bare-${include}`,
  ]);
  const { prepare, trans, retro } = compileAran(
    {
      mode: "normal",
      escape_prefix: "__aran__",
      global_object_variable: "globalThis",
      intrinsic_global_variable: "__intrinsic__",
      global_declarative_record: include === "comp" ? "emulate" : "builtin",
      digest,
    },
    toEvalPath,
  );
  const weave = compileWeave(instrumentation);
  return {
    // eslint-disable-next-line require-await
    open: async (config) => config,
    close: async (_config) => {},
    // eslint-disable-next-line require-await
    setup: async (config, [index, { path, directive }]) => {
      const specifier = toTestSpecifier(path, directive);
      const reasons = [...listPrecursorFailure(index), ...listSlow(specifier)];
      if (reasons.length > 0) {
        return { type: "exclude", reasons };
      } else {
        return {
          type: "include",
          state: config,
          flaky: false,
          negatives: listNegative(specifier),
        };
      }
    },
    prepare: ({ record_directory }, context) => {
      const { intrinsics } = prepare(context, { record_directory });
      const { library, advice } = createRuntime(intrinsics, {
        dir: (value) => {
          dir(value, { showHidden: true, showProxy: true });
        },
      });
      if (include === "comp") {
        const { leavePlainInternalReference } = advice;
        // const global_object = leavePlainInternalReference(
        //   /** @type {any} */ ({
        //     __proto__: enterPlainExternalReference(
        //       /** @type {any} */ (intrinsics["aran.global_object"]),
        //     ),
        //   }),
        // );
        // intrinsics["aran.global_object"] = /** @type {any} */ (global_object);
        // intrinsics.globalThis = /** @type {any} */ (global_object);
        intrinsics["aran.global_declarative_record"] = /** @type {any} */ (
          leavePlainInternalReference(
            /** @type {any} */ (intrinsics["aran.global_declarative_record"]),
          )
        );
        assign(
          advice,
          interceptGlobalEval({
            advice,
            intrinsics,
            record_directory,
            weave,
            trans,
            retro,
          }),
        );
      }
      {
        const descriptor = {
          __proto__: null,
          value: { ...advice, weaveEvalProgram: weave },
          enumerable: false,
          writable: false,
          configurable: false,
        };
        defineProperty(
          intrinsics["aran.global_object"],
          advice_global_variable,
          descriptor,
        );
      }
      {
        const descriptor = {
          __proto__: null,
          value: library,
          enumerable: false,
          writable: false,
          configurable: false,
        };
        defineProperty(intrinsics["aran.global_object"], "Linvail", descriptor);
      }
    },
    instrument: (
      { record_directory },
      { type, kind, path, content: code1 },
    ) => {
      if (include === "comp" || type === "main") {
        /** @type {import("aran").Program} */
        const root1 = trans(path, kind, code1);
        const root2 = weave(root1);
        const code2 = retro(root2);
        return record({ path, content: code2 }, record_directory);
      } else {
        return record({ path, content: code1 }, record_directory);
      }
    },
    teardown: async (_state) => {},
  };
};
