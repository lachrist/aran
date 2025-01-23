import type { ArgAtom } from "../atom";
import type { AspectTyping, AspectKind, Pointcut } from "./aspect";

export type InternalPointcut = Pointcut<ArgAtom>;

export type NormalInternalPointcut = {
  [key in AspectKind]: AspectTyping<
    ArgAtom & {
      ScopeValue: never;
      StackValue: never;
      OtherValue: never;
      State: never;
      InitialState: never;
    }
  >[key]["pointcut"];
};
