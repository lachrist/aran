import { weave as weaveCustomInner } from "../../../../../../linvail/lib/instrument/_.mjs";
import { weaveStandard as weaveStandardInner } from "aran";
import {
  createRuntime,
  standard_pointcut as pointcut,
} from "../../../../../../linvail/lib/runtime/_.mjs";
import { compileListPrecursorFailure } from "../../failure.mjs";
import { record } from "../../../record/index.mjs";
import { compileAran } from "../../aran.mjs";
import { toTestSpecifier } from "../../../result.mjs";
import { loadTaggingList } from "../../../tagging/index.mjs";
import { recreateError } from "../../../util/index.mjs";

const {
  Error,
  String,
  Array: {
    from: toArray,
    prototype: { join, pop },
  },
  Object: { is, assign },
  Reflect: { apply, defineProperty },
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

const listPrecursorFailure = await compileListPrecursorFailure(["stnd-full"]);

const listNegative = await loadTaggingList(["proxy"]);

/**
 * @type {(
 *   input: import("../../../../../../linvail/lib/runtime/domain").ExternalValue[],
 * ) => string}
 */
const compileFunctionCode = (input) => {
  if (input.length === 0) {
    return "(function anonymous() {\n})";
  } else {
    const parts = map(input, String);
    const body = apply(pop, parts, []);
    return `(function anonymous(${apply(join, parts, [","])}\n) {\n${body}\n})`;
  }
};

/**
 * @type {(
 *   config: {
 *     intrinsics: import("aran").IntrinsicRecord,
 *     advice: Pick<
 *       import("../../../../../../linvail/lib/advice").Advice,
 *       "enterValue" | "leaveValue" | "apply" | "construct"
 *     >,
 *     record_directory: null | URL,
 *     weave: (root: import("aran").Program) => import("aran").Program,
 *     trans: (
 *       path: string,
 *       kind: "script" | "module" | "eval",
 *       code: string,
 *     ) => import("aran").Program,
 *     retro: (
 *       root: import("aran").Program,
 *     ) => string,
 *   },
 * ) => Partial<import("../../../../../../linvail/lib/advice").Advice>}
 */
const compileCall = ({
  advice: { construct, apply, leaveValue, enterValue },
  intrinsics,
  record_directory,
  weave,
  trans,
  retro,
}) => {
  const globals = {
    eval: intrinsics.globalThis.eval,
    evalScript: /** @type {{$262: import("../../../$262").$262}} */ (
      /** @type {unknown} */ (intrinsics.globalThis)
    ).$262.evalScript,
    Function: intrinsics.globalThis.Function,
  };
  const syntax_error_mapping = {
    SyntaxError: intrinsics.globalThis.SyntaxError,
    AranSyntaxError: intrinsics.globalThis.SyntaxError,
  };
  return {
    apply: (target, that, input) => {
      const callee = leaveValue(target);
      if (is(callee, globals.eval) && input.length > 0) {
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
            return enterValue(globals.eval(content));
          } catch (error) {
            throw recreateError(error, syntax_error_mapping);
          }
        }
      }
      if (is(callee, globals.evalScript) && input.length > 0) {
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
          return enterValue(
            /** @type {import("../../../../../../linvail/lib/runtime/domain").ExternalValue} */ (
              globals.evalScript(content)
            ),
          );
        } catch (error) {
          throw recreateError(error, syntax_error_mapping);
        }
      }
      return apply(target, that, input);
    },
    construct: (target, input) => {
      const callee = leaveValue(target);
      if (is(callee, globals.Function)) {
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
          return /** @type {import("../../../../../../linvail/lib/runtime/domain").InternalReference} */ (
            enterValue(globals.eval(content))
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
 *     target: "main" | "*",
 *     instrumentation: "standard" | "custom",
 *   },
 * ) => import("../../stage").Stage<
 *   import("../../stage").Config,
 *   import("../../stage").Config,
 * >}
 */
export const createStage = ({ target, instrumentation }) => {
  const { prepare, trans, retro } = compileAran(
    {
      mode: "normal",
      escape_prefix: "__aran__",
      global_object_variable: "globalThis",
      intrinsic_global_variable: "__intrinsic__",
      global_declarative_record: target === "*" ? "emulate" : "builtin",
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
      const reasons = listPrecursorFailure(index);
      const specifier = toTestSpecifier(path, directive);
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
      if (target === "*") {
        const { leavePlainInternalReference } = advice;
        // intrinsics["aran.global_object"] = /** @type {any} */ (
        //   leavePlainInternalReference(
        //     /** @type {any} */ ({
        //       __proto__: enterPlainExternalReference(
        //         /** @type {any} */ (intrinsics["aran.global_object"]),
        //       ),
        //     }),
        //   )
        // );
        intrinsics["aran.global_declarative_record"] = /** @type {any} */ (
          leavePlainInternalReference(
            /** @type {any} */ (intrinsics["aran.global_declarative_record"]),
          )
        );
        assign(
          advice,
          compileCall({
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
      if (target === "*" || type === "main") {
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
