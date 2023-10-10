import { StaticError } from "../util/error.mjs";
import { makeRootScope } from "./scope/index.mjs";
import { unbuildProgram } from "./visitors/program.mjs";

/**
 * @typedef {{
 *   kind: "script" | "module" | "eval",
 *   site: "global",
 *   enclave: boolean,
 *   context: {
 *     strict: false,
 *     root: import("../../type/options.d.ts").Root,
 *   },
 * }} GlobalOptions
 */

/**
 * @typedef {{
 *   kind: "eval",
 *   site: "local",
 *   enclave: false,
 *   context: import("./context.d.ts").EvalContext,
 * }} InternalLocalOptions
 */

/**
 * @typedef {{
 *   kind: "eval",
 *   site: "local",
 *   enclave: true,
 *   context: {
 *     strict: boolean,
 *     root: import("../../type/options.d.ts").Root,
 *   },
 * }} ExternalLocalOptions
 */

/**
 * @typedef {(
 *   GlobalOptions | InternalLocalOptions | ExternalLocalOptions
 * )} Options
 */

const ROOT = /** @type {unbuild.Path} */ ("$");

/**
 * @type {(
 *   node: estree.Program,
 *   options: Options,
 * ) => aran.Program<unbuild.Atom>}
 */
export const unbuild = (node, { kind, site, enclave, context }) => {
  switch (site) {
    case "global":
      return unbuildProgram(
        { node, path: ROOT },
        {
          strict: false,
          root: context.root,
          scope: makeRootScope({ site, enclave }),
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
        : unbuildProgram({ node, path: context.path }, context, {
            kind,
            site,
            enclave,
          });
    default:
      throw new StaticError("invalid site", site);
  }
};
