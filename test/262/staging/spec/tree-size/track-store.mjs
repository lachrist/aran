import { open } from "node:fs/promises";
import { weaveStandard } from "aran";
import {
  createRuntime,
  standard_pointcut as pointcut,
  toStandardAdvice,
} from "linvail";
import { compileAran } from "../../aran.mjs";
import { record } from "../../../record/index.mjs";
import { compileListPrecursorFailure } from "../../failure.mjs";
import { compileListThresholdExclusion, threshold } from "./threshold.mjs";
import { AranExecError } from "../../../error.mjs";
import { compileInterceptEval } from "../../helper.mjs";
import { printBranching } from "./branching.mjs";
import { digest, parseNodeHash, toEvalPath } from "./location.mjs";
import { createSizeRegistery, getSize, setSize } from "./size.mjs";

const {
  URL,
  Object: { assign },
  Reflect: { defineProperty },
  console: { dir },
} = globalThis;

/**
 * @typedef {import("./location").NodeHash} NodeHash
 * @typedef {import("./location").FilePath} FilePath
 * @typedef {import("./location").Atom} Atom
 * @typedef {import("./size").Size} Size
 * @typedef {import("./size").Registery<import("linvail").InternalValue>} Registery
 */

const advice_global_variable = "__ARAN_ADVICE__";

/**
 * @type {(
 *   advice: import("linvail").StandardAdvice<NodeHash>,
 *   config: {
 *     isInternalPrimitive: (
 *       value: import("linvail").InternalValue,
 *     ) => value is import("linvail").InternalPrimitive,
 *     enterPrimitive: (
 *       primitive: import("linvail").ExternalPrimitive,
 *     ) => import("linvail").InternalPrimitive,
 *     leavePrimitive: (
 *       primitive: import("linvail").InternalPrimitive,
 *     ) => import("linvail").ExternalPrimitive,
 *     recordBranch: (
 *       kind: import("aran").TestKind,
 *       size: Size,
 *       hash: NodeHash,
 *     ) => void
 *   },
 * ) => import("linvail").StandardAdvice<NodeHash>}
 */
const updateAdvice = (
  {
    "test@before": adviceBeforeTest,
    "apply@around": adviceApplyAround,
    ...advice
  },
  { recordBranch, isInternalPrimitive, enterPrimitive, leavePrimitive },
) => {
  /**
   * @type {Registery}
   */
  const registery = createSizeRegistery();
  return {
    ...advice,
    "test@before": (state, kind, value, tag) => {
      recordBranch(kind, getSize(registery, value), tag);
      return adviceBeforeTest(state, kind, value, tag);
    },
    "apply@around": (state, callee, that, input, tag) => {
      const result = adviceApplyAround(state, callee, that, input, tag);
      if (isInternalPrimitive(result)) {
        const fresh = enterPrimitive(leavePrimitive(result));
        setSize(registery, fresh, { callee, that, input, result });
        return fresh;
      } else {
        return result;
      }
    },
  };
};

/**
 * @type {(
 *   config: {
 *     include: "main" | "comp",
 *   },
 * ) => Promise<import("../../stage").Stage<
 *   {
 *     handle: import("node:fs/promises").FileHandle,
 *     record_directory: null | URL,
 *   },
 *   {
 *     handle: import("node:fs/promises").FileHandle,
 *     record_directory: null | URL,
 *     index: import("../../../test-case").TestIndex,
 *     buffer: import("./branch").Branch[],
 *   },
 * >>}
 */
export const createStage = async ({ include }) => {
  const listPrecursorFailure = await compileListPrecursorFailure([
    `linvail/stnd-${include}`,
  ]);
  const { prepare, trans, retro } = compileAran(
    {
      digest,
      global_declarative_record: include === "comp" ? "emulate" : "builtin",
      mode: "normal",
      escape_prefix: "$aran",
      global_object_variable: "globalThis",
      intrinsic_global_variable: "__aran_intrinsic__",
    },
    toEvalPath,
  );
  /**
   * @type {(
   *   root: import("aran").Program<Atom>,
   * ) => import("aran").Program<Atom>}
   */
  const weave = (root) =>
    weaveStandard(root, {
      advice_global_variable,
      pointcut,
      initial_state: null,
    });
  const listThresholdExclusion = await compileListThresholdExclusion(include);
  return {
    open: async ({ record_directory }) => ({
      record_directory,
      handle: await open(
        new URL(`track/store-${include}-output.jsonl`, import.meta.url),
        "w",
      ),
    }),
    close: async ({ handle }) => {
      await handle.close();
    },
    setup: async ({ handle, record_directory }, [index, _test]) => {
      const reasons = [
        ...listPrecursorFailure(index),
        ...listThresholdExclusion(index),
      ];
      if (reasons.length > 0) {
        await handle.write("\n");
        return { type: "exclude", reasons };
      } else {
        return {
          type: "include",
          state: {
            handle,
            index,
            record_directory,
            buffer: [],
          },
          flaky: false,
          negatives: [],
        };
      }
    },
    prepare: ({ index, buffer, record_directory }, context) => {
      const { intrinsics } = prepare(context, { record_directory });
      const { advice } = createRuntime(intrinsics, { dir });
      advice.weaveEvalProgram = weave;
      if (include === "comp") {
        assign(
          advice,
          compileInterceptEval({
            toEvalPath,
            trans,
            retro,
            weave,
            String: intrinsics.globalThis.String,
            SyntaxError: intrinsics.globalThis.SyntaxError,
            enterValue: advice.enterValue,
            leaveValue: advice.leaveValue,
            apply: advice.apply,
            construct: advice.construct,
            evalGlobal: /** @type {any} */ (intrinsics.globalThis.eval),
            evalScript: /** @type {any} */ (intrinsics.globalThis).$262
              .evalScript,
            Function: /** @type {any} */ (intrinsics.globalThis.Function),
            record_directory,
          }),
        );
      }
      const descriptor = {
        __proto__: null,
        value: updateAdvice(toStandardAdvice(advice), {
          ...advice,
          recordBranch: (_kind, size, hash) => {
            if (buffer.length >= threshold) {
              throw new AranExecError("buffer overflow", {
                index,
                threshold,
                buffer,
              });
            }
            const { path, type } = parseNodeHash(hash);
            buffer.push({ path, type, size });
          },
        }),
        enumerable: false,
        writable: false,
        configurable: false,
      };
      defineProperty(
        intrinsics["aran.global_object"],
        advice_global_variable,
        descriptor,
      );
    },
    instrument: (
      { record_directory },
      { type, kind, path, content: code1 },
    ) => {
      if (include === "comp" || type === "main") {
        const root1 = trans(/** @type {FilePath} */ (path), kind, code1);
        const root2 = weave(root1);
        const code2 = retro(root2);
        return record({ path, content: code2 }, record_directory);
      } else {
        return record({ path, content: code1 }, record_directory);
      }
    },
    teardown: async ({ handle, buffer }) => {
      await handle.write(printBranching(buffer) + "\n");
    },
  };
};
