import { EvalContext } from "../lib/unbuild/context";

export type ArgVariable = Brand<string, "weave.ArgVariable">;

export type ResVariable = Brand<string, "weave.ResVariable">;

export type Label = Brand<string, "weave.ArgLabel">;

export type Path = Brand<string, "weave.Path">;

export type ArgAtom<S> = {
  Label: Label;
  Source: estree.Source;
  Specifier: estree.Specifier;
  Variable: ArgVariable;
  EnclaveVariable: estree.Variable;
  Tag: { serial: S; context: EvalContext | null };
};

export type ResAtom = {
  Label: Label;
  Source: estree.Source;
  Specifier: estree.Specifier;
  Variable: ResVariable;
  EnclaveVariable: estree.Variable;
  Tag: ResVariable[];
};

export as namespace weave;
