import { generate } from "astring";
import { instrument, setup } from "../../../lib/index.mjs";
import { readFile } from "node:fs/promises";
import {
  CONFIG,
  SETUP_CONFIG,
  HIDDEN,
  compileExpect,
  parseGlobal,
  parseLocal,
  makeNodeBase,
  makeRootBase,
} from "./util/index.mjs";

const { JSON, URL } = globalThis;

const SETUP = [generate(setup(SETUP_CONFIG))];

/** @type {test262.Stage} */
export default {
  requirement: ["identity", "parsing"],
  exclusion: [],
  expect: compileExpect(
    JSON.parse(
      await readFile(
        new URL("empty-native.manual.json", import.meta.url),
        "utf8",
      ),
    ),
  ),
  createInstrumenter: ({ record, warning }) => {
    let counter = 0;
    return {
      setup: SETUP,
      globals: {
        ...HIDDEN,
        [CONFIG.advice_variable]: {
          __proto__: null,
          value: /** @type {import("./util/aran").Advice} */ ({
            "__proto__": null,

            "eval.before": (content, context, location) => {
              if (typeof content === "string") {
                counter += 1;
                return record({
                  kind: "script",
                  url: new URL(`eval:///${counter}`),
                  content: generate(
                    instrument(
                      parseLocal(content, makeNodeBase(location), context),
                      {
                        ...CONFIG,
                        global_declarative_record: "native",
                        warning,
                        early_syntax_error: "embed",
                      },
                    ),
                  ),
                }).content;
              } else {
                return content;
              }
            },
          }),
          writable: false,
          enumerable: false,
          configurable: false,
        },
      },
      instrument: ({ kind, url, content }) => {
        if (url.href.includes("/test262/harness/")) {
          return { kind, url, content };
        } else {
          return record({
            kind,
            url,
            content: generate(
              instrument(parseGlobal(content, makeRootBase(url), kind), {
                ...CONFIG,
                global_declarative_record: "native",
                warning,
                early_syntax_error: "throw",
              }),
            ),
          });
        }
      },
    };
  },
};
