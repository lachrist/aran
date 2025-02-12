import { compileAran } from "../../../aran.mjs";
import { record } from "../../../../record/index.mjs";
import {
  advice_global_variable,
  createAdvice,
  digest,
  toEvalPath,
  weave,
} from "./aspect.mjs";
import { open } from "node:fs/promises";
import { compileListPrecursorFailure } from "../../../failure.mjs";
import { compileListThresholdExclusion, threshold } from "../threshold.mjs";
import { AranExecError } from "../../../../error.mjs";
import { printBranching } from "../branching.mjs";

const {
  URL,
  Reflect: { apply, defineProperty },
} = globalThis;

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
 *     buffer: [number, import("./aspect.mjs").NodeHash][],
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
  const listThresholdExclusion = await compileListThresholdExclusion(include);
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
       *   hash: import("./aspect.mjs").NodeHash,
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
      const advice = createAdvice({
        instrument_dynamic_code: include === "comp",
        toEvalPath,
        trans,
        weave,
        retro,
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
        procedural,
        record_directory,
        recordBranch,
        Function: /** @type {any} */ (intrinsics.globalThis.Function),
        evalGlobal: /** @type {any} */ (intrinsics.globalThis.eval),
        evalScript: /** @type {any} */ (
          /** @type {{$262: import("../../../../$262").$262}} */ (
            /** @type {unknown} */ (intrinsics.globalThis)
          ).$262.evalScript
        ),
        String: intrinsics.globalThis.String,
        SyntaxError: intrinsics.globalThis.SyntaxError,
      });
      const descriptor = {
        __proto__: null,
        value: advice,
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
        const root1 = trans(
          /** @type {import("./aspect.mjs").FilePath} */ (path),
          kind,
          code1,
        );
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
