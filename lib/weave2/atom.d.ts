import {
  Program,
  RoutineBlock,
  ControlBlock,
  Statement,
  Effect,
  Expression,
  Node,
} from "../../type/aran";

export type ArgVariable = Brand<string, "weave.ArgVariable">;

export type ResVariable = Brand<string, "weave.ResVariable">;

export type Label = Brand<string, "weave.ArgLabel">;

export type Path = Brand<string, "weave.Path">;

export type ArgAtom = {
  Label: Label;
  Source: estree.Source;
  Specifier: estree.Specifier;
  Variable: ArgVariable;
  GlobalVariable: estree.Variable;
  Tag: Path;
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

export type ArgNode = Node<ArgAtom>;

export type ResNode = Node<ResAtom>;
