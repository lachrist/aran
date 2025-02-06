import { createRuntime } from "../../../../../../../linvail/lib/runtime/_.mjs";
import { compileAran } from "../../../aran.mjs";
import { record } from "../../../../record/index.mjs";
import { open } from "node:fs/promises";
import { compileListPrecursorFailure } from "../../../failure.mjs";
import { hashFowler32, hashXor16 } from "../../../../util/hash.mjs";
import { listThresholdExclusion, threshold } from "../threshold.mjs";
import { AranExecError } from "../../../../error.mjs";

const {
  JSON,
  Array,
  URL,
  Reflect: { defineProperty },
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
 *     buffer: [
 *       number,
 *       import("aran").EstreeNodePath,
 *     ][],
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
    /**
     * @type {(
     *   kind: import("aran").TestKind,
     *   size: number,
     *   tag: import("aran").EstreeNodePath,
     * ) => void}
     */
    const recordBranch = (_kind, size, tag) => {
      if (buffer.length >= threshold) {
        throw new AranExecError("buffer overflow", {
          index,
          threshold,
          buffer,
        });
      }
      buffer.push([size, tag]);
    };
    const descriptor = {
      __proto__: null,
      value: createAdvice(intrinsics, { recordBranch }),
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
    const root2 = weave(root1);
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
