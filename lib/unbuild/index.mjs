import { StaticError } from "../util/error.mjs";
import { makeRootScope } from "./scope/index.mjs";
import { unbuildProgram } from "./visitors/program.mjs";

/**
 * @template S
 * @typedef {import("./context.d.ts").Serialize<S>} Serialize
 */

/**
 * @typedef {import("./context.d.ts").Digest} Digest
 */

/**
 * @typedef {import("./context.d.ts").EvalContext} EvalContext
 */

/**
 * @template S
 * @typedef {{
 *   serialize: Serialize<S>,
 *   digest: Digest,
 * }} CommonOptions
 */

/**
 * @template S
 * @typedef {CommonOptions<S> & {
 *   kind: "script" | "module" | "eval",
 *   site: "global",
 *   enclave: boolean,
 *   context: {
 *     strict: false,
 *     root: unbuild.Root,
 *   },
 * }} GlobalOptions
 */

/**
 * @template S
 * @typedef {CommonOptions<S> & {
 *   kind: "eval",
 *   site: "local",
 *   enclave: false,
 *   context: EvalContext,
 * }} InternalLocalOptions
 */

/**
 * @template S
 * @typedef {CommonOptions<S> & {
 *   kind: "eval",
 *   site: "local",
 *   enclave: true,
 *   context: {
 *     strict: boolean,
 *     root: unbuild.Root,
 *   },
 * }} ExternalLocalOptions
 */

/**
 * @template S
 * @typedef {(
 *   | GlobalOptions<S>
 *   | InternalLocalOptions<S>
 *   | ExternalLocalOptions<S>
 * )} Options
 */

const ROOT = /** @type {unbuild.Path} */ ("$");

/**
 * @type {<S>(
 *   node: estree.Program,
 *   options: Options<S>,
 * ) => aran.Program<unbuild.Atom<S>>}
 */
export const unbuild = (
  node,
  { kind, site, enclave, context, serialize, digest },
) => {
  switch (site) {
    case "global":
      return unbuildProgram(
        { node, path: ROOT },
        {
          strict: false,
          root: context.root,
          scope: makeRootScope({ site, enclave }),
          serialize,
          digest,
          private: {},
          record: {
            "this": ".illegal",
            "import.meta": ".illegal",
            "new.target": ".illegal",
            "super.constructor": ".illegal",
            "super.field": ".illegal",
            "super.prototype": ".illegal",
          },
        },
        { kind, site, enclave },
      );
    case "local":
      return enclave
        ? unbuildProgram(
            { node, path: ROOT },
            {
              strict: context.strict,
              root: context.root,
              scope: makeRootScope({ site, enclave }),
              serialize,
              digest,
              private: {},
              record: {
                "this": "this",
                "import.meta": "import.meta",
                "new.target": "new.target",
                "super.constructor": ".enclave",
                "super.field": ".illegal",
                "super.prototype": ".enclave",
              },
            },
            { kind, site, enclave },
          )
        : unbuildProgram(
            { node, path: ROOT },
            {
              ...context,
              digest,
              serialize,
            },
            { kind, site, enclave },
          );
    default:
      throw new StaticError("invalid site", site);
  }
};
