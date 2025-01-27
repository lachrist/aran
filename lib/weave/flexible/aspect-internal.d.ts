import type { VariableName } from "estree-sentry";
import type { Json } from "../../util/util";
import type { ArgAtom } from "../atom";
import type {
  AspectKind,
  BlockPointcut as GenericBlockPointcut,
  StatementPointcut as GenericStatementPointcut,
  EffectPointcut as GenericEffectPointcut,
  ExpressionPointcut as GenericExpressionPointcut,
  Pointcut as GenericPointcut,
  PointcutElement,
} from "./aspect";

export type Pointcut = GenericPointcut<
  ArgAtom & {
    AdviceGlobalVariable: VariableName;
    Point: Json[];
  }
>;

export type BlockPointcut = GenericBlockPointcut<ArgAtom, Json[]>;

export type StatementPointcut = GenericStatementPointcut<ArgAtom, Json[]>;

export type EffectPointcut = GenericEffectPointcut<ArgAtom, Json[]>;

export type ExpressionPointcut = GenericExpressionPointcut<ArgAtom, Json[]>;

export type Predicate<pointcut> = {
  name: VariableName;
  pointcut: pointcut;
};

export type BlockPredicate = Predicate<BlockPointcut>;

export type StatementPredicate = Predicate<StatementPointcut>;

export type EffectPredicate = Predicate<EffectPointcut>;

export type ExpressionPredicate = Predicate<ExpressionPointcut>;

export type OptimalPointcut = {
  [key in AspectKind]: {
    name: VariableName;
    pointcut: PointcutElement<key, ArgAtom, Json[]>;
  }[];
};

export type PointcutEntry = [
  VariableName,
  {
    kind: AspectKind;
    pointcut: PointcutElement<AspectKind, ArgAtom, Json[]>;
  },
];
