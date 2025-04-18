import {
  createRuntime,
  standard_pointcut as pointcut,
  toStandardAdvice,
} from "linvail/runtime";
import { weave as weaveCustom } from "linvail/instrument";
import { weaveStandard } from "aran";
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

/**
 * @type {(
 *   instrumentation: "custom" | "standard",
 * ) => (
 *   root: import("aran").Program,
 * ) => import("aran").Program}
 */
const compileWeave = (instrumentation) => {
  switch (instrumentation) {
    case "custom": {
      return (root) => weaveCustom(root, { advice_global_variable });
    }
    case "standard": {
      return (root) =>
        weaveStandard(
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
 * ) => Promise<import("../../stage.d.ts").Stage<
 *   import("../../stage.d.ts").Config,
 *   import("../../stage.d.ts").Config,
 * >>}
 */
export const createStage = async ({ include, instrumentation }) => {
  const listSlow = await loadTaggingList(["slow"]);
  const listNegative = await loadTaggingList([
    "proxy",
    "cyclic-prototype-chain",
    "default-array-prototype-realm",
    ...(include === "comp"
      ? [/** @type {"elusive-dynamic-code"} */ ("elusive-dynamic-code")]
      : []),
  ]);
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
              /** @type {import("../../../tagging/tag.d.ts").Tag} */ (
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
      const actual_global = intrinsics.globalThis;
      if (include === "comp") {
        /**
         * @type {import("linvail").GuestReference & {
         *   Function: import("linvail").Value,
         *   String: (value: import("linvail").Value) => string,
         *   SyntaxError: new (message: string) => unknown,
         *   $262: {
         *     evalScript: (
         *       & import("linvail").Value
         *       & ((code: string) => import("linvail").Value)
         *     ),
         *   },
         *   eval: (
         *     & ((code: string) => import("linvail").Value)
         *     & import("linvail").Value
         *   ),
         * }}
         */
        const plain_external_global = /** @type {any} */ (
          intrinsics.globalThis
        );
        const {
          eval: evalGlobal,
          String,
          Function,
          SyntaxError,
          $262: { evalScript },
        } = plain_external_global;
        const { apply, construct, wrap, toHostReferenceWrapper } = advice;
        const plain_internal_global = toHostReferenceWrapper(
          plain_external_global,
          { prototype: "Object.prototype" },
        );
        const external_global = plain_internal_global.inner;
        intrinsics.globalThis = /** @type {any} */ (external_global);
        intrinsics["aran.global_object"] = /** @type {any} */ (external_global);
        intrinsics["aran.global_declarative_record"] = toHostReferenceWrapper(
          /** @type {any} */ (intrinsics["aran.global_declarative_record"]),
          { prototype: "none" },
        ).inner;
        assign(
          advice,
          compileInterceptEval({
            toEvalPath,
            weave,
            trans,
            retro,
            evalGlobal,
            evalScript,
            Function,
            String,
            SyntaxError,
            enterValue: wrap,
            leaveValue: ({ inner }) => inner,
            apply,
            construct,
            record_directory,
          }),
        );
      }
      {
        advice.weaveEvalProgram = weave;
        const descriptor = {
          __proto__: null,
          value:
            instrumentation === "standard" ? toStandardAdvice(advice) : advice,
          enumerable: false,
          writable: false,
          configurable: false,
        };
        defineProperty(actual_global, advice_global_variable, descriptor);
      }
      {
        const descriptor = {
          __proto__: null,
          value: library,
          enumerable: false,
          writable: false,
          configurable: false,
        };
        defineProperty(actual_global, "Linvail", descriptor);
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
