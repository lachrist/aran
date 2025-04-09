import { runInContext } from "node:vm";
import { setupile, retropile, transpile } from "../../../lib/index.mjs";
import { inspectErrorMessage, recreateError } from "../util/index.mjs";
import { AranTestError } from "../error.mjs";
import { generate, parseGlobal, parseLocal } from "./estree.mjs";
import { record } from "../record/index.mjs";

const {
  JSON: { parse: parseJson },
} = globalThis;

/**
 * @type {(
 *   data: string,
 * ) => import("../../../lib/trans/source.d.ts").DeepLocalSitu}
 */
const parseSitu = parseJson;

/**
 * @type {<
 *   path extends string,
 *   hash extends number | string,
 * >(
 *   config: (
 *     & import("aran").TransConfig<{NodeHash: hash, FilePath: path}>
 *     & import("aran").RetroConfig
 *   ),
 *   toEvalPath: (hash: hash) => path,
 * ) => {
 *   prepare: (
 *     context: import("node:vm").Context,
 *     config: { record_directory: null | URL },
 *   ) => {
 *     intrinsics: import("aran").IntrinsicRecord,
 *     $262: import("../$262.d.ts").$262,
 *   },
 *   trans: <atom extends import("aran").Atom & { Tag: hash }>(
 *     path: path,
 *     kind: "script" | "module" | "eval",
 *     code: string,
 *   ) => import("aran").Program<atom>,
 *   retro: (
 *     root: import("aran").Program<import("aran").Atom>,
 *   ) => string,
 * }}
 */
export const compileAran = (config, toEvalPath) => {
  const SETUP = generate(setupile(config));
  return {
    prepare: (context, { record_directory }) => {
      /** @type {import("aran").IntrinsicRecord} */
      const intrinsics = /** @type {any} */ (runInContext(SETUP, context));
      /** @type {import("../$262.d.ts").$262} */
      const $262 = /** @type {any} */ (intrinsics["aran.global_object"]).$262;
      const { SyntaxError } = intrinsics["aran.global_object"];
      intrinsics["aran.transpileEvalCode"] = (code, situ, hash) => {
        try {
          return transpile(
            {
              kind: "eval",
              situ: parseSitu(situ),
              path: toEvalPath(/** @type {any} */ (hash)),
              root: parseLocal("eval", code),
            },
            config,
          );
        } catch (error) {
          throw recreateError(error, {
            SyntaxError,
            AranSyntaxError: SyntaxError,
          });
        }
      };
      intrinsics["aran.retropileEvalCode"] = (root) => {
        try {
          const { content } = record(
            {
              path: "dynamic://eval/local",
              content: generate(retropile(root, config)),
            },
            record_directory,
          );
          return content;
        } catch (error) {
          throw new AranTestError(inspectErrorMessage(error), error);
        }
      };
      return { intrinsics, $262 };
    },
    trans: (path, kind, code) =>
      transpile(
        {
          kind,
          path,
          situ: { type: "global" },
          root: parseGlobal(kind, code),
        },
        config,
      ),
    retro: (root) => generate(retropile(root, config)),
  };
};
