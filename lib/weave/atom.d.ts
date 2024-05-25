import {
  Program,
  RoutineBlock,
  ControlBlock,
  Statement,
  Effect,
  Expression,
} from "../../type/aran";

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
  Tag: OriginPath;
};

export type ResAtom = {
  Label: Label;
  Source: estree.Source;
  Specifier: estree.Specifier;
  Variable: ResVariable;
  GlobalVariable: estree.Variable;
  Tag: null;
};

export type ArgProgram = Program<ArgAtom>;

export type ResProgram = Program<ResAtom>;

export type ArgRoutineBlock = RoutineBlock<ArgAtom>;

export type ResRoutineBlock = RoutineBlock<ResAtom>;

export type ArgControlBlock = ControlBlock<ArgAtom>;

export type ResControlBlock = ControlBlock<ResAtom>;

export type ArgStatement = Statement<ArgAtom>;

export type ResStatement = Statement<ResAtom>;

export type ArgEffect = Effect<ArgAtom>;

export type ResEffect = Effect<ResAtom>;

export type ArgExpression = Expression<ArgAtom>;

export type ResExpression = Expression<ResAtom>;
