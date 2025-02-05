import { compileAran } from "./aran.mjs";
import { record } from "../record/index.mjs";
import {
  advice_global_variable,
  createAdvice,
  weave,
} from "../../aspects/tree-size.mjs";
import { open } from "node:fs/promises";
import { compileListPrecursorFailure } from "./failure.mjs";
import { toTestSpecifier } from "./../result.mjs";
import { hashFowler32, hashXor16 } from "./hash.mjs";

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

const max_buffer_length = 512;

/**
 * @type {(
 *   config: {
 *     procedural: "inter" | "intra",
 *   },
 * ) => import("./stage").Stage<
 *   {
 *     handle: import("node:fs/promises").FileHandle,
 *     record_directory: null | URL,
 *   },
 *   {
 *     handle: import("node:fs/promises").FileHandle,
 *     record_directory: null | URL,
 *     buffer: [
 *       number,
 *       import("aran").EstreeNodePath,
 *     ][],
 *   },
 * >}
 */
export const compileStage = ({ procedural }) => ({
  open: async ({ record_directory }) => ({
    record_directory,
    handle: await open(
      new URL(`output/tree-size-${procedural}.jsonl`, import.meta.url),
      "w",
    ),
  }),
  close: async ({ handle }) => {
    await handle.close();
  },
  // eslint-disable-next-line require-await
  setup: async ({ handle, record_directory }, { path, directive }) => {
    const specifier = toTestSpecifier(path, directive);
    const reasons = listPrecursorFailure(specifier);
    if (reasons.length > 0) {
      return { type: "exclude", reasons };
    } else {
      return {
        type: "include",
        state: {
          handle,
          record_directory,
          buffer: [],
        },
        flaky: false,
        negatives: [],
      };
    }
  },
  prepare: ({ buffer, record_directory }, context) => {
    const { intrinsics } = prepare(context, { record_directory });
    /**
     * @type {(
     *   kind: import("aran").TestKind,
     *   size: number,
     *   tag: import("aran").EstreeNodePath,
     * ) => void}
     */
    const recordBranch = (_kind, size, tag) => {
      if (buffer.length < max_buffer_length) {
        buffer.push([size, tag]);
      }
    };
    const descriptor = {
      __proto__: null,
      value: createAdvice(
        {
          apply: /** @type {any} */ (
            intrinsics["aran.global_object"].Reflect.apply
          ),
          construct: /** @type {any} */ (
            intrinsics["aran.global_object"].Reflect.construct
          ),
          getValueProperty: /** @type {any} */ (
            intrinsics["aran.getValueProperty"]
          ),
        },
        { recordBranch, procedural },
      ),
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
});
