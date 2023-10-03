import { EvalContext } from "../lib/unbuild/context";

export {};

export type Variable = Brand<string, "unbuild.Variable">;

export type Label = Brand<string, "unbuild.Label">;

export type Root = Brand<string, "unbuild.Root">;

export type Path = Brand<string, "unbuild.Path">;

export type Hash = Brand<string, "unbuild.Hash">;

export type Atom<S> = {
  Label: Label;
  Source: estree.Source;
  Specifier: estree.Specifier;
  Variable: Variable;
  GlobalVariable: estree.Variable;
  Tag: {
    serial: S;
    initialization: Variable | null;
    context: EvalContext | null;
  };
};

export as namespace unbuild;
