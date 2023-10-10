import type { EvalContext } from "../lib/unbuild/context.d.ts";

export type ArgVariable = Brand<string, "weave.ArgVariable">;

export type ResVariable = Brand<string, "weave.ResVariable">;

export type Label = Brand<string, "weave.ArgLabel">;

export type OriginPath = Brand<string, "weave.OriginPath">;

export type TargetPath = Brand<string, "weave.TargetPath">;

export type ArgAtom = {
  Label: Label;
  Source: estree.Source;
  Specifier: estree.Specifier;
  Variable: ArgVariable;
  GlobalVariable: estree.Variable;
  Tag: {
    origin: OriginPath | null;
    context: EvalContext | null;
  };
};

export type ResAtom = {
  Label: Label;
  Source: estree.Source;
  Specifier: estree.Specifier;
  Variable: ResVariable;
  GlobalVariable: estree.Variable;
  Tag: ResVariable[];
};

export as namespace weave;
