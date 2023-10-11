import type { EvalContext } from "../lib/unbuild/context.d.ts";

export type Variable = Brand<string, "unbuild.Variable">;

export type Label = Brand<string, "unbuild.Label">;

export type Path = Brand<string, "unbuild.Path">;

export type Atom = {
  Label: Label;
  Source: estree.Source;
  Specifier: estree.Specifier;
  Variable: Variable;
  GlobalVariable: estree.Variable;
  Tag: {
    origin: Path;
    initialization: Variable | null;
    context: EvalContext | null;
  };
};

export as namespace unbuild;
