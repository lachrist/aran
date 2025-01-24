import type { Brand, Json } from "../util/util";
import type { SourceValue, SpecifierValue, SpecifierName } from "estree-sentry";
import type {
  Node,
  Program,
  Statement,
  Effect,
  Expression,
  SegmentBlock,
  RoutineBlock,
  Intrinsic,
} from "../lang/syntax";

export type Tag = Brand<Json, "weave.Tag">;

export type ArgVariable = Brand<string, "weave.ArgVariable">;

export type ResVariable = Brand<string, "weave.ResVariable">;

export type Label = Brand<string, "weave.ArgLabel">;

export type Specifier = SpecifierValue | SpecifierName;

export type Source = SourceValue;

export type ArgAtom = {
  Label: Label;
  Source: Source;
  Specifier: Specifier;
  Variable: ArgVariable;
  Tag: Tag;
};

export type ResAtom = {
  Label: Label;
  Source: Source;
  Specifier: Specifier;
  Variable: ResVariable;
  Tag: Tag;
};

export type ArgBinding = [ArgVariable, Intrinsic];
export type ResBinding = [ResVariable, Intrinsic];

export type ArgNode = Node<ArgAtom>;
export type ResNode = Node<ResAtom>;

export type ArgProgram = Program<ArgAtom>;
export type ResProgram = Program<ResAtom>;

export type ArgSegmentBlock = SegmentBlock<ArgAtom>;
export type ResSegmentBlock = SegmentBlock<ResAtom>;

export type ArgRoutineBlock = RoutineBlock<ArgAtom>;
export type ResRoutineBlock = RoutineBlock<ResAtom>;

export type ArgStatement = Statement<ArgAtom>;
export type ResStatement = Statement<ResAtom>;

export type ArgEffect = Effect<ArgAtom>;
export type ResEffect = Effect<ResAtom>;

export type ArgExpression = Expression<ArgAtom>;
export type ResExpression = Expression<ResAtom>;
