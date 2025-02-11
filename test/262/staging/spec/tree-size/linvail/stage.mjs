import { open } from "node:fs/promises";
import { weaveStandard } from "aran";
import {
  createRuntime,
  standard_pointcut as pointcut,
  toStandardAdvice,
} from "../../../../../../../linvail/lib/runtime/_.mjs";
import { compileAran } from "../../../aran.mjs";
import { record } from "../../../../record/index.mjs";
import { compileListPrecursorFailure } from "../../../failure.mjs";
import { hashFowler32, hashXor16 } from "../../../../util/hash.mjs";
import { listThresholdExclusion, threshold } from "../threshold.mjs";
import { AranExecError } from "../../../../error.mjs";

const {
  JSON,
  Array,
  URL,
  Reflect: { apply, defineProperty },
  WeakMap,
  console: { dir },
  WeakMap: {
    prototype: { get: getWeakMap, set: setWeakMap },
  },
} = globalThis;

/**
 * @type {<X, Y>(
 *   array: X[],
 *   accumulate: (result: Y, item: X) => Y,
 *   initial: Y,
 * ) => Y}
 */
const reduce = (array, accumulate, result) => {
  const { length } = array;
  for (let index = 0; index < length; index++) {
    result = accumulate(result, array[index]);
  }
  return result;
};

/**
 * @typedef {import("../../../../../../../linvail/lib/runtime/domain").InternalPrimitive} InternalPrimitive
 * @typedef {import("../../../../../../../linvail/lib/runtime/domain").ExternalPrimitive} ExternalPrimitive
 * @typedef {import("../../../../../../../linvail/lib/runtime/domain").InternalValue} InternalValue
 * @typedef {import("../../../../../../../linvail/lib/runtime/domain").ExternalValue} ExternalValue
 * @typedef {string & { __brand: "NodeHash" }} NodeHash
 * @typedef {import("aran").Atom & { Tag: NodeHash }} Atom
 * @typedef {number & { __brand: "TreeSize" }} TreeSize
 * @typedef {WeakMap<InternalPrimitive, TreeSize>} Registery
 * @typedef {import("../../../../../../../linvail/lib/runtime/standard").StandardAdvice<NodeHash>} StandardAdvice
 */

const advice_global_variable = "__ARAN_ADVICE__";

/**
 * @type {import("aran").Digest<{
 *   NodeHash: NodeHash,
 * }>}
 */
const digest = (_node, node_path, file_path, _kind) =>
  /** @type {NodeHash} */ (`${file_path}:${node_path}`);

/**
 * @type {(hash: NodeHash) => string}
 */
const toEvalPath = (hash) => `dynamic://eval/local/${hash}`;

/**
 * @type {import("aran").TransConfig}
 */
const trans_config = {
  global_declarative_record: "builtin",
  digest,
};

/**
 * @type {import("aran").RetroConfig}
 */
const retro_config = {
  mode: "normal",
  escape_prefix: "$aran",
  global_object_variable: "globalThis",
  intrinsic_global_variable: "__aran_intrinsic__",
};

const { prepare, trans, retro } = compileAran(
  { ...trans_config, ...retro_config },
  toEvalPath,
);

////////////
// Export //
////////////

const listPrecursorFailure = await compileListPrecursorFailure([
  "bare-comp",
  "bare-main",
]);

const init_tree_size = /** @type {TreeSize} */ (1);

/**
 * @type {(
 *   registery: Registery,
 *   value: InternalValue,
 * ) => TreeSize}
 */
const getTreeSize = (registery, value) =>
  apply(getWeakMap, registery, [value]) || init_tree_size;

/**
 * @type {(
 *   registery: Registery,
 *   primitive: InternalPrimitive,
 *   size: TreeSize,
 * ) => void}
 */
const registerTreeSize = (registery, primitive, size) => {
  apply(setWeakMap, registery, [primitive, size]);
};

/**
 * @type {(
 *   advice: StandardAdvice,
 *   config: {
 *     isInternalPrimitive: (
 *       value: InternalValue,
 *     ) => value is InternalPrimitive,
 *     enterPrimitive: (
 *       primitive: ExternalPrimitive,
 *     ) => InternalPrimitive,
 *     leavePrimitive: (
 *       primitive: InternalPrimitive,
 *     ) => ExternalPrimitive,
 *     recordBranch: (
 *       kind: import("aran").TestKind,
 *       size: TreeSize,
 *       hash: NodeHash,
 *     ) => void
 *   },
 * ) => StandardAdvice}
 */
const updateAdvice = (
  {
    "test@before": adviceBeforeTest,
    "eval@before": adviceBeforeEval,
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
    "test@before": (state, kind, value, tag) => {
      recordBranch(kind, getTreeSize(registery, value), tag);
      return adviceBeforeTest(state, kind, value, tag);
    },
    "eval@before": (state, value, tag) => {
      const root1 = /** @type {import("aran").Program<Atom>} */ (
        /** @type {unknown} */ (adviceBeforeEval(state, value, tag))
      );
      const root2 = weaveStandard(root1, {
        advice_global_variable,
        initial_state: null,
        pointcut,
      });
      return /** @type {ExternalValue} */ (/** @type {unknown} */ (root2));
    },
    "apply@around": (state, callee, that, input, tag) => {
      const result = adviceApplyAround(state, callee, that, input, tag);
      if (isInternalPrimitive(result)) {
        const fresh = enterPrimitive(leavePrimitive(result));
        registerTreeSize(
          registery,
          fresh,
          /** @type {TreeSize} */ (
            init_tree_size +
              getTreeSize(registery, callee) +
              getTreeSize(registery, that) +
              reduce(
                input,
                (size, value) => size + getTreeSize(registery, value),
                0,
              ) +
              getTreeSize(registery, result)
          ),
        );
        return fresh;
      } else {
        return result;
      }
    },
    ...advice,
  };
};

/**
 * @type {import("../../../stage").Stage<
 *   {
 *     handle: import("node:fs/promises").FileHandle,
 *     record_directory: null | URL,
 *   },
 *   {
 *     handle: import("node:fs/promises").FileHandle,
 *     record_directory: null | URL,
 *     index: import("../../../../test-case").TestIndex,
 *     buffer: [TreeSize, NodeHash][],
 *   },
 * >}
 */
export default {
  open: async ({ record_directory }) => ({
    record_directory,
    handle: await open(new URL(`size/linvail.jsonl`, import.meta.url), "w"),
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
  instrument: ({ record_directory }, { kind, path, content: code1 }) => {
    const root1 = trans(path, kind, code1);
    const root2 = weaveStandard(root1, {
      advice_global_variable,
      pointcut,
      initial_state: null,
    });
    const code2 = retro(root2);
    return record({ path, content: code2 }, record_directory);
  },
  teardown: async ({ handle, buffer }) => {
    const { length } = buffer;
    /** @type {number[]} */
    const content = new Array(2 * buffer.length);
    for (let index = 0; index < length; index++) {
      const [size, tag] = buffer[index];
      content[2 * index] = size;
      content[2 * index + 1] = hashXor16(hashFowler32(tag));
    }
    await handle.write(JSON.stringify(content) + "\n");
  },
};
