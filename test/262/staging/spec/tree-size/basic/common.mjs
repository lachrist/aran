import { compileAran } from "../../../aran.mjs";
import { record } from "../../../../record/index.mjs";
import { advice_global_variable, createAdvice, weave } from "./aspect.mjs";
import { open } from "node:fs/promises";
import { compileListPrecursorFailure } from "../../../failure.mjs";
import { hashFowler32, hashXor16 } from "../../../../util/hash.mjs";
import { listThresholdExclusion, threshold } from "../threshold.mjs";
import { AranExecError } from "../../../../error.mjs";

const {
  JSON,
  Array,
  URL,
  Reflect: { apply, defineProperty },
} = globalThis;

/**
 * @typedef {string & { __brand: "NodeHash" }} NodeHash
 */

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
 * @type {(
 *   config: {
 *     procedural: "inter" | "intra",
 *     include: "main" | "comp",
 *   },
 * ) => Promise<import("../../../stage").Stage<
 *   {
 *     handle: import("node:fs/promises").FileHandle,
 *     record_directory: null | URL,
 *   },
 *   {
 *     handle: import("node:fs/promises").FileHandle,
 *     record_directory: null | URL,
 *     index: import("../../../../test-case").TestIndex,
 *     buffer: [number, NodeHash][],
 *   },
 * >>}
 */
export const compileStage = async ({ procedural, include }) => {
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
  return {
    open: async ({ record_directory }) => ({
      record_directory,
      handle: await open(
        new URL(`stage-${procedural}-${include}-output.jsonl`, import.meta.url),
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
      /**
       * @type {(
       *   kind: import("aran").TestKind,
       *   size: number,
       *   hash: NodeHash,
       * ) => void}
       */
      const recordBranch = (kind, size, hash) => {
        if (buffer.length >= threshold) {
          throw new AranExecError("buffer overflow", {
            index,
            kind,
            size,
            threshold,
            buffer,
          });
        }
        buffer.push([size, hash]);
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
            createArray: /** @type {any} */ (
              (/** @type {any[]} */ values) =>
                apply(intrinsics.globalThis.Array.of, null, values)
            ),
            getValueProperty: /** @type {any} */ (
              intrinsics["aran.getValueProperty"]
            ),
            Function: /** @type {any} */ (intrinsics.globalThis.Function),
            evalGlobal: /** @type {any} */ (intrinsics.globalThis.eval),
            evalScript: /** @type {any} */ (
              /** @type {{$262: import("../../../../$262").$262}} */ (
                /** @type {unknown} */ (intrinsics.globalThis)
              ).$262.evalScript
            ),
          },
          {
            instrument_dynamic_code: include === "comp",
            SyntaxError: intrinsics.globalThis.SyntaxError,
            record_directory,
            recordBranch,
            procedural,
            trans,
            retro,
          },
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
    instrument: (
      { record_directory },
      { type, kind, path, content: code1 },
    ) => {
      if (include === "comp" || type === "main") {
        const root1 = trans(path, kind, code1);
        const root2 = weave(root1);
        const code2 = retro(root2);
        return record({ path, content: code2 }, record_directory);
      } else {
        return record({ path, content: code1 }, record_directory);
      }
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
};
