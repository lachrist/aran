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
import { compileInterceptEval, reduce } from "../../helper.mjs";
import { printBranching } from "./branching.mjs";
import { digest, toEvalPath } from "./location.mjs";

const {
  URL,
  Object: { assign },
  Reflect: { apply, defineProperty },
  WeakMap,
  console: { dir },
  WeakMap: {
    prototype: { get: getWeakMap, set: setWeakMap },
  },
} = globalThis;

/**
 * @typedef {import("./location").NodeHash} NodeHash
 * @typedef {import("./location").FilePath} FilePath
 * @typedef {import("./location").Program} Program
 * @typedef {number & { __brand: "TreeSize" }} TreeSize
 * @typedef {WeakMap<import("linvail").InternalPrimitive, TreeSize>} Registery
 */

const advice_global_variable = "__ARAN_ADVICE__";

const init_tree_size = /** @type {TreeSize} */ (1);

const zero_tree_size = /** @type {TreeSize} */ (0);

/**
 * @type {(
 *   registery: Registery,
 *   value: import("linvail").InternalValue,
 * ) => TreeSize}
 */
const getTreeSize = (registery, value) =>
  apply(getWeakMap, registery, [value]) ?? zero_tree_size;

/**
 * @type {(
 *   registery: Registery,
 *   primitive: import("linvail").InternalPrimitive,
 *   size: TreeSize,
 * ) => void}
 */
const registerTreeSize = (registery, primitive, size) => {
  apply(setWeakMap, registery, [primitive, size]);
};

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
 *       size: TreeSize,
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
  const registery = new WeakMap();
  return {
    ...advice,
    "test@before": (state, kind, value, tag) => {
      recordBranch(kind, getTreeSize(registery, value), tag);
      return adviceBeforeTest(state, kind, value, tag);
    },
    "apply@around": (state, callee, that, input, tag) => {
      const result = adviceApplyAround(state, callee, that, input, tag);
      if (isInternalPrimitive(result)) {
        const fresh = enterPrimitive(leavePrimitive(result));
        registerTreeSize(
          registery,
          fresh,
          /** @type {TreeSize} */ (
            reduce(
              input,
              (size, value) => size + getTreeSize(registery, value),
              init_tree_size +
                getTreeSize(registery, callee) +
                getTreeSize(registery, that) +
                getTreeSize(registery, result),
            )
          ),
        );
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
 *     buffer: [TreeSize, NodeHash][],
 *   },
 * >>}
 */
export const createStage = async ({ include }) => {
  const listPrecursorFailure = await compileListPrecursorFailure([
    `linvail/stage-stnd-${include}`,
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
   *   root: Program,
   * ) => Program}
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
            buffer.push([size, hash]);
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
