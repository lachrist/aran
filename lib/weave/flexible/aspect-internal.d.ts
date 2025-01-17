import type { VariableName } from "estree-sentry";
import type { Json } from "../../util/util";
import type { ArgAtom } from "../atom";
import type {
  AspectKind,
  AspectTyping,
  Pointcut as GenericPointcut,
} from "./aspect";

export type PointcutEntry = [
  VariableName,
  {
    kind: AspectKind;
    pointcut: AspectTyping<
      ArgAtom,
      never,
      never,
      Json[]
    >[AspectKind]["pointcut"];
  },
];

export type Pointcut = GenericPointcut<ArgAtom, VariableName>;

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
