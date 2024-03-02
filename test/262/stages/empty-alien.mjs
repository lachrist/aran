import { generate } from "astring";
import { instrument, setup } from "../../../lib/index.mjs";
import { readFile } from "node:fs/promises";
import { cwd } from "node:process";
import { fileURLToPath } from "node:url";
import { relative } from "node:path";
import { fromOutcome } from "../outcome.mjs";
import {
  HIDDEN,
  compileExpect,
  parseGlobal,
  parseLocal,
  warn,
} from "./util/index.mjs";

const { JSON, URL, SyntaxError } = globalThis;

const GLOBAL = /** @type {estree.Variable} */ ("globalThis");

const INTRINSIC = /** @type {estree.Variable} */ ("_ARAN_INTRINSIC_");

/**
 * @type {import("../../../lib/config").Config<
 *   import("./util/aran").Base,
 *   import("./util/aran").Location
 * >}
 */
const config = {
  pointcut: ["eval.before"],
  locate: (path, base) =>
    /** @type {import("./util/aran").Location} */ (`${base}#${path}`),
  global_variable: GLOBAL,
  advice_variable: /** @type {estree.Variable} */ ("_ARAN_ADVICE_"),
  intrinsic_variable: INTRINSIC,
  escape_prefix: /** @type {estree.Variable} */ ("_ARAN_ESCAPE_"),
  reify_global: false,
  debug_alias: true,
};

/** @type {test262.Stage} */
export default {
  requirement: ["identity", "parsing"],
  exclusion: [],
  expect: compileExpect(
    JSON.parse(
      await readFile(
        new URL("empty-alien.manual.json", import.meta.url),
        "utf8",
      ),
    ),
  ),
  createInstrumenter: ({ record, warning }) => {
    let counter = 0;
    return {
      setup: [
        generate(
          setup({
            global_variable: GLOBAL,
            intrinsic_variable: INTRINSIC,
          }),
        ),
        "var __ARAN_EXEC__ = $262.runScript;",
      ],
      globals: {
        ...HIDDEN,
        _ARAN_ADVICE_: {
          __proto__: null,
          value: /** @type {import("./util/aran").Advice} */ ({
            "__proto__": null,
            "eval.before": (content, context, location) =>
              typeof content === "string"
                ? fromOutcome(
                    parseLocal(
                      content,
                      /** @type {import("./util/aran").Base} */ (
                        /** @type {string} */ (location)
                      ),
                      context,
                    ),
                    (program) => {
                      counter += 1;
                      const { content } = record({
                        kind: "script",
                        url: new URL(`eval:///${counter}`),
                        content: generate(
                          warn(
                            warning === "console",
                            instrument(program, config),
                          ),
                        ),
                      });
                      return content;
                    },
                    (message) =>
                      `throw new globalThis.SyntaxError(${JSON.stringify(
                        message,
                      )})`,
                  )
                : content,
          }),
          writable: false,
          enumerable: false,
          configurable: false,
        },
      },
      instrument: ({ kind, url, content }) =>
        fromOutcome(
          parseGlobal(
            content,
            /** @type {import("./util/aran").Base} */ (
              url.protocol === "file:"
                ? relative(cwd(), fileURLToPath(url))
                : url.href
            ),
            kind,
          ),
          (program) =>
            record({
              kind,
              url,
              content: generate(
                warn(warning === "console", instrument(program, config)),
              ),
            }),
          (message) => {
            throw SyntaxError(message);
          },
        ),
    };
  },
};
