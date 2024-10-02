import type { Brand } from "../util";
import type { SourceValue, SpecifierValue, SpecifierName } from "estree-sentry";
import type {
  Node,
  Program,
  Statement,
  Effect,
  Expression,
  ControlBlock,
  RoutineBlock,
} from "../lang";
import type { Warning } from "./warning";
import type { Hash } from "../hash";

export type ArgVariable = Brand<string, "weave.ArgVariable">;

export type ResVariable = Brand<string, "weave.ResVariable">;

export type Label = Brand<string, "weave.ArgLabel">;

export type ArgAtom = {
  Label: Label;
  Source: SourceValue;
  Specifier: SpecifierValue | SpecifierName;
  Variable: ArgVariable;
  Tag: Hash;
};

export type ResAtom = {
  Label: Label;
  Source: SourceValue;
  Specifier: SpecifierValue | SpecifierName;
  Variable: ResVariable;
  Tag: Warning[];
};

export type ArgNode = Node<ArgAtom>;

export type ResNode = Node<ResAtom>;

export type ArgProgram = Program<ArgAtom>;

export type ResProgram = Program<ResAtom>;

export type ArgControlBlock = ControlBlock<ArgAtom>;

export type ResControlBlock = ControlBlock<ResAtom>;

export type ArgRoutineBlock = RoutineBlock<ArgAtom>;

export type ResRoutineBlock = RoutineBlock<ResAtom>;

export type ArgStatement = Statement<ArgAtom>;

export type ResStatement = Statement<ResAtom>;

export type ArgEffect = Effect<ArgAtom>;

export type ResEffect = Effect<ResAtom>;

export type ArgExpression = Expression<ArgAtom>;

export type ResExpression = Expression<ResAtom>;
