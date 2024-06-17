import type { Brand } from "../util";
import type { Source, Specifier } from "../estree";
import type {
  Node,
  Program,
  Statement,
  Effect,
  Expression,
  ControlBlock,
  RoutineBlock,
  PreludeBlock,
} from "../lang";
import type { Path } from "../path";

export type ArgVariable = Brand<string, "weave.ArgVariable">;

export type ResVariable = Brand<string, "weave.ResVariable">;

export type Label = Brand<string, "weave.ArgLabel">;

export type ArgAtom = {
  Label: Label;
  Source: Source;
  Specifier: Specifier;
  Variable: ArgVariable;
  Tag: Path;
};

export type ResAtom = {
  Label: Label;
  Source: Source;
  Specifier: Specifier;
  Variable: ResVariable;
  Tag: null;
};

export type ArgNode = Node<ArgAtom>;

export type ResNode = Node<ResAtom>;

export type ArgProgram = Program<ArgAtom>;

export type ResProgram = Program<ResAtom>;

export type ArgControlBlock = ControlBlock<ArgAtom>;

export type ResControlBlock = ControlBlock<ResAtom>;

export type ArgRoutineBlock = RoutineBlock<ArgAtom>;

export type ResRoutineBlock = RoutineBlock<ResAtom>;

export type ArgPreludeBlock = PreludeBlock<ArgAtom>;

export type ResPreludeBlock = PreludeBlock<ResAtom>;

export type ArgStatement = Statement<ArgAtom>;

export type ResStatement = Statement<ResAtom>;

export type ArgEffect = Effect<ArgAtom>;

export type ResEffect = Effect<ResAtom>;

export type ArgExpression = Expression<ArgAtom>;

export type ResExpression = Expression<ResAtom>;
