import type { VariableName } from "estree-sentry";
import type { Json, ValueOf } from "../../util/util";
import type { ArgAtom } from "../atom";
import type { AspectKind, AspectTyping } from "./aspect";

export type PointcutValue = ValueOf<{
  [kind in AspectKind]: {
    kind: kind;
    pointcut: AspectTyping<ArgAtom, never, never, Json[]>[kind]["pointcut"];
  };
}>;

export type Pointcut = {
  [name in VariableName]: PointcutValue;
};

export type PointcutEntry = [VariableName, PointcutValue];

export type OptimalPointcut = {
  [kind in AspectKind]: [
    VariableName,
    AspectTyping<ArgAtom, never, never, Json[]>[kind]["pointcut"],
  ][];
};

export type OptimalPointcutEntry<kind extends AspectKind> = [
  VariableName,
  AspectTyping<ArgAtom, never, never, Json[]>[kind]["pointcut"],
];
