import { Warning } from "./warning";
import { Header } from "../header";
import { EarlyError } from "./early-error";
import { Condition } from "./condition";
import { Context } from "../context";
import { BaseVariable, MetaVariable } from "./variable";
import { Site } from "./site";
import { Isolate } from "../../type/aran";
import { Sequence } from "./sequence";

export type WarningPrelude = {
  type: "warning";
  data: Warning;
};

export type ContextPrelude = {
  type: "context";
  data: [unbuild.Path, Context];
};

export type HeaderPrelude = {
  type: "header";
  data: Header;
};

export type EarlyErrorPrelude = {
  type: "early-error";
  data: EarlyError;
};

export type TemplatePrelude = {
  type: "template";
  data: {
    variable: MetaVariable;
    value: Site<estree.TaggedTemplateExpression>;
    path: unbuild.Path;
  };
};

export type DuplicatePrelude = {
  type: "duplicate";
  data: {
    frame: "aran.global" | "aran.record";
    variable: BaseVariable;
    path: unbuild.Path;
  };
};

export type MetaDeclarationPrelude = {
  type: "meta-declaration";
  data: [MetaVariable, Isolate];
};

export type BaseDeclarationPrelude = {
  type: "base-declaration";
  data: [BaseVariable, Isolate];
};

export type DeclarationPrelude =
  | MetaDeclarationPrelude
  | BaseDeclarationPrelude;

export type PrefixPrelude = {
  type: "prefix";
  data: aran.Effect<unbuild.Atom>;
};

export type ConditionPrelude = {
  type: "condition";
  data: Condition;
};

export type Prelude =
  | WarningPrelude
  | ContextPrelude
  | HeaderPrelude
  | EarlyErrorPrelude
  | TemplatePrelude
  | DuplicatePrelude
  | BaseDeclarationPrelude
  | MetaDeclarationPrelude
  | PrefixPrelude
  | ConditionPrelude;

type ProgramPrelude = WarningPrelude | ContextPrelude;

export type ProgramSequence = Sequence<
  ProgramPrelude,
  aran.Program<unbuild.Atom>
>;

type BlockPrelude =
  | WarningPrelude
  | ContextPrelude
  | HeaderPrelude
  | EarlyErrorPrelude
  | TemplatePrelude
  | DuplicatePrelude;

export type ClosureBlockSequence = Sequence<
  BlockPrelude,
  aran.ClosureBlock<unbuild.Atom>
>;

export type ControlBlockSequence = Sequence<
  BlockPrelude,
  aran.ControlBlock<unbuild.Atom>
>;

export type NodePrelude =
  | WarningPrelude
  | ContextPrelude
  | HeaderPrelude
  | EarlyErrorPrelude
  | TemplatePrelude
  | DuplicatePrelude
  | BaseDeclarationPrelude
  | MetaDeclarationPrelude;

export type StatementSequence = Sequence<
  NodePrelude,
  aran.Statement<unbuild.Atom>[]
>;

export type EffectSequence = Sequence<NodePrelude, aran.Effect<unbuild.Atom>[]>;

export type ExpressionSequence = Sequence<
  NodePrelude,
  aran.Expression<unbuild.Atom>
>;

type ChainPrelude =
  | WarningPrelude
  | ContextPrelude
  | HeaderPrelude
  | EarlyErrorPrelude
  | TemplatePrelude
  | DuplicatePrelude
  | MetaDeclarationPrelude
  | PrefixPrelude
  | ConditionPrelude;
