import { compileAran } from "../aran.mjs";
import { record } from "../../record/index.mjs";
import {
  advice_global_variable,
  createAdvice,
  weave,
} from "../../../aspects/tree-size.mjs";
import { open } from "node:fs/promises";
import { compileListPrecursorFailure } from "../failure.mjs";
import { toTestSpecifier } from "../../result.mjs";

const {
  JSON,
  Array,
  URL,
  Reflect: { defineProperty },
} = globalThis;

/**
 * @type {import("aran").Digest<{
 *   NodeHash: import("aran").EstreeNodePath,
 * }>}
 */
const digest = (_node, node_path, _file_path, _kind) => node_path;

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

const { setup, trans, retro } = compileAran(
  { ...trans_config, ...retro_config },
  toEvalPath,
);

////////////
// Export //
////////////

const handle = await open(
  new URL("../output/tree-size.jsonl", import.meta.url),
  "w",
);

/**
 * @type {(
 *   content: string,
 * ) => number}
 */
const hashFowler = (content) => {
  let hash = 2166136261; // FNV offset basis
  for (let i = 0; i < content.length; i++) {
    /* eslint-disable no-bitwise */
    hash ^= content.charCodeAt(i);
    /* eslint-disable no-bitwise */
    hash = (hash * 16777619) >>> 0; // Keep it a 32-bit unsigned integer
  }
  return hash;
};

const listPrecursorFailure = await compileListPrecursorFailure([
  "bare-comp",
  "stnd-void",
]);

/**
 * @type {import("../stage").Stage<[
 *   number,
 *   import("aran").EstreeNodePath,
 * ][]>}
 */
export default {
  // eslint-disable-next-line require-await
  setup: async ({ path, directive }) => {
    const specifier = toTestSpecifier(path, directive);
    const reasons = listPrecursorFailure(specifier);
    if (reasons.length > 0) {
      return { type: "exclude", reasons };
    } else {
      return {
        type: "include",
        state: [],
        flaky: false,
        negatives: [],
      };
    }
  },
  prepare: (buffer, context) => {
    const { intrinsics } = setup(context);
    /**
     * @type {(
     *   kind: import("aran").TestKind,
     *   size: number,
     *   tag: import("aran").EstreeNodePath,
     * ) => void}
     */
    const recordBranch = (_kind, size, tag) => {
      buffer.push([size, tag]);
    };
    const {
      ["aran.global_object"]: {
        Reflect: { apply, construct },
      },
      "aran.getValueProperty": getValueProperty,
    } = intrinsics;
    const descriptor = {
      __proto__: null,
      value: createAdvice(
        {
          // eslint-disable-next-line object-shorthand
          apply: /** @type {any} */ (apply),
          // eslint-disable-next-line object-shorthand
          construct: /** @type {any} */ (construct),
          // eslint-disable-next-line object-shorthand
          getValueProperty: /** @type {any} */ (getValueProperty),
        },
        { recordBranch },
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
  instrument: ({ kind, path, content: code1 }) => {
    const root1 = trans(path, kind, code1);
    const root2 = weave(root1);
    const code2 = retro(root2);
    return record({ path, content: code2 });
  },
  teardown: async (buffer) => {
    const { length } = buffer;
    /** @type {number[]} */
    const content = new Array(2 * buffer.length);
    for (let index = 0; index < length; index++) {
      const [size, tag] = buffer[index];
      content[2 * index] = size;
      content[2 * index + 1] = hashFowler(tag);
    }
    await handle.write(JSON.stringify(content) + "\n");
  },
};
