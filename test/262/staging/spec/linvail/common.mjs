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
import { compileInterceptEval } from "../../helper.mjs";

const {
  Error,
  Object: { assign },
  Reflect: { defineProperty },
  console: { dir },
} = globalThis;

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
      const reasons = [
        ...listPrecursorFailure(index),
        ...listSlow(specifier),
        ...(specifier.startsWith("built-ins/RegExp/property-escapes/generated/")
          ? [
              /** @type {import("../../../tagging/tag").Tag} */ (
                "regexp-property-escape-generated"
              ),
            ]
          : []),
      ];
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
          compileInterceptEval({
            toEvalPath,
            weave,
            trans,
            retro,
            evalGlobal: /** @type {any} */ (intrinsics.globalThis.eval),
            evalScript: /** @type {any} */ (intrinsics.globalThis).$262
              .evalScript,
            Function: /** @type {any} */ (intrinsics.globalThis.Function),
            String: intrinsics.globalThis.String,
            SyntaxError: intrinsics.globalThis.SyntaxError,
            enterValue: advice.enterValue,
            leaveValue: advice.leaveValue,
            apply: advice.apply,
            construct: advice.construct,
            record_directory,
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
