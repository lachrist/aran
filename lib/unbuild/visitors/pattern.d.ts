import type { RootProgram } from "../program.d.ts";
import type { Scope } from "../scope/index.d.ts";

export type ListFinalNode = (
  site: {
    path: unbuild.Path;
    meta: unbuild.Meta;
  },
  context: {
    mode: "strict" | "sloppy";
    root: RootProgram;
    scope: Scope;
  },
  options: {
    variable: estree.Variable;
    right: aran.Expression<unbuild.Atom>;
  },
) => aran.Effect<unbuild.Atom>[];
