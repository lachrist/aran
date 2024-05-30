import {
  Node,
  Program,
  RoutineBlock,
  ControlBlock,
  Statement,
  Effect,
  Expression,
} from "../../type/aran";
import { Path } from "../path";

export type ArgVariable = Brand<string, "weave.ArgVariable">;

export type ResVariable = Brand<string, "weave.ResVariable">;

export type Label = Brand<string, "weave.ArgLabel">;

export type ArgAtom = {
  Label: Label;
  Source: estree.Source;
  Specifier: estree.Specifier;
  Variable: ArgVariable;
  Tag: Path;
};

export type ResAtom = {
  Label: Label;
  Source: estree.Source;
  Specifier: estree.Specifier;
  Variable: ResVariable;
  Tag: null;
};

export type ArgNode = Node<ArgAtom>;

export type ResNode = Node<ResAtom>;

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
