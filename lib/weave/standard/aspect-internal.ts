import type { ArgAtom } from "../atom";
import type { AspectTyping, Kind, Pointcut } from "./aspect";

export type InternalPointcut = Pointcut<ArgAtom>;

export type NormalInternalPointcut = {
  [key in Kind]: AspectTyping<never, ArgAtom, never>[key]["pointcut"];
};
