import type { Brand } from "../util/util";
import type { SourceValue, SpecifierValue, SpecifierName } from "estree-sentry";
import type {
  Node,
  Program,
  Statement,
  Effect,
  Expression,
  SegmentBlock,
  RoutineBlock,
} from "../lang/syntax";
import type { Hash } from "../hash";

export type ArgVariable = Brand<string, "weave.ArgVariable">;

export type ResVariable = Brand<string, "weave.ResVariable">;

export type Label = Brand<string, "weave.ArgLabel">;

export type Specifier = SpecifierValue | SpecifierName;

export type Source = SourceValue;

export type ArgAtom<H> = {
  Label: Label;
  Source: Source;
  Specifier: Specifier;
  Variable: ArgVariable;
  Tag: H;
};

export type ResAtom = {
  Label: Label;
  Source: Source;
  Specifier: Specifier;
  Variable: ResVariable;
  Tag: null;
};

export type ArgNode = Node<ArgAtom<Hash>>;
export type ResNode = Node<ResAtom>;
export type GenNode<H> = Node<ArgAtom<H>>;

export type ArgProgram = Program<ArgAtom<Hash>>;
export type ResProgram = Program<ResAtom>;
export type GenProgram<H> = Program<ArgAtom<H>>;

export type ArgSegmentBlock = SegmentBlock<ArgAtom<Hash>>;
export type ResSegmentBlock = SegmentBlock<ResAtom>;
export type GenSegmentBlock<H> = SegmentBlock<ArgAtom<H>>;

export type ArgRoutineBlock = RoutineBlock<ArgAtom<Hash>>;
export type ResRoutineBlock = RoutineBlock<ResAtom>;
export type GenRoutineBlock<H> = RoutineBlock<ArgAtom<H>>;

export type ArgStatement = Statement<ArgAtom<Hash>>;
export type ResStatement = Statement<ResAtom>;
export type GenStatement<H> = Statement<ArgAtom<H>>;

export type ArgEffect = Effect<ArgAtom<Hash>>;
export type ResEffect = Effect<ResAtom>;
export type GenEffect<H> = Effect<ArgAtom<H>>;

export type ArgExpression = Expression<ArgAtom<Hash>>;
export type ResExpression = Expression<ResAtom>;
export type GenExpression<H> = Expression<ArgAtom<H>>;
